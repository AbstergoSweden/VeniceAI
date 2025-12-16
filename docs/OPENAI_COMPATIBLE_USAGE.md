# Using Venice.ai as an OpenAI Alternative

Guide for developers wanting to use Venice.ai APIs as a drop-in replacement for OpenAI.

---

## Table of Contents

1. [Overview](#overview)
2. [API Compatibility](#api-compatibility)
3. [Migration Guide](#migration-guide)
4. [Model Mapping](#model-mapping)
5. [Code Examples](#code-examples)
6. [Feature Comparison](#feature-comparison)
7. [Limitations](#limitations)

---

## Overview

Venice.ai provides an **OpenAI-compatible chat completions API** that works as a drop-in replacement for OpenAI's API in most applications.

### Key Benefits

✅ **Compatible**: Same request/response format as OpenAI  
✅ **Uncensored**: No content restrictions  
✅ **Vision Support**: Multiple vision-capable models  
✅ **Cost-Effective**: Competitive pricing  
✅ **Multiple Models**: Access to Gemini, Claude, Grok, and more  

### Quick Start

Replace:

```
https://api.openai.com/v1/chat/completions
```

With:

```
https://api.venice.ai/api/v1/chat/completions
```

And use your Venice.ai API key instead of OpenAI API key.

---

## API Compatibility

### Supported Endpoints

| Endpoint | OpenAI | Venice.ai | Notes |
|----------|--------|-----------|-------|
| Chat Completions | ✅ | ✅ | Full compatibility |
| Image Generation | ✅ | ✅ | Different format |
| Models List | ✅ | ✅ | `/models?type=image` or `?type=chat` |
| Streaming | ✅ | ✅ | Server-sent events |
| Vision | ✅ | ✅ | Multiple vision models |

### Compatible Parameters

**Chat Completions** (`/chat/completions`):

| Parameter | OpenAI | Venice.ai |
|-----------|--------|-----------|
| `model` | ✅ | ✅ |
| `messages` | ✅ | ✅ |
| `temperature` | ✅ | ✅ |
| `max_tokens` | ✅ | ✅ |
| `top_p` | ✅ | ✅ |
| `frequency_penalty` | ✅ | ✅ |
| `presence_penalty` | ✅ | ✅ |
| `stream` | ✅ | ✅ |
| `n` | ✅ | ⚠️ Limited |
| `logprobs` | ✅ | ❌ |
| `stop` | ✅ | ✅ |
| `user` | ✅ | ⚠️ Ignored |

---

## Migration Guide

### Step 1: Update Base URL

**Before (OpenAI):**

```javascript
const BASE_URL = 'https://api.openai.com/v1';
```

**After (Venice.ai):**

```javascript
const BASE_URL = 'https://api.venice.ai/api/v1';
```

### Step 2: Update API Key

**Before (OpenAI):**

```javascript
const API_KEY = process.env.OPENAI_API_KEY;
```

**After (Venice.ai):**

```javascript
const API_KEY = process.env.VENICE_API_KEY;
```

### Step 3: Update Model Names

**Before (OpenAI):**

```javascript
model: 'gpt-4'
```

**After (Venice.ai):**

```javascript
model: 'gemini-3-pro-preview'  // or other Venice models
```

See [Model Mapping](#model-mapping) for equivalents.

### Step 4: Test Functionality

Everything else should work identically!

---

## Model Mapping

### Chat Models

| OpenAI Model | Venice.ai Equivalent | Features | Use Case |
|--------------|---------------------|----------|----------|
| `gpt-3.5-turbo` | `mistral-31-24b` | Vision | Fast general-purpose |
| `gpt-4` | `gemini-3-pro-preview` | Vision, Reasoning | Complex tasks |
| `gpt-4-turbo` | `claude-opus-45` | Vision, Reasoning | Advanced analysis |
| `gpt-4-vision` | `grok-41-fast` | Vision, Reasoning | Image understanding |
| `o1-preview` | `qwen3-235b-a22b-thinking-2507` | Reasoning | Deep reasoning |
| `o1-mini` | `google-gemma-3-27b-it` | Vision | Efficient tasks |

### Image Models

Venice.ai uses a different endpoint for image generation:

| OpenAI | Venice.ai |
|--------|-----------|
| `dall-e-3` | `fluently-xl` (free) or `stable-diffusion-3` |
| Endpoint: `/images/generations` | Endpoint: `/image/generate` |

---

## Code Examples

### Python - Basic Migration

**OpenAI Code:**

```python
from openai import OpenAI

client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

**Venice.ai Code:**

```python
import requests

API_KEY = "your-venice-api-key"
BASE_URL = "https://api.venice.ai/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "model": "gemini-3-pro-preview",
    "messages": [
        {"role": "user", "content": "Hello!"}
    ]
}

response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers=headers,
    json=payload
)

data = response.json()
print(data["choices"][0]["message"]["content"])
```

**Or use OpenAI library with custom base URL:**

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-venice-api-key",
    base_url="https://api.venice.ai/api/v1"
)

response = client.chat.completions.create(
    model="gemini-3-pro-preview",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### Node.js - Drop-in Replacement

**OpenAI Code:**

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);
```

**Venice.ai Code:**

```javascript
import OpenAI from 'openai';

const venice = new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1'
});

const completion = await venice.chat.completions.create({
  model: 'gemini-3-pro-preview',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);
```

### Vision API - Image Analysis

**OpenAI Code:**

```python
response = client.chat.completions.create(
    model="gpt-4-vision-preview",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {
                    "type": "image_url",
                    "image_url": {"url": "data:image/jpeg;base64,..."}
                }
            ]
        }
    ]
)
```

**Venice.ai Code:**

```python
response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers=headers,
    json={
        "model": "grok-41-fast",  # or any vision-capable model
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What's in this image?"},
                    {
                        "type": "image_url",
                        "image_url": {"url": "data:image/jpeg;base64,..."}
                    }
                ]
            }
        ]
    }
)
```

### Streaming Responses

**OpenAI Code:**

```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

**Venice.ai Code:**

```javascript
const stream = await venice.chat.completions.create({
  model: 'claude-opus-45',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

## Feature Comparison

### What Works Identically

✅ **Chat Completions**: Same request/response format  
✅ **Streaming**: Server-sent events  
✅ **Vision**: Image URLs and base64  
✅ **System Prompts**: Role-based messages  
✅ **Temperature & Top-p**: All sampling parameters  
✅ **Max Tokens**: Token limit control  

### What's Different

⚠️ **Model Names**: Use Venice.ai model IDs, not OpenAI names  
⚠️ **Image Generation**: Different endpoint (`/image/generate` vs `/images/generations`)  
⚠️ **Pricing**: Different pricing structure  
⚠️ **Content Policy**: Venice.ai has fewer restrictions  

### What's Not Supported

❌ **Function Calling**: Not currently supported  
❌ **Logprobs**: Not available  
❌ **Fine-tuning**: Custom model training  
❌ **Embeddings**: Separate endpoint (if available)  
❌ **Moderation**: No moderation endpoint  

---

## Limitations

### Current Limitations

1. **No Function Calling**: Tools/functions not yet supported
2. **No Fine-Tuning**: Can't train custom models
3. **Different Image API**: Separate generation format
4. **Rate Limits**: Different limits than OpenAI

### Workarounds

**Function Calling Alternative:**

```javascript
// Instead of function calling, use structured prompts
const response = await venice.chat.completions.create({
  model: 'gemini-3-pro-preview',
  messages: [{
    role: 'system',
    content: 'You are a helpful assistant. Always respond in JSON format.'
  }, {
    role: 'user',
    content: 'What is the weather in Paris? Respond as: {"city": "...", "temp": ...}'
  }]
});

// Parse JSON from response
const data = JSON.parse(response.choices[0].message.content);
```

---

## Cost Comparison

### Pricing Model Differences

**OpenAI:**

- Charged per 1K tokens
- Input and output tokens priced differently
- Higher costs for GPT-4

**Venice.ai:**

- Tiered pricing (Free, Pro, Enterprise)
- All-you-can-use within tier
- More predictable costs

### Migration Cost Impact

- **Free Tier**: Venice.ai offers free models (Fluently XL)
- **Pro Tier**: Fixed monthly cost vs. pay-per-token
- **Enterprise**: Custom pricing for both

---

## Testing Your Migration

### Validation Checklist

- [ ] Update base URL to Venice.ai
- [ ] Replace API key
- [ ] Update model names
- [ ] Test basic chat completion
- [ ] Test vision API (if used)
- [ ] Test streaming (if used)
- [ ] Verify error handling
- [ ] Check rate limit handling
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor for issues

### Example Test Suite

```javascript
// test-venice-migration.js
import { venice } from './config';

async function testMigration() {
  // Test 1: Basic completion
  const basic = await venice.chat.completions.create({
    model: 'mistral-31-24b',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
  console.log('✅ Basic completion:', basic.choices[0].message.content);

  // Test 2: System prompt
  const system = await venice.chat.completions.create({
    model: 'gemini-3-pro-preview',
    messages: [
      { role: 'system', content: 'You are a poet.' },
      { role: 'user', content: 'Write a haiku.' }
    ]
  });
  console.log('✅ System prompt:', system.choices[0].message.content);

  // Test 3: Temperature
  const temp = await venice.chat.completions.create({
    model: 'claude-opus-45',
    messages: [{ role: 'user', content: 'Be creative!' }],
    temperature: 1.5
  });
  console.log('✅ Temperature:', temp.choices[0].message.content);

  console.log('\n🎉 All tests passed!');
}

testMigration().catch(console.error);
```

---

## Best Practices

### API Key Management

```javascript
// Use environment variables
const VENICE_API_KEY = process.env.VENICE_API_KEY;

// Support multiple keys for rotation
const API_KEYS = (process.env.VENICE_API_KEYS || '').split(',');
```

### Error Handling

```javascript
async function robustAPICall(messages) {
  try {
    return await venice.chat.completions.create({
      model: 'mistral-31-24b',
      messages
    });
  } catch (error) {
    if (error.status === 429) {
      // Rate limited - wait and retry
      await new Promise(r => setTimeout(r, 2000));
      return robustAPICall(messages);
    }
    throw error;
  }
}
```

### Model Selection

```javascript
// Choose model based on requirements
function selectModel(needsVision, needsReasoning) {
  if (needsVision && needsReasoning) return 'gemini-3-pro-preview';
  if (needsVision) return 'grok-41-fast';
  if (needsReasoning) return 'qwen3-235b-a22b-thinking-2507';
  return 'mistral-31-24b';  // Default fast model
}
```

---

## Additional Resources

- [Venice.ai API Documentation](API_DOCUMENTATION.md)
- [How to Use Guide](HOW_TO_USE.md)
- [Main README](../README.md)
- [OpenAI Documentation](https://platform.openai.com/docs) (for reference)

---

## Support

Having issues with migration?

- **GitHub Issues**: Report compatibility problems
- **Discord**: Get community help
- **Email**: <support@venice.ai>
