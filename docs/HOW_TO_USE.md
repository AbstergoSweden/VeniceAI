# How to Use Venice.ai Generator

Complete guide to getting started with and using Venice.ai Generator effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Image Generation Workflow](#image-generation-workflow)
3. [Prompt Engineering Tips](#prompt-engineering-tips)
4. [Chat Features](#chat-features)
5. [Web3 Features](#web3-features)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First-Time Setup

#### 1. Install Dependencies

```bash
cd app
npm install
```

This installs all required packages including React, Firebase, Ethers.js, and more.

#### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Required: Venice.ai API Keys (comma-separated)
VITE_VENICE_API_KEYS=your-key-1,your-key-2,your-key-3

# Optional: Firebase (for cloud history sync)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional: App Configuration
VITE_APP_ID=venice-generator
```

> **Getting Venice.ai API Keys:**
>
> 1. Sign up at [venice.ai](https://venice.ai)
> 2. Navigate to Settings → API Keys
> 3. Generate one or more API keys
> 4. Copy them to your `.env` file

#### 3. (Optional) Configure Firebase

If you want cloud-synced history across devices:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication**
3. Create a **Firestore Database**
4. Copy your Firebase config to `.env`

**Without Firebase**, the app runs in local-only mode with history stored in your browser.

#### 4. Start the Application

**Web Version:**

```bash
npm run dev
```

Opens at `http://localhost:5173`

**Desktop Version (Electron):**

```bash
npm run electron:dev
```

---

## Image Generation Workflow

### Basic Generation

1. **Enter a Prompt**
   - Type a description of the image you want in the "Prompt" field
   - Be specific: include details about subject, style, lighting, colors, mood

2. **Configure Parameters** (Optional)
   - **Model**: Choose from available models (e.g., "Fluently XL" for free tier)
   - **Style**: Apply style presets like "anime", "photographic", "digital-art"
   - **Aspect Ratio**: Select tall (768×1024), wide (1024×768), or square (1024×1024)
   - **Steps**: Higher steps (30+) = better quality but slower generation
   - **Variants**: Generate 1-4 variations with different seeds

3. **Click Generate**
   - Images appear in the gallery as they're generated
   - Progress shown in the UI

4. **Review Results**
   - Hover over images to see prompt, model, and seed
   - Click "Save" to download
   - Click "Enhance" to upscale or improve

### Using AI-Powered Prompt Tools

#### **Idea Button** - Generate from Simple Concept

1. Click **Idea** button
2. Enter a simple concept (e.g., "cyberpunk city")
3. AI expands it into a detailed prompt
4. Review and edit if needed
5. Click Generate

#### **Enhance Button** - Improve Existing Prompt

1. Write a basic prompt
2. Click **Enhance** button
3. AI adds details, improves structure, and optimizes for quality
4. The enhanced prompt replaces your original
5. Click Generate

#### **Describe Button** - Generate Prompt from Image

1. Click **Describe** button
2. Upload an image file
3. Click "Analyze Image"
4. AI describes the image in detail
5. Click "Use Description" to insert into prompt field
6. Click Generate to create similar images

---

## Prompt Engineering Tips

### Anatomy of a Good Prompt

A well-crafted prompt includes:

1. **Subject**: What is the main focus?
2. **Details**: Specific characteristics, colors, textures
3. **Environment**: Where is it? What's the setting?
4. **Lighting**: Time of day, light quality, mood
5. **Style**: Art style, medium, artist references
6. **Quality**: Technical specs (4K, detailed, etc.)

### Example Progression

**Basic:**

```
A cat
```

**Better:**

```
A fluffy orange cat sitting on a windowsill
```

**Best:**

```
A fluffy orange tabby cat sitting on a rustic wooden windowsill, 
golden hour sunlight streaming through lace curtains, soft focus 
background of a garden, warm tones, highly detailed fur texture, 
professional pet photography, 4K quality
```

### Power Words & Phrases

**Quality Enhancers:**

- 4K, 8K, highly detailed
- Professional photography
- Award-winning
- Masterpiece
- Ultra-realistic

**Style References:**

- "In the style of [artist name]"
- "Cinematic lighting"
- "Studio Ghibli aesthetic"
- "Unreal Engine render"

**Lighting:**

- Golden hour, blue hour
- Dramatic lighting, soft lighting
- Backlighting, rim lighting
- Volumetric fog

**Camera/Lens:**

- Wide angle, telephoto
- Bokeh, shallow depth of field
- Macro photography

### Negative Prompts

Use negative prompts to exclude unwanted elements:

```
Negative: ugly, blurry, low quality, watermark, text, 
deformed, bad anatomy, extra limbs, oversaturated
```

---

## Chat Features

### Opening the Chat Panel

The chat panel is integrated into the application for AI assistance.

### Basic Chat Usage

1. **Select a Model**: Choose from available chat models
   - **Vision models** (Gemini, Claude, Grok): Can analyze images
   - **Reasoning models** (GPT-5, Qwen Thinking): Better for complex tasks

2. **Type Your Message**: Enter your question or request

3. **Send**: Click send or press Enter

4. **Review Response**: AI assistant replies in the chat

### Using System Prompts

**System prompts** set the behavior/personality of the AI:

1. Click **System Prompt** section
2. Enter instructions (e.g., "You are an expert photographer")
3. Chat responses follow these instructions

**Example System Prompts:**

- "You are a helpful prompt engineer for image generation"
- "You are an expert in color theory and composition"
- "Respond in the style of a friendly art teacher"

### Memory Management

The chat remembers the last **20 messages** by default. This provides context for follow-up questions while managing API costs.

**To start fresh:**

- Reload the page, or
- Use a new system prompt

### Chat with Vision

For vision-capable models:

1. Use the "Describe" feature to upload an image
2. The AI can see and describe the image
3. Ask follow-up questions about the image

---

## Web3 Features

### Setting Up MetaMask

1. **Install MetaMask**: Download the browser extension from [metamask.io](https://metamask.io)

2. **Create Wallet**: Follow MetaMask's setup to create a new wallet

3. **Switch to Testnet**:
   - Open MetaMask
   - Click network dropdown
   - Select "Sepolia Test Network"

4. **Get Test ETH**:
   - Visit a Sepolia faucet (e.g., [sepoliafaucet.com](https://sepoliafaucet.com))
   - Enter your wallet address
   - Receive free test ETH

### Connecting Your Wallet

1. Click **Transactions** tab in the app
2. Click **Connect Wallet**
3. MetaMask popup appears
4. Click **Connect** to authorize

### Sending Transactions

1. **Enter Details:**
   - **To Address**: Recipient's Ethereum address
   - **Amount**: ETH to send (e.g., 0.01)
   - **Keyword**: Short description (optional)
   - **Message**: Transaction note (optional)

2. **Click Send**

3. **Confirm in MetaMask:**
   - Review transaction details
   - Click **Confirm**
   - Wait for blockchain confirmation

4. **View on Etherscan:**
   - Transaction history shows all your transactions
   - Click Etherscan link to view on blockchain explorer

> **⚠️ Security Warning:**
>
> - Never send real ETH without verifying the address
> - Test with small amounts first
> - Keep your private keys secure
> - This app never asks for your private keys

---

## Advanced Usage

### Batch Generation with Seeds

To create variations of the same image:

1. Generate an image and note its seed (shown on hover)
2. Enter that seed in the seed field (in code, or save for later)
3. Change prompt slightly
4. Generate - result will be similar composition

Or use the **Variants** slider to auto-generate 2-4 variations.

### Firebase Integration

**Automatic Syncing:**

- All generated images automatically save to Firestore
- Access your history from any device
- Images are compressed to save storage

**Offline Mode:**

- App detects when Firebase is unavailable
- Falls back to local browser storage
- Syncs when connection restored

### Image Cache

The app caches generated images in browser storage:

- **View Stats**: Click "Cache Stats" button
- **Clear Cache**: Click "Clear Image Cache" button
- Images load faster on subsequent views

### Custom Models

If you have access to premium models:

1. Select the premium model from dropdown
2. Generate as normal
3. If you see a 402 error, your account needs upgrade

---

## Troubleshooting

### "All API keys failed" Error

**Cause**: All configured API keys are invalid or rate-limited

**Solutions:**

1. Check your API keys in `.env` are correct
2. Verify you have quota remaining on Venice.ai
3. Try again after a few minutes (rate limits reset)
4. Add more API keys for automatic rotation

### "Payment Required (402)" Error

**Cause**: Selected model requires a premium subscription

**Solutions:**

1. Select a free model like "Fluently XL"
2. Upgrade your Venice.ai account
3. Check Venice.ai pricing page

### Images Not Saving to Firebase

**Cause**: Firebase configuration issue or offline mode

**Solutions:**

1. Check Firebase config in `.env`
2. Verify Firebase project has Anonymous Auth enabled
3. Check browser console for errors
4. App works in local-only mode without Firebase

### MetaMask Not Detected

**Cause**: MetaMask not installed or page needs refresh

**Solutions:**

1. Install MetaMask browser extension
2. Refresh the page after installation
3. Ensure MetaMask is unlocked
4. Try a different browser

### Slow Generation

**Cause**: High-quality settings or server load

**Solutions:**

1. Reduce steps to 20-25 for faster generation
2. Generate fewer variants
3. Select a faster model
4. Try during off-peak hours

### Blank Images or Errors

**Cause**: Prompt violates content policy or API issue

**Solutions:**

1. Adjust prompt to be less explicit
2. Use negative prompts to filter unwanted content
3. Try a different model
4. Check API status at [status.venice.ai](https://status.venice.ai)

---

## Best Practices

### Performance

- **Use fewer variants** initially (test with 1, then batch)
- **Optimize steps** (20-30 is usually sufficient)
- **Clear cache** periodically if storage is limited

### Quality

- **Be specific** in prompts (more detail = better results)
- **Use negative prompts** to avoid common issues
- **Iterate** - refine prompts based on results

### Cost Management

- **Use free models** when possible (Fluently XL)
- **Configure multiple API keys** for rotation
- **Monitor usage** on Venice.ai dashboard

---

## Next Steps

- Read [API Documentation](API_DOCUMENTATION.md) for integration
- See [OpenAI Compatibility](OPENAI_COMPATIBLE_USAGE.md) for API usage
- Review [Contributing Guidelines](../CONTRIBUTING.md) to help improve the project
- Check [README](../README.md) for project overview

---

## Getting Help

- **Issues**: Open an issue on GitHub
- **Community**: Join our Discord
- **Documentation**: Check [API Docs](API_DOCUMENTATION.md)
- **Venice.ai Support**: <support@venice.ai>
