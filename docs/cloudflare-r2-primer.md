# Cloudflare R2 Object Storage — Primer

*Last updated: 2026-03-01*

---

## What Is R2?

Cloudflare R2 is an S3-compatible object storage service with **zero egress fees**. You store blobs (files, images, audio, video, datasets — anything) in "buckets" and retrieve them over HTTPS. It runs on Cloudflare's global network (335+ data centers) and is designed for high durability and strong consistency.

The name "R2" is a cheeky jab at Amazon S3 — one letter and one number less.

### Why R2 Over S3 / GCS / Azure Blob?

| | R2 | S3 | GCS | Azure Blob |
|---|---|---|---|---|
| **Egress** | Free | $0.09/GB | $0.12/GB | $0.087/GB |
| **Storage** | $0.015/GB-mo | $0.023/GB-mo | $0.020/GB-mo | $0.018/GB-mo |
| **S3-compatible** | Yes | Native | Interop layer | No |
| **Free tier** | 10 GB + 10M reads/mo | 5 GB (12 months) | 5 GB | 5 GB (12 months) |

The killer feature is **zero egress**. If you're serving files publicly (images, audio clips, static assets), the bandwidth is free no matter how much traffic you get.

---

## Core Concepts

### Buckets
A bucket is a named container for objects. Names must be:
- 3–63 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with a hyphen
- Globally unique within your account

### Objects
An object is a file stored in a bucket, identified by a **key** (its path). For example: `audio/en/e4.mp3`. Objects can be up to **5 TB** each. There's no limit on the number of objects in a bucket.

### Storage Classes
- **Standard** — Default. Low-latency access. $0.015/GB-mo.
- **Infrequent Access** — Cheaper storage ($0.01/GB-mo) but costs $0.01/GB on retrieval. 30-day minimum charge. Good for backups or archives you rarely read.

### Location Hints
When creating a bucket, you can optionally specify a location hint (e.g., `wnam` for Western North America, `eeur` for Eastern Europe) to place data closer to your users. This is a hint, not a guarantee — R2 may still distribute data globally.

---

## Architecture (How It Works)

R2 has four layers:

1. **R2 Gateway** — Edge entry point, deployed globally via Cloudflare Workers. Handles authentication and routes requests.
2. **Metadata Service** — Built on Durable Objects. Stores object metadata (key, checksum, size) with strong consistency.
3. **Tiered Read Cache** — Leverages Cloudflare's CDN to serve hot objects from edge locations close to the reader.
4. **Distributed Storage** — Persistent backend. Data is encrypted with AES-256 at rest and replicated across regions.

**Write path:** Request hits the gateway → data is encrypted → written to distributed storage with regional replication → metadata committed → HTTP 200 returned. Writes are strongly consistent — a successful write is immediately visible to all subsequent reads.

**Read path:** Request hits the gateway → metadata lookup → check tiered cache → if miss, fetch from distributed storage → decrypt → return to client.

---

## Pricing Breakdown

### Free Tier (Forever, Standard Storage Only)
| Resource | Free Allowance |
|---|---|
| Storage | 10 GB-month |
| Class A operations (writes, lists) | 1,000,000 / month |
| Class B operations (reads) | 10,000,000 / month |
| Egress (bandwidth) | Unlimited |

### Paid Usage
| Resource | Standard | Infrequent Access |
|---|---|---|
| Storage | $0.015 / GB-month | $0.01 / GB-month |
| Class A ops (PUT, POST, LIST) | $4.50 / million | $9.00 / million |
| Class B ops (GET, HEAD) | $0.36 / million | $0.90 / million |
| Data retrieval | Free | $0.01 / GB |
| Egress | Free | Free |
| DELETE | Free | Free |

**Billing notes:**
- Storage is calculated as average peak daily usage over 30 days.
- Usage is rounded up to the next billing unit (e.g., 1.1 GB-month → billed as 2 GB-month).
- Unauthorized/failed requests (HTTP 401) are not charged.

---

## Access Methods

R2 gives you four ways to interact with your data:

### 1. Cloudflare Dashboard
Point-and-click in the browser. Good for quick bucket creation, browsing objects, and configuration. Navigate to **Storage & databases → R2 → Overview**.

### 2. Wrangler CLI (Cloudflare's native tool)

```bash
# Install
npm i -g wrangler
# or: pnpm add -g wrangler

# Authenticate (opens browser)
wrangler login

# Bucket operations
wrangler r2 bucket create my-bucket
wrangler r2 bucket list
wrangler r2 bucket delete my-bucket    # bucket must be empty

# Object operations
wrangler r2 object put my-bucket/path/to/file.mp3 --file ./local-file.mp3
wrangler r2 object get my-bucket/path/to/file.mp3 --file ./downloaded.mp3
```

Wrangler authenticates via your Cloudflare account directly — no API tokens needed.

### 3. S3-Compatible API (SDKs, boto3, aws-cli)

Since R2 speaks S3, you can use any S3 client. You just swap the endpoint URL.

**Generate API credentials:**
Dashboard → R2 → **Manage R2 API Tokens** → Create API Token → "Object Read & Write" → note your **Access Key ID** and **Secret Access Key** (shown once).

**Endpoint URL:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Your account ID is in the Cloudflare dashboard URL or on the R2 overview page.

#### Python (boto3)
```python
import boto3

s3 = boto3.client(
    service_name="s3",
    endpoint_url="https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
    aws_access_key_id="<ACCESS_KEY_ID>",
    aws_secret_access_key="<SECRET_ACCESS_KEY>",
    region_name="auto",
)

# Upload
s3.upload_file("local-file.mp3", "my-bucket", "audio/en/e4.mp3")

# Download
s3.download_file("my-bucket", "audio/en/e4.mp3", "downloaded.mp3")

# List objects
response = s3.list_objects_v2(Bucket="my-bucket", Prefix="audio/")
for obj in response.get("Contents", []):
    print(obj["Key"], obj["Size"])

# Generate presigned URL (temporary public link)
url = s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": "my-bucket", "Key": "audio/en/e4.mp3"},
    ExpiresIn=3600,  # 1 hour
)
```

#### JavaScript (AWS SDK v3)
```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "<ACCESS_KEY_ID>",
    secretAccessKey: "<SECRET_ACCESS_KEY>",
  },
});

// Upload
await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "audio/en/e4.mp3",
  Body: fileBuffer,
  ContentType: "audio/mpeg",
}));

// Generate presigned URL
const url = await getSignedUrl(s3, new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "audio/en/e4.mp3",
}), { expiresIn: 3600 });
```

#### AWS CLI
```bash
# Configure (one-time)
aws configure
# Access Key ID: <your R2 key>
# Secret Access Key: <your R2 secret>
# Region: auto
# Output: json

# Use with --endpoint-url flag
aws s3 cp local-file.mp3 s3://my-bucket/audio/en/e4.mp3 \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

aws s3 ls s3://my-bucket/ \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Sync a directory
aws s3 sync ./audio-clips/ s3://my-bucket/audio/ \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 4. rclone (Bulk Operations)

Best for syncing large directories or migrating from other storage providers.

```bash
# Configure (interactive)
rclone config
# → New remote → name: r2
# → Type: Amazon S3 Compliant → Provider: Cloudflare R2
# → Enter access key, secret key, endpoint

# Sync a directory
rclone sync ./audio-clips/ r2:my-bucket/audio/

# Copy a single file
rclone copy local-file.mp3 r2:my-bucket/

# List bucket contents
rclone ls r2:my-bucket/
```

---

## Public Access

By default, buckets are **private**. Two ways to make objects publicly readable:

### Option A: r2.dev Subdomain (Quick & Dirty)
Enable in Dashboard → R2 → your bucket → Settings → **Public Development URL** → Enable.

Objects become accessible at: `https://<bucket>.<account-id>.r2.dev/<key>`

**Caveats:** Rate-limited. Intended for development only. No caching. No custom domain.

### Option B: Custom Domain (Production)
Dashboard → R2 → your bucket → Settings → **Custom Domains** → Add your domain.

Requirements:
- Domain must be a zone in your Cloudflare account
- DNS CNAME is created automatically
- Gets full Cloudflare CDN caching, WAF, bot protection

**Important:** By default only certain file types are cached. Enable a "Cache Everything" page rule for your R2 domain to cache all file types.

### Presigned URLs (Temporary Access to Private Objects)
Generate time-limited URLs using any S3 SDK (see examples above). The URL grants access to a specific object for a set duration without making the bucket public.

---

## Practical Patterns

### Static Asset Hosting
Store images, CSS, JS, audio, video in R2. Serve via custom domain with Cloudflare CDN caching. Zero egress cost regardless of traffic.

### Presigned Upload (User Uploads Without Your Server)
1. Your backend generates a presigned PUT URL
2. Client uploads directly to R2
3. Your server never touches the file bytes

### Backup / Archive
Use Infrequent Access storage class for backups you rarely read. $0.01/GB-mo storage, only pay retrieval when you actually need it.

### Cloudflare Workers Integration
Bind an R2 bucket to a Worker for server-side logic (auth, transforms, routing) at the edge:
```toml
# wrangler.toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```
```javascript
export default {
  async fetch(request, env) {
    const object = await env.MY_BUCKET.get("audio/en/e4.mp3");
    if (!object) return new Response("Not Found", { status: 404 });
    return new Response(object.body, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  },
};
```

---

## Limitations & Gotchas

- **No server-side encryption key management** — R2 always encrypts at rest with its own keys (AES-256). You can't bring your own KMS key.
- **No object versioning** (as of early 2026) — Overwriting a key replaces the object. No rollback.
- **No lifecycle policies for automatic deletion** — You must delete objects manually or via script.
- **Bucket names are account-scoped**, not globally unique across all R2 users.
- **Multipart upload minimum part size** is 5 MB (same as S3).
- **Max object size** is 5 TB (via multipart upload). Single PUT max is 5 GB.
- **r2.dev URLs are rate-limited** — Don't use them in production.
- **Class A rounding** — 1,000,001 writes is billed as 2 million.
- **Public bucket root listing is disabled** — You can't `GET /` to list all objects publicly.

---

## Quick Reference

| Task | Command / Action |
|---|---|
| Create bucket | `wrangler r2 bucket create my-bucket` |
| Upload file | `wrangler r2 object put my-bucket/key --file ./local` |
| Download file | `wrangler r2 object get my-bucket/key --file ./local` |
| List buckets | `wrangler r2 bucket list` |
| Sync directory | `rclone sync ./dir/ r2:my-bucket/prefix/` or `aws s3 sync` |
| Make public | Dashboard → bucket → Settings → Custom Domain or r2.dev |
| Generate temp URL | `s3.generate_presigned_url(...)` via any S3 SDK |
| API endpoint | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| Dashboard | `https://dash.cloudflare.com/<ACCOUNT_ID>/r2/overview` |

---

## Sources

- [Cloudflare R2 Docs — Overview](https://developers.cloudflare.com/r2/)
- [How R2 Works](https://developers.cloudflare.com/r2/how-r2-works/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 CLI Getting Started](https://developers.cloudflare.com/r2/get-started/cli/)
- [R2 S3 API Getting Started](https://developers.cloudflare.com/r2/get-started/s3/)
- [R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [R2 boto3 Examples](https://developers.cloudflare.com/r2/examples/aws/boto3/)
- [R2 AWS SDK JS v3 Examples](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [R2 Wrangler Commands Reference](https://developers.cloudflare.com/r2/reference/wrangler-commands/)
