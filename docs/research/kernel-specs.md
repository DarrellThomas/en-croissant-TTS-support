# Chess World Model — Custom Kernel Specifications

**For:** Blackwell Kernel Workshop (bwk) team
**Target:** RTX 5090 (sm_120, consumer Blackwell)
**Model:** Chess World Model (Conv VAE + MDN-RNN + Sparse Autoencoder)
**Date:** 2026-03-22

---

## Model Size Summary

| Component | Parameters | VRAM (fp32) | VRAM (bf16) |
|---|---|---|---|
| VAE Encoder | ~1.4M | 5.3 MB | 2.7 MB |
| VAE Decoder | ~1.4M | 5.3 MB | 2.7 MB |
| MDN-RNN | ~3.8M | 14.5 MB | 7.3 MB |
| Sparse Autoencoder | ~2.1M | 8.0 MB | 4.0 MB |
| **Total model** | **~8.7M** | **33 MB** | **17 MB** |

## Training Memory Budget (RTX 5090, 32GB GDDR7)

| Item | Size | Notes |
|---|---|---|
| Model weights (bf16) | 17 MB | All three components |
| Optimizer state (AdamW) | 66 MB | 2x fp32 moments per param |
| Gradients | 33 MB | Same size as weights (fp32) |
| Activations (batch=256, seq=60) | ~3.5 GB | Dominated by VAE conv activations |
| Position tensors (batch) | ~188 MB | 256 x 61 x 20 x 8 x 8 x 4 bytes |
| Latent sequences | ~15 MB | 256 x 61 x 256 x 4 bytes |
| MDN intermediates | ~120 MB | 256 x 60 x 5 x 256 x 4 bytes (mu/sigma) |
| SAE training data | ~2 GB | 1M h_t vectors cached (phase 3 only) |
| **Peak training** | **~6 GB** | **Fits easily in 32GB** |
| **Headroom** | **~26 GB free** | Plenty for larger batches or models |

This is a tiny model. VRAM is not a concern.

---

## Kernel #1: Fused MLP Backward (Highest Priority)

### What exists

Forward kernel `fused_mlp_sm120`: `Y = relu_sq(X @ W1) @ W2` (single kernel launch)

### What we need

Backward pass computing `dL/dX`, `dL/dW1`, `dL/dW2` from incoming gradient `dL/dY`.

### Dimensions

```
X:  [B, D_in]     typical: [16384, 512]     (bf16)
W1: [D_in, D_hid]  typical: [512, 2048]      (bf16)
W2: [D_hid, D_out] typical: [2048, 512]      (bf16)
dY: [B, D_out]     typical: [16384, 512]     (bf16, incoming gradient)
```

### Computation

```
Forward (for reference):
  Hidden    = X @ W1              → [B, D_hid] = [16384, 2048]
  Activated = relu_sq(Hidden)     → same shape, relu_sq(x) = x^2 if x > 0, else 0
  Y         = Activated @ W2      → [B, D_out]

Backward:
  dActivated = dY @ W2^T                          — GEMM [16384,512] x [512,2048] → [16384,2048]
  dW2        = Activated^T @ dY                    — GEMM [2048,16384] x [16384,512] → [2048,512]
  dHidden    = dActivated * relu_sq_grad(Hidden)   — pointwise, relu_sq_grad(x) = 2x if x>0, else 0
  dW1        = X^T @ dHidden                       — GEMM [512,16384] x [16384,2048] → [512,2048]
  dX         = dHidden @ W1^T                      — GEMM [16384,2048] x [2048,512] → [16384,512]
```

### Fusion opportunity

Fuse the middle three ops (`dActivated` -> `dHidden` -> `dW1`/`dX`) into a single kernel that keeps the `[16384, 2048]` intermediate in shared memory or registers, never writing it to global memory.

### Notes

- All tensors bf16. Accumulation in fp32. Output gradients in bf16.
- Peak intermediate: `[16384, 2048]` x 2 bytes = 64 MB (fits in VRAM easily)
- Called ~50,000 times per epoch
- Used in: MDN head, SAE encoder/decoder, VAE linear layers

---

## Kernel #2: Fused Conv2d 3x3 + BatchNorm + ReLU Backward (High Priority)

### What exists

Standard PyTorch `nn.Conv2d` + `nn.BatchNorm2d` + `F.relu` in ResBlock forward.

### What we need

Fused backward for the entire `conv+bn+relu` chain. Currently three separate kernel launches and three global memory round-trips per ResBlock. Fusing saves 2 launches and eliminates intermediate writes.

### Dimensions

```
X:  [B, C, 8, 8]    typical: B=16384, C=128    (bf16)
W:  [C, C, 3, 3]    typical: [128, 128, 3, 3]  (bf16)
dY: [B, C, 8, 8]    same as X shape             (bf16)
```

### Key insight: spatial size is ALWAYS 8x8

This is a chess board. The spatial dimensions are a constant. You can hardcode `H=8, W=8` for maximum performance. The entire feature map for a single sample fits in shared memory: `128 x 8 x 8 x 2 = 16 KB`.

### Computation

```
Weight gradient:
  dW = sum_over_batch(dY ★ X)    — correlation (not convolution)
  Each 3x3 filter gradient is a reduction over batch x spatial positions
  [128, 128, 3, 3] = 147,456 gradient values

Input gradient:
  dX = dY ★_full W^T             — full convolution with flipped filters
  Can be computed as GEMM via im2col, or directly given the small spatial size

BatchNorm backward:
  dX_bn = (1/sigma) * (dY_bn - mean(dY_bn) - X_normalized * mean(dY_bn * X_normalized))
  Fuse with conv backward to avoid materializing intermediate

ReLU backward:
  dX_relu = dY * (X > 0)         — trivial pointwise mask
  Fuse with bn backward
```

### Notes

- cuDNN handles this reasonably well already. Custom kernel is worthwhile only if fusing conv+bn+relu backward into a single launch.
- Called ~400,000 times per epoch (8 conv layers x 50,000 batches)
- 3x3 kernel, padding=1, stride=1, no dilation — the simplest possible conv config
- Consider Winograd for 3x3 on 8x8 — the small spatial size makes the transform overhead low relative to compute

---

## Kernel #3: MDN Loss Backward (Medium Priority)

### What exists

PyTorch implementation using standard ops (`logsumexp`, elementwise, reduction).

### What we need

Fused kernel computing the gradient of negative log-likelihood under a Gaussian mixture model.

### Dimensions

```
pi:     [B, T, K]      typical: [256, 60, 5]       (bf16)
mu:     [B, T, K, D]   typical: [256, 60, 5, 256]  (bf16)
sigma:  [B, T, K, D]   typical: [256, 60, 5, 256]  (bf16)
target: [B, T, D]      typical: [256, 60, 256]      (bf16)
mask:   [B, T]          typical: [256, 60]           (fp32)
```

### Computation

```
For each (b, t) independently:
  1. Compute log-prob under each Gaussian k:
     log_N_k = -0.5 * sum_d( log(2*pi*sigma_k_d^2) + (target_d - mu_k_d)^2 / sigma_k_d^2 )

  2. Compute responsibilities (posterior weights):
     r_k = softmax(log_pi_k + log_N_k)

  3. Compute gradients:
     dmu_k_d    = r_k * (target_d - mu_k_d) / sigma_k_d^2
     dsigma_k_d = r_k * ((target_d - mu_k_d)^2 / sigma_k_d^3 - 1/sigma_k_d)
     dpi_k      = r_k - pi_k
```

### Fusion opportunity

The naive PyTorch implementation materializes `[256, 60, 5, 256]` intermediates three times (var, log_prob, weighted_diff). Total: `256 x 60 x 5 x 256 x 4 x 3 = ~240 MB` of temporary memory.

A fused kernel computes everything in registers per `(b, t)` work item:
- Each thread block handles one `(b, t)` pair
- Iterates over `K=5` Gaussians and `D=256` dimensions
- Peak intermediate per `(b,t)`: `5 x 256 x 4 = 5 KB` — fits in registers/smem
- Total independent work items: `256 x 60 = 15,360` — good parallelism

### Notes

- Called ~50,000 times per epoch
- K=5 is small enough to unroll the Gaussian loop completely
- D=256 can be tiled across threads (e.g., 256 threads per block, one dim each)

---

## General Notes

```
Target:        sm_120 (RTX 5090, consumer Blackwell)
Precision:     BF16 data, FP32 accumulation
Batch sizes:   256-4096 (training), 1 (inference)
Spatial:       Always 8x8 (chess board — hardcode this)
VRAM total:    ~6 GB peak during training out of 32 GB available
Sequence:      Up to 60 timesteps per game segment
Model:         ~8.7M params — this is NOT a large model
```

The bottleneck is **throughput**, not memory. We're processing millions of positions per epoch. Per-epoch kernel call counts:

| Kernel | Calls per epoch | Priority |
|---|---|---|
| Fused MLP backward | ~50,000 | Highest |
| Conv+BN+ReLU backward | ~400,000 | High |
| MDN loss backward | ~50,000 | Medium |

### Existing bwk kernels we'll use

| Kernel | Where used |
|---|---|
| `fused_mlp_sm120` | Forward pass of MDN head, SAE, VAE linear layers |
| `bf16_gemm` | Weight updates, any standalone matrix multiply |
| `rmsnorm` | Could replace BatchNorm if we switch to RMSNorm (experiment) |

### Potential future kernels

| Kernel | Purpose |
|---|---|
| Fused LSTM cell | Replace cuDNN LSTM with custom kernel that includes move embedding concat |
| Sparse matmul | SAE encoder has sparse activations — exploit sparsity in backward |
| Fused position encoder | Board tensor (20x8x8) → latent vector in a single kernel (conv stack + linear) |

---

## Integration

Kernels should follow the existing bwk pattern:
- C++ source in `csrc/`
- Python bindings via pybind11
- PyTorch `autograd.Function` wrapper for seamless integration
- Install via `pip install -e .`

Example autograd wrapper:

```python
class FusedMLPFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, X, W1, W2):
        Y = fused_mlp_sm120(X, W1, W2)
        ctx.save_for_backward(X, W1, W2)
        return Y

    @staticmethod
    def backward(ctx, dY):
        X, W1, W2 = ctx.saved_tensors
        dX, dW1, dW2 = fused_mlp_backward_sm120(X, W1, W2, dY)
        return dX, dW1, dW2
```
