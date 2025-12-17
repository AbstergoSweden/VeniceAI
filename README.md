# Venice.ai Generator

A high-fidelity, uncensored AI image generator with persistent history, chat features, and Web3 transactions. Built with React, Electron, Firebase, and the Venice.ai API.

![Venice.ai Generator](https://preview.redd.it/73z6v668xffc1.jpeg?width=1055&format=pjpg&auto=webp&s=b15ae1f6d53d93bf004d8bbff24d5135026bbd2d)

## Features

### Image Generation

- **Uncensored Generation**: Powered by Venice.ai's API with multiple model support
- **AI-Powered Prompts**: Intelligent prompt enhancement and suggestion using Venice Chat API
- **Image Description**: Upload images to generate detailed prompts using vision AI
- **Multiple Variants**: Generate up to 4 variants simultaneously with seed-based control
- **Customizable Parameters**: Adjust models, styles, aspect ratios, steps, and more
- **Image Enhancement**: Upscale and enhance generated images

### Storage & History

- **Persistent History**: All generated images saved to Firebase Firestore
- **Cloud Sync**: Access your image history across devices
- **Offline Support**: Works without Firebase with local-only storage

### Chat Interface

- **Integrated Chat**: Venice Chat API integration with multiple models
- **Memory Management**: Configurable conversation memory (default 20 messages)
- **System Prompts**: Inject custom system instructions
- **Vision Support**: Chat with vision-capable models (e.g., Gemini, Claude, Grok)

### Web3 Features

- **Crypto Transactions**: Send Ethereum transactions via MetaMask
- **Transaction History**: View all blockchain transactions
- **Smart Contract Integration**: Interact with deployed Ethereum contracts

### User Interface

- **Material 3 Expressive Design**: Modern, vibrant dark pastel theme
- **Glassmorphism Effects**: Beautiful blur and transparency effects
- **Responsive Layout**: Works on desktop and mobile
- **Toast Notifications**: Real-time feedback for all actions
- **Accessibility**: ARIA labels and keyboard navigation support

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS 4 |
| **Styling** | Material 3 Design Tokens, Custom CSS |
| **Backend Services** | Firebase (Auth, Firestore) |
| **APIs** | Venice.ai (Image Generation & Chat) |
| **Web3** | Ethers.js 6, MetaMask |
| **Desktop** | Electron 39 |
| **Testing** | Vitest 4, React Testing Library |
| **Code Quality** | ESLint 9, Prettier |

---

## Project Tree

```
.
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── docs
│   ├── API_DOCUMENTATION.md
│   ├── HOW_TO_USE.md
│   ├── LEGAL.md
│   └── OPENAI_COMPATIBLE_USAGE.md
├── e2e
│   ├── chat.spec.js
│   ├── main-page.spec.js
│   └── transactions.spec.js
├── electron
│   ├── entitlements.mac.plist
│   ├── main.js
│   └── preload.js
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.js
├── postcss.config.js
├── public
│   └── vite.svg
├── src
│   ├── App.jsx
│   ├── assets
│   ├── components
│   │   ├── ChatPanel.jsx
│   │   └── Transactions.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── test
│   │   ├── Bugs.test.jsx  # Regression tests for fixed bugs
│   │   ├── ChatPanel.test.jsx
│   │   ├── Transactions.test.jsx
│   │   └── setup.js
│   └── utils
│       ├── api.js
│       ├── api.test.js
│       ├── cache.js
│       ├── constants.js
│       └── image.js
├── tailwind.config.js
├── vite.config.js
└── vitest.config.js
```

---

## Configuration

### Detailed List of All Settings

The application uses environment variables for configuration. Create a `.env` file in the root directory (copy from `.env.example`).

| Environment Variable | Required | Description |
|----------------------|----------|-------------|
| `VITE_VENICE_API_KEYS` | **Yes** | Comma-separated list of Venice.ai API keys. Used for image generation and chat. Having multiple keys enables automatic rotation and failover. |
| `VITE_FIREBASE_API_KEY` | No | Firebase API Key for authentication and database access. |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Firebase Auth Domain (e.g., `project-id.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | No | Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase Storage Bucket URL. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | No | Firebase App ID. |
| `VITE_APP_ID` | No | Unique identifier for this app instance (defaults to `default-app-id`). Useful if multiple apps share the same Firebase project. |

#### Internal Configuration

The following constants are defined in `src/App.jsx` and `src/utils/constants.js`:

*   **`CONFIG.BASE_API_URL`**: `https://api.venice.ai/api/v1` - Base URL for Venice.ai API.
*   **`CONFIG.DEFAULT_NEGATIVE_PROMPT`**: A default string of negative prompts to improve image quality.
*   **`CONFIG.COLLECTION_NAME`**: `generatedImages` - Firestore collection name for storing history.
*   **`VENICE_CHAT_MODELS`**: List of available chat models and their capabilities (vision, reasoning).

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher (comes with Node.js)
- [Git](https://git-scm.com/) for cloning the repository
- [MetaMask](https://metamask.io/) browser extension for Web3 features (optional)

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AbstergoSweden/VeniceAI.git
cd VeniceAI
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- React and React DOM
- Vite build tool
- Tailwind CSS
- Firebase SDK
- Ethers.js
- Electron
- Testing libraries

### 3. Configuration

#### Venice.ai API Keys

The app uses Venice.ai API keys configured via environment variables.

1.  Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2.  Update `VITE_VENICE_API_KEYS` with your keys.

```env
VITE_VENICE_API_KEYS=your-primary-key,your-backup-key-1
```

> **Important**: Never commit real API keys to version control.

#### Firebase Setup (Optional but Recommended)

For cloud-synced history:

1.  Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2.  Enable **Anonymous Authentication**.
3.  Create a **Firestore Database**.
4.  Add your Firebase configuration to the `.env` file.

> **Note**: Without Firebase, the app runs in offline mode with local-only history.

#### Ethereum/Web3 Setup (Optional)

For Web3 features:

1. Install the MetaMask browser extension
2. Update contract address in `src/utils/constants.js`
3. Ensure you have testnet ETH (Sepolia network recommended)

---

## Running the Application

### Development Mode (Web)

Start the Vite development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Electron Desktop App

Run as a desktop application:

```bash
npm run electron:dev
```

This starts both the web server and Electron wrapper concurrently.

### Production Build

Build for production:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Build Electron App

Create distributable Electron app:

```bash
npm run electron:build
```

This creates platform-specific installers in the `release/` directory.

---

## Testing

### Run All Tests

```bash
npm test
```

This runs the Vitest test suite in watch mode.

### Run Specific Test File

```bash
npx vitest src/utils/api.test.js
```

### Test Coverage

```bash
npx vitest --coverage
```

### Test Files

- `src/utils/api.test.js` - API utility tests
- `src/test/ChatPanel.test.jsx` - Chat component tests
- `src/test/Transactions.test.jsx` - Transactions component tests
- `src/test/Bugs.test.jsx` - Regression tests for reported bugs

---

## Development Workflow

### Quality Checks

Before committing code, run the preflight check:

```bash
npm run preflight
```

This command:

1. Builds the production bundle (`npm run build`)
2. Runs ESLint (`npm run lint`)
3. Ensures no build or lint errors

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run preflight` | Build + Lint (pre-commit check) |
| `npm run electron:dev` | Run Electron in development |
| `npm run electron:build` | Build Electron distributable |

### Code Style

- **ESLint**: Configured with React and React Hooks plugins
- **Import Order**: Group imports by type (React, libraries, local)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **File Structure**: Co-locate tests with source files (`*.test.js`, `*.test.jsx`)

---

## Architecture

### Firebase Integration

The app uses Firebase for:

- **Authentication**: Anonymous auth (default) or custom token auth
- **Firestore**: Cloud storage for generated images and metadata
- **Offline Support**: Graceful degradation when Firebase unavailable

Data structure:

```
artifacts/
  └── {appId}/
      └── users/
          └── {userId}/
              └── generatedImages/
                  └── {documentId}
                      ├── base64: string (compressed JPEG)
                      └── params: object
                          ├── prompt
                          ├── model
                          ├── seed
                          ├── timestamp
                          └── ... (other generation params)
```

### API Integration

**Venice.ai Chat API** (OpenAI-compatible):

- Endpoint: `https://api.venice.ai/api/v1/chat/completions`
- Models: Multiple chat models with vision and reasoning capabilities
- Use cases: Prompt enhancement, image description, general chat

**Venice.ai Image API**:

- Endpoint: `https://api.venice.ai/api/v1/image/generate`
- Features: Multiple models, styles, aspect ratios, seed control
- Response: Base64-encoded PNG/JPEG

**API Key Rotation**:

- Automatic failover on 401/429 errors
- Retry logic with exponential backoff
- Up to 3 API keys configured

### State Management

- **React State**: `useState` for local component state
- **Effect Hooks**: `useEffect` for side effects (auth, Firestore listeners)
- **Firebase Real-time**: Firestore `onSnapshot` for live history updates

### Web3 Integration

- **Provider**: Ethers.js `BrowserProvider` (MetaMask)
- **Contract**: Custom smart contract for transaction logging
- **Networks**: Sepolia testnet (recommended)

---

## Documentation Standards

This project follows JSDoc-style documentation standards for JavaScript/JSX code:

- Functions and methods include `@param` tags with type definitions
- Return values are documented with `@returns` tags
- React components document their props and expected behavior
- Complex business logic includes inline explanations
- TypeScript-style type definitions where applicable

---

## Code Structure

### Directory Structure

```
src/
├── App.jsx                 # Main application component
├── components/             # Reusable UI components
│   ├── ChatPanel.jsx       # Integrated chat interface
│   ├── Transactions.jsx    # Web3 transaction interface
│   └── ErrorBoundary.jsx   # Error handling wrapper
├── utils/                  # Reusable utility functions
│   ├── api.js              # API communication logic
│   ├── image.js            # Image processing functions
│   ├── cache.js            # Image caching utilities
│   ├── constants.js        # Configuration constants
│   └── config.js           # Application configuration
└── test/                   # Test setup and utilities
    ├── setup.js            # Test environment setup
    ├── ChatPanel.test.jsx  # Chat component tests
    ├── Transactions.test.jsx # Transaction component tests
    └── ...                 # Other test files
```

---

## Development Best Practices

### Component Design

- Use React functional components with hooks
- Implement proper error boundaries for resilience
- Follow Material Design 3 principles
- Implement responsive design for all screen sizes
- Ensure accessibility with ARIA labels and semantic HTML

### State Management

- Use React hooks (`useState`, `useEffect`, `useCallback`) appropriately
- Separate local and global state concerns
- Implement proper cleanup in `useEffect` hooks
- Use `useCallback` to prevent unnecessary re-renders

### Error Handling

- Implement centralized error logging
- Use toast notifications for user-facing errors
- Gracefully handle API failures with fallbacks
- Implement proper form validation
- Use error boundaries to prevent app crashes

### Performance Optimization

- Implement image caching to reduce API calls
- Use lazy loading for heavy components
- Optimize image compression to reduce memory usage
- Implement virtual scrolling for large datasets
- Use React.memo for expensive components

## Testing Strategy

### Test Coverage

This project includes comprehensive test coverage with:

- **Unit Tests**: Testing individual functions and utilities
- **Component Tests**: Testing React components with user interactions
- **Integration Tests**: Testing API interactions and state management
- **Regression Tests**: Ensuring bug fixes remain fixed

### Test Structure

Tests are organized by:

- `src/utils/*.test.js` - Utility function tests
- `src/test/*test.jsx` - Component and integration tests
- `src/App.test.jsx` - Main application tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npx vitest path/to/test/file.test.js
```

---

## Troubleshooting

### Firebase Authentication Fails

**Symptom**: "Authentication failed" toast notification

**Solutions**:

1. Check Firebase config in `src/App.jsx`
2. Ensure Firebase project has Anonymous Auth enabled
3. Verify API keys and project ID are correct
4. App will fallback to offline mode automatically

### API Key Errors

**Symptom**: "All API keys failed" or 402 errors

**Solutions**:

1. Verify Venice.ai API keys are valid and have quota
2. For 402 errors, switch to a free model (e.g., "Fluently XL")
3. Check API key permissions and account status

### MetaMask Not Detected

**Symptom**: "Please install MetaMask" alerts

**Solutions**:

1. Install MetaMask browser extension
2. Refresh the page after installing
3. Ensure MetaMask is unlocked

### Build Failures

**Symptom**: `npm run build` fails

**Solutions**:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check Node.js version (v18+ required)
4. Review error messages for missing dependencies

### Tests Failing

**Symptom**: `npm test` shows failures

**Solutions**:

1. Ensure all dependencies installed: `npm install`
2. Clear Vitest cache: `npx vitest --clearCache`
3. Check for async timing issues in tests
4. Review test setup in `src/test/setup.js`

---

## Contributing

### Reporting Bugs

Found a bug? Please open an issue with:

1. Clear description of the problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, browser, Node version)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run preflight` to ensure quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Requirements

- All code must include proper JSDoc documentation
- Tests must be added for new functionality
- Existing tests must continue to pass
- Code must pass linting checks
- Follow existing code style and patterns

---

## Known Issues

- Please check the GitHub Issues page for the latest known bugs and feature requests.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Support

For questions or support:

- Open an issue in the repository
- Check existing issues for solutions
- Review troubleshooting section above

---

## Acknowledgments

- **Venice.ai**: For providing uncensored AI image generation and chat APIs
- **Firebase**: For authentication and cloud storage
- **Tailwind CSS**: For utility-first styling
- **React Team**: For the amazing React library
- **Material Design**: For design inspiration
