# Server-Side Features Documentation

This document provides guidance on implementing server-side features for the Content Guard system that cannot be efficiently implemented in the browser.

## RSS Feed Integration for Dynamic Term Updates

### Overview

The Python CSAM Guard v9 includes RSS feed monitoring to dynamically update term lists from child safety organizations. This feature is best implemented server-side due to:

- Network requests from trusted feeds
- Periodic background updates (cron/scheduled tasks)
- Centralized term list management
- Term validation and moderation before deployment

### Implementation Guidance

**Recommended Stack:**
- Node.js backend with Express or Fastify
- `feedparser` or `rss-parser` npm package
- Scheduled jobs using `node-cron` or similar

**Architecture:**
```typescript
// Example Node.js server implementation
import Parser from 'rss-parser';
import cron from 'node-cron';

const RSS_FEEDS = [
    'https://www.nccprblog.org/feeds/posts/default?alt=rss',
    'https://childlinett.org/feed/',
    // ... more feeds
];

async function updateTermsFromRSS() {
    const parser = new Parser();
    const newTerms = new Set<string>();
    
    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            for (const item of feed.items) {
                const content = `${item.title} ${item.contentSnippet}`.toLowerCase();
                
                // Extract safety-related terms
                const matches = content.match(/\\b(child|minor|csam|exploitation)\\b/g);
                if (matches) {
                    newTerms.add(...matches);
                }
            }
        } catch (error) {
            console.error(`Failed to parse ${feedUrl}:`, error);
        }
    }
    
    // Merge with existing terms (with review/approval workflow)
    await mergeAndDeployTerms(newTerms);
}

// Run daily at 2 AM
cron.schedule('0 2 * * *', updateTermsFromRSS);
```

**Best Practices:**
- Implement approval workflow before deploying new terms
- Log all term additions with source and timestamp
- Version control your term lists
- Rate limit RSS feed requests
- Cache feed results to avoid repeated fetches

---

## Image pHash Matching for CSAM Detection

### Overview

Perceptual hashing (pHash) creates fingerprints of images that remain similar even after transformations (resize, crop, compression). Matching against known CSAM hashes can detect illegal content.

### ⚠️ Critical Security Considerations

> [!CAUTION]
> **CSAM Hash Databases Are Highly Sensitive**
> 
> - Hash databases contain fingerprints of actual child abuse material
> - Unauthorized access or distribution violates federal law
> - Must be stored with encryption at rest
> - Access must be strictly logged and audited
> - Integration requires partnering with organizations like NCMEC, IWF, or PhotoDNA

### Implementation Guidance

**DO NOT** attempt to build your own CSAM hash database. Instead, integrate with established services:

**Option 1: Microsoft PhotoDNA** (Recommended)
- Industry-standard service for CSAM detection
- Requires application and approval
- Cloud API available
- https://www.microsoft.com/en-us/photodna

**Option 2: NCMEC Integration**
- National Center for Missing & Exploited Children
- Hash matching API for approved partners
- Requires organizational vetting
- https://www.missingkids.org

**Example Integration Pattern:**
```typescript
// Pseudo-code for PhotoDNA integration
import { PhotoDNAClient } from 'photodna-sdk';

async function assessImage(imageBuffer: Buffer): Promise<Decision> {
    const client = new PhotoDNAClient({
        apiKey: process.env.PHOTODNA_API_KEY,
        endpoint: process.env.PHOTODNA_ENDPOINT,
    });
    
    const result = await client.match(imageBuffer);
    
    if (result.isMatch) {
        // CRITICAL: Report to NCMEC immediately
        await reportToNCMEC(result);
        
        return {
            allow: false,
            action: 'BLOCK',
            reason: 'CSAM content detected',
            // ... additional reporting
        };
    }
    
    return { allow: true, action: 'ALLOW', reason: 'No match' };
}
```

**If Building Custom pHash (for non-CSAM use cases):**

```typescript
// Using sharp and pHash algorithm (NOT for CSAM detection)
import sharp from 'sharp';

async function computePHash(imagePath: string): Promise<bigint> {
    // Resize and grayscale
    const img = await sharp(imagePath)
        .resize(32, 32, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();
    
    // Apply DCT (Discrete Cosine Transform)
    // Extract low-frequency components
    // Generate hash from median threshold
    // ... implementation details
    
    return hash;
}

function hammingDistance(hash1: bigint, hash2: bigint): number {
    let xor = hash1 ^ hash2;
    let distance = 0;
    while (xor > 0n) {
        distance += Number(xor & 1n);
        xor >>= 1n;
    }
    return distance;
}
```

---

## NLP Model Integration for NSFW Classification

### Overview

The Python implementation uses Hugging Face `transformers` for NSFW text classification. For TypeScript/JavaScript, there are two approaches:

### Option 1: Browser-Based with Transformers.js

`@xenova/transformers` (Transformers.js) allows running models in the browser:

```typescript
import { pipeline } from '@xenova/transformers';

let classifier: any = null;

async function loadNLPModel() {
    classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
}

async function assessWithNLP(prompt: string): Promise<boolean> {
    if (!classifier) await loadNLPModel();
    
    const result = await classifier(prompt);
    const isNSFW = result[0].label === 'NSFW' && result[0].score > 0.7;
    
    return isNSFW;
}
```

**Pros:**
- No server required
- Privacy-preserving (all processing client-side)
- Low latency

**Cons:**
- Large bundle size (models can be 50-100MB+)
- Initial load time
- Limited model selection

### Option 2: Server-Side Python API

Keep the Python NLP pipeline on the server, expose via REST API:

```python
# Python FastAPI server
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()
classifier = pipeline("text-classification", model="michellejieli/nsfw_text_classifier")

@app.post("/classify")
async def classify_text(prompt: str):
    result = classifier(prompt)
    return {
        "label": result[0]["label"],
        "score": result[0]["score"],
        "is_nsfw": result[0]["label"] == "NSFW" and result[0]["score"] > 0.7
    }
```

```typescript
// TypeScript client
async function assessWithNLPAPI(prompt: string): Promise<boolean> {
    const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    
    const data = await response.json();
    return data.is_nsfw;
}
```

**Pros:**
- Full model selection
- Better performance (GPU acceleration)
- No client bundle impact

**Cons:**
- Requires server infrastructure
- Network latency
- Privacy considerations (prompts sent to server)

### Recommended Approach

For VeniceAI (client-side focused):
1. Start **without** NLP models (current implementation is already robust)
2. If needed, add **server-side** Python API for NLP as optional enhancement
3. Only use Transformers.js if willing to accept bundle size trade-off

---

## Rate Limiting (Server-Side)

While the client-side rate limiter is useful, server-side rate limiting is essential for production:

```typescript
// Using express-rate-limit
import rateLimit from 'express-rate-limit';

const contentGuardLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many content validation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/assess', contentGuardLimiter);
```

**Advanced: User-Based Rate Limiting**

```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis();

const userLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:content-guard:',
    }),
    windowMs: 60 * 1000,
    max: async (req) => {
        // Different limits per user tier
        const user = await getUser(req);
        return user.isPremium ? 200 : 50;
    },
});
```

---

## Deployment Architecture

**Recommended Setup:**

```
┌─────────────┐
│   Browser   │
│ (Content    │
│  Guard TS)  │
└──────┬──────┘
       │
       │ AJAX/Fetch
       ▼
┌─────────────────┐
│  Node.js API    │
│  (TypeScript)   │
│  - Rate Limiting│
│  - Auth         │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
    ┌────────┐    ┌──────────┐
    │ Python │    │ PhotoDNA │
    │ NLP API│    │   API    │
    └────────┘    └──────────┘
```

**Key Points:**
- Client-side guard: Fast feedback, privacy-friendly
- Node.js API: Rate limiting, auth, orchestration
- Python NLP: Optional advanced classification
- PhotoDNA: Image CSAM detection (if required)

---

## Summary

- **RSS Feeds**: Server-side periodic updates with approval workflow
- **Image pHash**: Use PhotoDNA/NCMEC APIs, not custom implementation
- **NLP Models**: Server-side Python API recommended over client Transformers.js
- **Rate Limiting**: Essential on server, client-side is supplementary

**Next Steps:**
1. Assess actual needs (do you need image scanning? NLP fallback?)
2. Start with server-side Python API if NLP is needed
3. Apply for PhotoDNA access if handling user-uploaded images
4. Implement robust server-side rate limiting and monitoring
