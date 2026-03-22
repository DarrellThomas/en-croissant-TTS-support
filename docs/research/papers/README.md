# Research Papers — Chess Narrative AI

Reference papers for the Chess Narrative AI project. Read in this order:

## 1. Foundations

**word2vec-mikolov-2013.pdf**
*Efficient Estimation of Word Representations in Vector Space* — Mikolov et al., 2013
Context predicts meaning without labels. The philosophical foundation: moves get strategic meaning from the games they appear in.

**vae-kingma-welling-2013.pdf**
*Auto-Encoding Variational Bayes* — Kingma & Welling, 2013
The encoder architecture. Train a VAE on game sequences; the latent space becomes a smooth, continuous strategic concept space. Similar games land nearby because the reconstruction objective forces it.

## 2. Temporal & World Models

**world-models-ha-schmidhuber-2018.pdf**
*Recurrent World Models Facilitate Policy Evolution* — Ha & Schmidhuber, 2018
VAE + RNN learns a latent model of game environments. Agents learn to "dream" in latent space. Chess analogy: the hidden strategic state evolves through a trajectory, and planning is navigation in latent space.

**bert-devlin-2018.pdf**
*BERT: Pre-training of Deep Bidirectional Transformers* — Devlin et al., 2018
Masked prediction objective. Chess equivalent: mask a move in a game, predict it from context. The representation that enables prediction IS strategic understanding.

## 3. Chess-Specific

**alphazero-silver-2017.pdf**
*Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm* — Silver et al., 2017
Proof that chess strategy is learnable from self-play alone. The value/policy networks contain strategic understanding in their hidden layers.

**alphazero-chess-knowledge-mcgrath-2021.pdf**
*Acquisition of Chess Knowledge in AlphaZero* — McGrath et al., 2021
Probed AlphaZero's hidden layers and found it learned concepts like king safety, material, mobility WITHOUT being told. Direct evidence that strategic concepts emerge unsupervised.

## 4. Contrastive Learning

**simclr-chen-2020.pdf**
*A Simple Framework for Contrastive Learning of Visual Representations* — Chen et al., 2020
Learn representations without labels by requiring augmented views of the same input to produce similar embeddings. Chess: two games reaching the same position via different move orders are "augmented views."

**byol-grill-2020.pdf**
*Bootstrap Your Own Latent* — Grill et al., 2020
Contrastive learning without negative pairs. Simpler, more stable training. Could be adapted for chess game embeddings.

## 5. Interpretability

**monosemanticity-bricken-2023.pdf**
*Towards Monosemanticity: Decomposing Language Models With Dictionary Learning* — Bricken et al., 2023 (Anthropic)
Used sparse autoencoders to extract interpretable features from neural network hidden layers. Apply the same technique to a chess encoder: train it, then decompose its latent space to find the strategic concepts it learned. The concepts name themselves through the positions that activate them.
