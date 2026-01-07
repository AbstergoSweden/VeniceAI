import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { addDoc } from 'firebase/firestore';
import { apiCall } from './utils/api';
import App from './App';

// Mock all dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'test-user', isAnonymous: true } })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'test-user', isAnonymous: true });
    return vi.fn();
  }),
  signInWithCustomToken: vi.fn(() => Promise.resolve({ user: { uid: 'test-user' } })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc' })),
  query: vi.fn(() => ({})),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] }); // Empty initial docs
    return vi.fn(); // Unsubscribe function
  }),
  doc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

// We mock apiCall but we will override implementation in tests
vi.mock('./utils/api', () => ({
  apiCall: vi.fn(),
}));

vi.mock('./utils/image', () => ({
  compressImage: vi.fn((img) => Promise.resolve(img)),
}));

vi.mock('./utils/cache', () => ({
  default: {
    getCached: vi.fn(),
    set: vi.fn(),
    cleanup: vi.fn(),
    getStats: vi.fn(() => ({ count: 0, size: '0 KB' })),
  },
}));

// Mock simple components/icons to avoid rendering issues
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Sparkles: () => <span data-testid="icon-sparkles" />,
    Trash2: () => <span data-testid="icon-trash" />,
    Download: () => <span data-testid="icon-download" />,
    Wand2: () => <span data-testid="icon-wand" />,
    Image: () => <span data-testid="icon-image" />,
    Loader2: () => <span data-testid="icon-loader" />,
    RefreshCw: () => <span data-testid="icon-refresh" />,
    AlertCircle: () => <span data-testid="icon-alert" />,
    X: () => <span data-testid="icon-x" />,
    Settings2: () => <span data-testid="icon-settings" />,
    Square: () => <span data-testid="icon-square" />,
    RectangleHorizontal: () => <span data-testid="icon-rect-h" />,
    RectangleVertical: () => <span data-testid="icon-rect-v" />,
    ImageIcon: () => <span data-testid="icon-image-icon" />,
  };
});

// Mock the config
global.__firebase_config = JSON.stringify({
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
});

global.__app_id = "test-app-id";
global.__initial_auth_token = null;

const MOCK_MODELS = { data: [{ id: 'test-model', name: 'Test Model' }] };
const MOCK_STYLES = { data: [] };

describe('Image Generation Race Condition Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation handles config calls and generation
    apiCall.mockImplementation(async (url, data) => {
        if (url.includes('/models')) return MOCK_MODELS;
        if (url.includes('/styles')) return MOCK_STYLES;
        // Default generation response
        return {
            images: ['data:image/png;base64,placeholder']
        };
    });
  });

  it('correctly associates each generated image with its corresponding seed', async () => {
    // Setup: We want to generate 3 variants.
    // We will simulate delays such that responses come out of order:
    // Request 1 (Seed S+0): 100ms delay
    // Request 2 (Seed S+1): 10ms delay (finishes first)
    // Request 3 (Seed S+2): 50ms delay (finishes second)

    apiCall.mockImplementation(async (url, data) => {
      if (url.includes('/models')) return MOCK_MODELS;
      if (url.includes('/styles')) return MOCK_STYLES;
      if (url.includes('/generate')) {
          // Extract seed to determine delay and response content
          const seed = data.seed;
          let delay = 0;

          if (seed % 3 === 0) delay = 100;      // Slowest
          if (seed % 3 === 1) delay = 10;       // Fastest
          if (seed % 3 === 2) delay = 50;       // Medium

          await new Promise(resolve => setTimeout(resolve, delay));

          return {
            images: [`image-data-for-seed-${seed}`]
          };
      }
      return {};
    });

    render(<App />);

    // Wait for auth and initial data load
    await waitFor(() => expect(screen.getByText(/Venice Generator/i)).toBeInTheDocument());

    // Ensure model is loaded (mock returns it instantly)
    // We can assume it is selected as it's the first one

    // 1. Set Inputs
    const promptInput = screen.getByLabelText(/^Prompt$/i);
    fireEvent.change(promptInput, { target: { value: 'Test Prompt' } });

    // Set Variants to 3
    const variantsInput = screen.getByLabelText(/Generation Variants/i);
    fireEvent.change(variantsInput, { target: { value: 3 } });

    // 2. Click Generate
    const generateBtn = screen.getByText(/Generate Image/i);
    fireEvent.click(generateBtn);

    // 3. Wait for all 3 addDoc calls
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(3);
    }, { timeout: 3000 });

    // 4. Verify associations
    const calls = addDoc.mock.calls;
    expect(calls.length).toBe(3);

    calls.forEach((call) => {
      const itemToSave = call[1];
      const savedSeed = itemToSave.params.seed;
      const savedImage = itemToSave.base64;

      // The mock returns "image-data-for-seed-{seed}"
      // So we check if the image string contains the seed number
      expect(savedImage).toBe(`image-data-for-seed-${savedSeed}`);
    });
  });

  it('maintains correct seed values even with concurrent requests', async () => {
    // This test reinforces the previous one but focuses on verifying params object integrity
    apiCall.mockImplementation(async (url, data) => {
      if (url.includes('/models')) return MOCK_MODELS;
      if (url.includes('/styles')) return MOCK_STYLES;
      if (url.includes('/generate')) {
        return {
            images: [`image-result-${data.seed}`]
        };
      }
      return {};
    });

    render(<App />);
    await waitFor(() => expect(screen.getByText(/Venice Generator/i)).toBeInTheDocument());

    // Set Variants to 2
    const variantsInput = screen.getByLabelText(/Generation Variants/i);
    fireEvent.change(variantsInput, { target: { value: 2 } });

    const promptInput = screen.getByLabelText(/^Prompt$/i);
    fireEvent.change(promptInput, { target: { value: 'Concurrent Test' } });

    const generateBtn = screen.getByText(/Generate Image/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(2);
    });

    const calls = addDoc.mock.calls;
    // Verify that the prompt is correct in both
    expect(calls[0][1].params.prompt).toBe('Concurrent Test');
    expect(calls[1][1].params.prompt).toBe('Concurrent Test');

    // Verify seeds are different
    expect(calls[0][1].params.seed).not.toBe(calls[1][1].params.seed);

    // Verify mapping
    calls.forEach((call) => {
        const item = call[1];
        expect(item.base64).toBe(`image-result-${item.params.seed}`);
    });
  });

  it('handles mixed success and failure scenarios without losing parameter association', async () => {
    // Scenario: 3 variants. 1st success, 2nd fail, 3rd success.

    let callCount = 0;
    apiCall.mockImplementation(async (url, data) => {
        if (url.includes('/models')) return MOCK_MODELS;
        if (url.includes('/styles')) return MOCK_STYLES;
        if (url.includes('/generate')) {
            callCount++;
            // The calls happen sequentially in the loop start, but are awaited in parallel.
            // callCount 2 corresponds to the second call made (2nd variant).
            if (callCount === 2) {
                throw new Error('Simulated API Failure');
            }
            return {
                images: [`success-${data.seed}`]
            };
        }
        return {};
    });

    render(<App />);
    await waitFor(() => expect(screen.getByText(/Venice Generator/i)).toBeInTheDocument());

    const variantsInput = screen.getByLabelText(/Generation Variants/i);
    fireEvent.change(variantsInput, { target: { value: 3 } });

    const promptInput = screen.getByLabelText(/^Prompt$/i);
    fireEvent.change(promptInput, { target: { value: 'Mixed Test' } });

    const generateBtn = screen.getByText(/Generate Image/i);
    fireEvent.click(generateBtn);

    // We expect 2 successful addDoc calls
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(2);
    });

    // We should also see a toast or status update, but checking addDoc is enough for data integrity
    const calls = addDoc.mock.calls;

    // We need to verify which ones succeeded.
    // Since callCount 2 failed, that was the second iteration (i=1, seed=base+1).
    // So we expect seed=base+0 and seed=base+2 to be saved.

    const seeds = calls.map(c => c[1].params.seed).sort((a,b) => a - b);

    // The difference between the two seeds should be 2 (because the middle one is missing)
    expect(seeds.length).toBe(2);
    expect(seeds[1] - seeds[0]).toBe(2);

    // Verify content
    calls.forEach(call => {
        const item = call[1];
        expect(item.base64).toBe(`success-${item.params.seed}`);
    });
  });
});
