# Venice.ai Generator

**A professional-grade, cross-platform AI content creation suite with Web3 integration**

Venice.ai Generator bridges high-fidelity AI generation with the decentralized web, offering an uncensored, privacy-focused environment for generative art and intelligent conversation. Built with React 19, Electron, and Firebase, it delivers native desktop performance with web accessibility.

---

## 🎯 Overview

### **Who Is This For?**

- **Digital Artists** seeking unrestricted creative tools without arbitrary content filters
- **Developers** integrating AI with blockchain transactions
- **Privacy Advocates** wanting alternatives to heavily filtered AI models
- **Professionals** requiring granular control over AI-generated content

### **Core Capabilities**

| Feature | Description |
|:--------|:------------|
| 🎨 **Uncensored Generation** | High-fidelity image creation via Venice.ai API without content restrictions |
| 💬 **Multi-Model Chat** | Access to latest LLMs (Llama 3, Mistral, GPT-5.2, Claude, Gemini) |
| ☁️ **Cloud Sync** | Persistent history across devices via Firebase Firestore |
| 🔗 **Web3 Integration** | Ethereum transactions and smart contract interaction |
| 🖥️ **Cross-Platform** | Native desktop (Electron) and web browser support |

---

## ✨ Features

### 🎨 **Advanced Image Generation**

#### **AI-Powered Workflow**
- **Prompt Engineering**: Transform simple ideas into detailed prompts
  - Input: `"a cyberpunk city"`
  - Output: `"A neon-drenched cyberpunk metropolis at rain-slicked dusk, towering skyscrapers with holographic advertisements, cinematic lighting, 8k resolution"`

- **Vision-Based Description**: Upload reference images for AI analysis
  - Analyzes composition, lighting, color palette, and subject matter
  - Generates detailed text descriptions for prompt creation

- **Multi-Variant Generation**: Create up to 4 variants simultaneously
  - Manual seed control for reproducible results
  - Explore latent space efficiently with seed locking

#### **Deep Parameter Control**
- **Models**: Switch between checkpoints (Fluently XL, Stable Diffusion variants)
- **Aspect Ratios**: Portrait (768×1024), Landscape (1024×768), Square (1024×1024)
- **Sampling**: Adjust steps (10-30) and guidance scales
- **Style Presets**: Cinematic, Anime, Photographic, 3D Render
- **Post-Processing**: Built-in upscaling and enhancement for print-quality outputs

#### **Privacy & Control**
- Uncensored generation without arbitrary guardrails
- Your prompts and images remain private
- No data mining or model training on your content

---

### ☁️ **Robust Storage & History**

#### **Cloud Synchronization**
- **Persistent History**: Auto-sync to Firebase Firestore
  - Stores images + full metadata (prompt, seed, model, settings)
  - Recreate or refine past works easily

- **Cross-Device Access**: Start on desktop, view on mobile
  - Seamless workflow across all devices
  - Real-time sync with Firestore `onSnapshot`

#### **Offline-First Architecture**
- **Graceful Degradation**: Detects network failures automatically
- **Local Storage**: Images saved to IndexedDB/LocalStorage when offline
- **Zero Data Loss**: Syncs to cloud when connection restored

---

### 💬 **Intelligent Chat Interface**

#### **Multi-Model Support**
Access cutting-edge LLMs via Venice API:

| Model | Capabilities | Use Cases |
|:------|:-------------|:----------|
| **Mistral 31 24B** | Vision, Fast | General chat, image analysis |
| **Grok 4.1 Fast** | Vision, Reasoning | Complex problem-solving |
| **Gemini 3 Pro** | Vision, Reasoning | Multimodal tasks |
| **Claude Opus 4.5** | Vision, Reasoning | Long-form content, coding |
| **GPT-5.2** | Reasoning | Advanced logic, research |

#### **Advanced Features**
- **Contextual Memory**: Configurable history window (default: 20 messages)
- **Custom System Prompts**: Define AI persona (tutor, coach, critic)
- **Multimodal Vision**: Upload images for analysis, OCR, or Q&A
- **Streaming Responses**: Real-time token generation

---

### 🔗 **Web3 & Blockchain Integration**

#### **Crypto Transactions**
- **MetaMask Integration**: Connect wallet for ETH transactions
- **Multi-Network Support**: Mainnet, Sepolia, Goerli (auto-detection)
- **Transaction History**: Transparent on-chain log with Etherscan links

#### **Smart Contract Interaction**
- **Ethers.js v6**: Lightweight, secure blockchain library
- **Contract Methods**: `addToBlockchain()`, `getAllTransactions()`
- **Future Roadmap**: NFT minting, crypto payment for premium features

---

### 🖥️ **Modern User Interface**

#### **Material 3 Expressive Design**
- **Dark Pastel Theme**: Reduces eye strain, modern aesthetic
- **Glassmorphism**: Sophisticated blur effects and translucent layers
- **Micro-Interactions**: Smooth animations with spring-based easing
- **Responsive Layout**: Mobile-first design (320px → 4K displays)

#### **Accessibility**
- ✅ Comprehensive ARIA labels
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Screen reader compatible

---

## 🛠️ Tech Stack

| Category | Technologies | Rationale |
|:---------|:-------------|:----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 | Latest hooks, instant HMR, utility-first styling |
| **Styling** | Material 3 Tokens, Custom CSS | Consistent design language, native OS feel |
| **Backend** | Firebase (Auth, Firestore) | Serverless scalability, real-time sync |
| **AI APIs** | Venice.ai (Image + Chat) | High fidelity, API stability, uncensored |
| **Web3** | Ethers.js 6, MetaMask | Lightweight, secure, industry standard |
| **Desktop** | Electron 39 | Native OS APIs, cross-platform packaging |
| **Testing** | Vitest 4, React Testing Library | Jest-compatible, instant feedback |
| **Code Quality** | ESLint 9, Prettier | Strict standards, consistent formatting |

---

## 📁 Project Structure

```
.
├── docs/                          # Extended documentation
│   ├── API_DOCUMENTATION.md       # Venice API endpoint details
│   ├── HOW_TO_USE.md              # User guide
│   ├── LEGAL.md                   # Disclaimer and legal info
│   └── OPENAI_COMPATIBLE_USAGE.md # OpenAI library compatibility
│
├── e2e/                           # End-to-end tests (Playwright)
│   ├── chat.spec.js
│   ├── main-page.spec.js
│   └── transactions.spec.js
│
├── electron/                      # Electron-specific code
│   ├── entitlements.mac.plist     # macOS security entitlements
│   ├── main.cjs                   # Main process (Node.js context)
│   └── preload.cjs                # IPC bridge (security boundary)
│
├── src/                           # Application source
│   ├── App.jsx                    # Main component/router
│   ├── components/
│   │   ├── ChatPanel.jsx          # Chat interface
│   │   └── Transactions.jsx       # Web3 transaction UI
│   ├── utils/
│   │   ├── api.js                 # API wrapper with retry logic
│   │   ├── cache.js               # Image caching system
│   │   └── image.js               # Compression & processing
│   └── test/
│       └── Bugs.test.jsx          # Regression tests
│
├── .env.example                   # Environment variable template
├── vite.config.js                 # Vite bundler config
├── vitest.config.js               # Test runner config
├── package.json                   # Dependencies & scripts
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                        # MIT License
├── SECURITY.md                    # Security policy
└── README.md                      # This file
```

---

## ⚙️ Configuration

### **Environment Variables**

Create `.env` from the template:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_VENICE_API_KEYS` | ✅ | Comma-separated Venice.ai API keys (e.g., `key1,key2,key3`)<br>**Round-robin failover**: Auto-rotates on rate limits |
| `VITE_FIREBASE_API_KEY` | ⚠️ | Firebase project API key (required for cloud sync) |
| `VITE_FIREBASE_AUTH_DOMAIN` | ⚠️ | Auth domain (e.g., `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | ⚠️ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ⚠️ | Cloud Storage bucket URL |
| `VITE_FIREBASE_APP_ID` | ⚠️ | Firebase app ID |
| `VITE_APP_ID` | ❌ | Namespace for Firestore data (default: `default-app-id`) |

**⚠️ Security Warning**: Never commit `.env` to version control. It's included in `.gitignore`.

### **Internal Constants**

Key behaviors defined in `src/utils/constants.js` and `src/App.jsx`:

- `CONFIG.BASE_API_URL`: `https://api.venice.ai/api/v1`
- `CONFIG.DEFAULT_NEGATIVE_PROMPT`: Quality-tuned negative terms
- `CONFIG.COLLECTION_NAME`: `generatedImages` (Firestore collection)
- `VENICE_CHAT_MODELS`: Array of available chat models with capabilities

---

## 🚀 Getting Started

### **Prerequisites**

| Requirement | Version | Why? |
|:------------|:--------|:-----|
| **Node.js** | ≥18.0.0 | Modern features, native `fetch` API |
| **npm** | ≥9.0.0 | Lockfile management, Vite scripts |
| **Git** | Latest | Version control |
| **MetaMask** | Latest | (Optional) Web3 features |

### **Installation**

#### 1. Clone Repository
```bash
git clone https://github.com/AbstergoSweden/VeniceAI.git
cd VeniceAI
```

#### 2. Install Dependencies
```bash
npm install
```
*This downloads Electron binaries and build tools (~925MB)*

#### 3. Configure API Keys

**Venice.ai Setup:**
```bash
# Edit .env
VITE_VENICE_API_KEYS=venice_key_primary_123,venice_key_backup_456
```

**Firebase Setup (Recommended):**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable **Anonymous Authentication** (Build > Authentication > Sign-in method)
4. Create **Firestore Database** (start in Test Mode for dev)
5. Copy config from Project Settings > SDK Setup
6. Paste into `.env` as `VITE_FIREBASE_*` variables

---

## 🏃 Running the Application

### **Development Mode (Web)**
```bash
npm run dev
```
- **URL**: http://localhost:5173
- **Features**: Hot Module Replacement (HMR), instant updates
- **Best For**: UI development, debugging with browser DevTools

### **Electron Desktop App**
```bash
npm run electron:dev
```
- **Behavior**: Opens standalone application window
- **Debugging**: Press `Ctrl+Shift+I` (Win/Linux) or `Cmd+Option+I` (Mac) for DevTools
- **Best For**: Testing native features, final UX validation

### **Production Build (Web)**
```bash
npm run build
```
- **Output**: `dist/` directory
- **Deploy To**: Vercel, Netlify, Firebase Hosting, etc.

### **Build Electron App**
```bash
npm run electron:build
```
- **Output**: `release/` directory
- **Formats**: `.dmg` (macOS), `.exe` (Windows), `.deb` (Linux)

---

## 🧪 Testing

### **Run All Tests**
```bash
npm test
```
*Executes Vitest in watch mode*

### **Run Specific Test Suite**
```bash
npx vitest src/utils/api.test.js
```

### **Code Coverage Report**
```bash
npx vitest --coverage
```
*Generates detailed coverage report*

### **Test Structure**

| File | Coverage |
|:-----|:---------|
| `src/utils/api.test.js` | API rotation, retry logic, error handling |
| `src/test/ChatPanel.test.jsx` | Chat UI, message history, state management |
| `src/test/Transactions.test.jsx` | Web3 wallet, input validation |
| `src/test/Bugs.test.jsx` | Regression tests for fixed bugs |

---

## 📜 Available Scripts

| Script | Description |
|:-------|:------------|
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | Compile production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Check code style with ESLint |
| `npm test` | Run Vitest test suite |
| `npm run preflight` | **Build + Lint** (run before commits) |
| `npm run electron:dev` | Run Electron app in dev mode |
| `npm run electron:build` | Package Electron app for distribution |

---

## 🏗️ Architecture

### **Data Architecture (Firebase)**

#### **Authentication**
- **Anonymous Auth** by default (no password required)
- Assigns unique User ID (UID) for data isolation

#### **Firestore Structure**
```
artifacts/{appId}/
  └── users/{userId}/
      └── generatedImages/{documentId}
          ├── base64: string (compressed JPEG)
          └── params: object
              ├── prompt: string
              ├── model: string
              ├── seed: number
              ├── timestamp: number
              └── enhanced: boolean
```

### **API Integration & Reliability**

#### **Request Wrapper** (`src/utils/api.js`)
- **Exponential Backoff**: `2^retries * 1000ms + jitter` for rate limits
- **Key Rotation**: Auto-switches on 401/429 errors
- **Timeout Handling**: 60-second request timeout with `AbortController`
- **Smart Error Handling**: 402 (payment required) doesn't trigger rotation

#### **Retry Logic Flow**
```
Request → 429 Rate Limit → Wait (2s) → Retry
       → 401 Unauthorized → Next API Key → Retry
       → 5xx Server Error → Wait (4s) → Retry
       → 402 Payment Required → Fail Fast (no retry)
```

### **Web3 Integration**

#### **Provider Setup**
- **Ethers.js v6**: Wraps `window.ethereum` (MetaMask injection)
- **Network Detection**: Auto-detects Mainnet/Sepolia/Goerli
- **Contract ABI**: Stored in `constants.js`

#### **Smart Contract Methods**
- `addToBlockchain(address, amount, message, keyword)`: Log transaction metadata
- `getAllTransactions()`: Retrieve full transaction history

---

## 🐛 Troubleshooting

### **Firebase Authentication Fails**

**Symptom**: Toast notification: *"Authentication failed. Running in offline mode."*

**Solutions**:
1. Verify `VITE_FIREBASE_API_KEY` in `.env` matches Firebase Console
2. Enable **Anonymous Authentication** in Firebase Console
3. Check network access to `googleapis.com`

---

### **API Key Errors / 402 Payment Required**

**Symptom**: *"Payment Required"* or *"All API keys failed"*

**Solutions**:
1. Switch to free-tier model (e.g., "Fluently XL")
2. Check quota on [Venice.ai Dashboard](https://venice.ai/dashboard)
3. Add backup API key to `.env` for failover

---

### **MetaMask Not Detected**

**Symptom**: Alert: *"Please install MetaMask"*

**Solutions**:
1. Install [MetaMask Extension](https://metamask.io/)
2. Refresh page after unlocking MetaMask
3. (Brave Browser) Disable internal wallet in Settings

---

### **Build Failures**

**Symptom**: `npm run build` crashes

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be ≥18.0.0

# Increase memory (low-RAM machines)
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

### **Workflow**
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/VeniceAI.git`
3. **Create Branch**: `git checkout -b feature/amazing-feature`
4. **Develop** with tests
5. **Verify**: `npm run preflight` (build + lint)
6. **Commit**: `git commit -m 'feat: Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **Open Pull Request** against `main` branch

### **Guidelines**
- Add tests for new features
- Follow existing code style (ESLint enforced)
- Update documentation for user-facing changes
- Reference issue numbers in commits (e.g., `fix: Resolve #42`)

---

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for details.

You are free to use, modify, distribute, and sell copies of this software, provided the original copyright notice is included.

---

## 🙏 Acknowledgments

- **Venice.ai**: Powerful, uncensored AI infrastructure
- **Firebase**: Robust backend-as-a-service platform
- **React Team & Vite**: Exceptional developer tooling
- **Web3 Community**: Ethers.js, MetaMask, and decentralized web tools

---

## 📞 Support & Community

- **Bug Reports**: [GitHub Issues](https://github.com/AbstergoSweden/VeniceAI/issues)
- **Documentation**: See `docs/` folder for deep dives
- **Security**: Report vulnerabilities via [SECURITY.md](SECURITY.md)

---

## 🔐 Security

- **API Keys**: Never commit `.env` to version control
- **Electron Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- **CSP Headers**: Restricts script/style sources in `index.html`
- **Preload Script**: Whitelisted IPC channels only

---