Here is the comprehensive update to your repository, addressing documentation, test coverage, and bug resolution.

### Bug Report

I have conducted a thorough analysis of the codebase and identified the following issues.

**Selected Bug for Resolution:** **Enhancement of Offline/Mock Images Fails**

* **Location:** `src/App.jsx` (Lines 430-445 approx, inside `handleEnhanceSubmit`)
* **Description:** When a user generates an image in "Offline Mode" (due to auth failure) or receives a "Mock" image (due to API failure), the image is assigned a local ID (e.g., `offline-...` or `mock-...`). If the user attempts to "Enhance" this image, the application crashes or throws an unhandled error because it attempts to perform a Firestore `updateDoc` operation on a document ID that does not exist in the database.
* **Impact:** Causes application instability and frustrates users who are trying to use features in offline/demo mode.
* **Fix Strategy:** Add a validation check in `handleEnhanceSubmit` to detect offline/mock IDs. If detected, prevent the Firestore update and notify the user that enhancement requires a cloud-synced image.

**Other Identified Bugs:**

**Major:**

1. **Transaction Atomicity:** (`src/components/Transactions.jsx`) The `sendTransaction` function sends ETH via MetaMask first, then records it in the smart contract. If the user rejects the second signature, funds are lost from the UI history but sent on-chain.
2. **Config Parsing Crash:** (`src/App.jsx`) `JSON.parse(__firebase_config)` will throw a fatal error if the environment variable is not a valid JSON string or is already an object, crashing the app on load.
3. **LocalStorage Quota:** (`src/utils/cache.js`) `localStorage.setItem` can throw a "QuotaExceededError". This is currently caught and logged, but the user is not notified that caching has stopped working.
4. **API Key Trimming:** (`src/App.jsx`) Splitting `VITE_VENICE_API_KEYS` by comma does not trim whitespace. If a user enters `key1, key2`, the second key will be invalid (`" key2"`).
5. **Infinite Retry Loop:** (`src/utils/api.js`) If `maxRetries` is not strictly bounded or if the error type detection is flawed, the recursive/loop retry logic could theoretically hang the UI if the network flakiness is specific.

**Minor:**

1. **Ethereum Race Condition:** (`src/components/Transactions.jsx`) `useEffect` checks `window.ethereum` immediately on mount, but some wallets inject it asynchronously.
2. **Missing Auto-Scroll:** (`src/components/ChatPanel.jsx`) Chat does not auto-scroll to the bottom when new messages arrive.
3. **Input Range:** (`src/App.jsx`) Steps slider max is 30, but some models support up to 50.
4. **Security/CORS:** (`src/App.jsx`) `downloadImage` creates an anchor tag for download. While valid for base64, it's a legacy pattern that can be blocked by strict CSPs.
5. **System Prompt Persistence:** (`src/components/ChatPanel.jsx`) System prompt is reset to default on page reload.
6. **Style Reset:** (`src/App.jsx`) Selecting a new model does not reset incompatible style presets.
7. **File Validation:** (`src/App.jsx`) `handleImageUpload` checks MIME type but not file size, potentially crashing the browser with massive base64 strings.
8. **Toast Overlap:** (`src/App.jsx`) Rapid toasts overlap or replace each other too quickly.
9. **Accessibility:** (`src/components/ChatPanel.jsx`) Message bubbles lack `role="log"` or `aria-live` regions for screen readers.
10. **Button State:** (`src/App.jsx`) "Generate" button text changes to "Generating..." but doesn't show a spinner or visual progress indicator in the text (it does have a separate icon).

---