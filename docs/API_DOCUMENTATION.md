# Venice.ai API Documentation

Complete reference for integrating with Venice.ai's Image Generation and Chat APIs.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Image Generation API](#image-generation-api)
4. [Chat API (OpenAI Compatible)](#chat-api-openai-compatible)
5. [Models API](#models-api)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)
8. [Code Examples](#code-examples)

---

## Overview

Venice.ai provides two primary APIs:

- **Image Generation API**: Create high-quality, uncensored images from text prompts
- **Chat API**: OpenAI-compatible chat completions with vision and reasoning support

**Base URL**: `https://api.venice.ai/api/v1`

---

## Authentication

All API requests require an API key passed in the `Authorization` header.

### Getting Your API Key

1. Sign up at [venice.ai](https://venice.ai)
2. Navigate to your account settings
3. Generate a new API key
4. Keep your API key secure - never commit it to version control

### Headers

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Example

```bash
curl https://api.venice.ai/api/v1/models?type=image \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Image Generation API

Generate images from text prompts with extensive customization options.

### Endpoint

```
POST /image/generate
```

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model ID (e.g., "fluently-xl", "stable-diffusion-3") |
| `prompt` | string | Yes | Text description of the desired image |
| `negative_prompt` | string | No | What to avoid in the image |
| `width` | integer | No | Image width in pixels (default: 1024) |
| `height` | integer | No | Image height in pixels (default: 1024) |
| `steps` | integer | No | Generation steps, 10-50 (default: 30) |
| `seed` | integer | No | Random seed for reproducibility |
| `style_preset` | string | No | Style preset ID |
| `hide_watermark` | boolean | No | Hide Venice.ai watermark (default: false) |
| `safe_mode` | boolean | No | Blur NSFW content (default: false) |
| `format` | string | No | Output format: "png" or "jpeg" (default: "png") |
| `embed_exif_metadata` | boolean | No | Include generation params in EXIF (default: false) |

### Response

```json
{
  "images": [
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUl..."
  ],
  "seed": 123456789,
  "model": "fluently-xl"
}
```

The `images` array contains base64-encoded image data.

### Example Request

```bash
curl -X POST https://api.venice.ai/api/v1/image/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "fluently-xl",
    "prompt": "A serene Japanese garden with cherry blossoms at sunset",
    "negative_prompt": "ugly, blurry, low quality",
    "width": 1024,
    "height": 768,
    "steps": 30,
    "seed": 42
  }'
```

### JavaScript Example

```javascript
import { apiCall } from './utils/api.js';

const CONFIG = {
  API_KEYS: ['your-api-key'],
  BASE_API_URL: 'https://api.venice.ai/api/v1'
};

const response = await apiCall(
  `${CONFIG.BASE_API_URL}/image/generate`,
  {
    model: 'fluently-xl',
    prompt: 'A cyberpunk city at night with neon lights',
    width: 1024,
    height: 1024,
    steps: 30
  },
  CONFIG
);

// response.images[0] contains base64 image data
const imageBase64 = response.images[0];
```

---

## Chat API (OpenAI Compatible)

Venice.ai's chat API is fully compatible with OpenAI's chat completions endpoint.

### Endpoint

```
POST /chat/completions
```

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model ID (see [Models](#available-chat-models)) |
| `messages` | array | Yes | Array of message objects |
| `temperature` | float | No | Randomness, 0.0-2.0 (default: 0.7) |
| `max_tokens` | integer | No | Max response tokens (default: unlimited) |
| `top_p` | float | No | Nucleus sampling (default: 1.0) |
| `frequency_penalty` | float | No | Penalize repeated tokens (default: 0.0) |
| `presence_penalty` | float | No | Penalize new topics (default: 0.0) |
| `stream` | boolean | No | Stream response (default: false) |

### Message Format

```json
{
  "role": "system|user|assistant",
  "content": "text" 
}
```

For vision-capable models, use:

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Describe this image" },
    { 
      "type": "image_url", 
      "image_url": { 
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." 
      } 
    }
  ]
}
```

### Response

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "mistral-31-24b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "This is the AI's response."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 56,
    "completion_tokens": 31,
    "total_tokens": 87
  }
}
```

### Available Chat Models

| Model ID | Name | Vision | Reasoning | Best For |
|----------|------|--------|-----------|----------|
| `mistral-31-24b` | Venice Medium | ✅ | ❌ | General purpose, fast |
| `grok-41-fast` | Grok 4.1 Fast | ✅ | ✅ | Quick reasoning tasks |
| `gemini-3-pro-preview` | Gemini 3 Pro | ✅ | ✅ | Advanced reasoning |
| `claude-opus-45` | Claude Opus 4.5 | ✅ | ✅ | Complex analysis |
| `google-gemma-3-27b-it` | Gemma 3 27B | ✅ | ❌ | Instruction following |
| `qwen3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ❌ | ❌ | Large context |
| `qwen3-235b-a22b-thinking-2507` | Qwen 3 235B Thinking | ❌ | ✅ | Deep reasoning |
| `openai-gpt-52` | GPT-5.2 | ❌ | ✅ | Latest OpenAI |

### Example Request

```bash
curl -X POST https://api.venice.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral-31-24b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

### JavaScript Example

```javascript
const response = await apiCall(
  `${CONFIG.BASE_API_URL}/chat/completions`,
  {
    model: 'mistral-31-24b',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing simply.' }
    ],
    temperature: 0.7,
    max_tokens: 200
  },
  CONFIG
);

const reply = response.choices[0].message.content;
console.log(reply);
```

---

## Models API

Retrieve available models for image generation or chat.

### List Image Models

```
GET /models?type=image
```

**Response:**

```json
{
  "data": [
    {
      "id": "fluently-xl",
      "name": "Fluently XL",
      "type": "image"
    },
    {
      "id": "stable-diffusion-3",
      "name": "Stable Diffusion 3",
      "type": "image"
    }
  ]
}
```

### List Styles

```
GET /image/styles
```

**Response:**

```json
{
  "data": [
    { "id": "anime", "name": "Anime" },
    { "id": "photographic", "name": "Photographic" },
    { "id": "digital-art", "name": "Digital Art" }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request completed |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 402 | Payment Required | Premium model requires subscription |
| 429 | Rate Limited | Retry after delay |
| 500 | Server Error | Retry request |

### Error Response Format

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error",
    "code": 401
  }
}
```

### Best Practices

1. **Handle 401 Errors**: Rotate to backup API key if available
2. **Handle 429 Errors**: Use exponential backoff (2^retries seconds)
3. **Handle 402 Errors**: Switch to free model (e.g., "fluently-xl")
4. **Timeout Requests**: 60-second timeout recommended
5. **Validate Responses**: Check for `images` or `choices` arrays

---

## Rate Limits

### Default Limits

- **Free Tier**: 100 requests/day
- **Pro Tier**: 1,000 requests/day
- **Enterprise**: Custom limits

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1677652288
```

### Handling Rate Limits

**Exponential Backoff:**

```javascript
async function apiCallWithRetry(url, data, config, retries = 0) {
  try {
    return await apiCall(url, data, config);
  } catch (error) {
    if (error.message.includes('429') && retries < 3) {
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiCallWithRetry(url, data, config, retries + 1);
    }
    throw error;
  }
}
```

**Key Rotation:**

```javascript
const CONFIG = {
  API_KEYS: [
    'primary-key',
    'backup-key-1',
    'backup-key-2'
  ]
};

// apiCall automatically rotates keys on 401/429 errors
```

---

## Code Examples

### Python - Image Generation

```python
import requests
import base64

API_KEY = "your-api-key"
BASE_URL = "https://api.venice.ai/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "model": "fluently-xl",
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 768,
    "steps": 30
}

response = requests.post(
    f"{BASE_URL}/image/generate",
    headers=headers,
    json=payload
)

data = response.json()
image_base64 = data["images"][0]

# Save to file
with open("output.png", "wb") as f:
    f.write(base64.b64decode(image_base64))
```

### Node.js - Chat Completion

```javascript
const fetch = require('node-fetch');

const API_KEY = 'your-api-key';
const BASE_URL = 'https://api.venice.ai/api/v1';

async function chat(prompt) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-31-24b',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

chat('Tell me a joke').then(console.log);
```

### cURL - Vision API

```bash
# Encode image to base64
IMAGE_B64=$(base64 -i image.jpg)

curl -X POST https://api.venice.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "What is in this image?"},
          {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,'"$IMAGE_B64"'"}}
        ]
      }
    ]
  }'
```

---

## Additional Resources

- **Venice.ai Website**: [https://venice.ai](https://venice.ai)
- **API Status**: [https://status.venice.ai](https://status.venice.ai)
- **Community**: Discord and forums
- **Support**: <support@venice.ai>

---

## See Also

- [How to Use Guide](HOW_TO_USE.md)
- [OpenAI Compatibility Guide](OPENAI_COMPATIBLE_USAGE.md)
- [Main README](../README.md)
- [Legal Information](LEGAL.md)
