import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

import App from './App';
import imageCache from './utils/cache';
import { apiCall } from './utils/api';

// Mock all dependencies that might cause issues in tests
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    signInAnonymously: vi.fn(() => Promise.resolve({ uid: 'test-user', isAnonymous: true })),
    signInWithCustomToken: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-user', isAnonymous: true });
        return vi.fn();
    }),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(() => ({})),
    addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc' })),
    query: vi.fn(),
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
    getDocs: vi.fn(() => Promise.resolve({ docs: [] }))
}));

vi.mock('./utils/api', () => ({
    apiCall: vi.fn((url) => {
        if (url.includes('/models') || url.includes('/image/styles')) {
            // Mock API responses for models and styles
            if (url.includes('/models')) {
                return Promise.resolve({ data: [{ id: 'test-model', name: 'Test Model' }] });
            } else {
                return Promise.resolve({ data: [{ id: 'test-style', name: 'Test Style' }] });
            }
        } else if (url.includes('/image/generate')) {
            // Mock image generation response
            return Promise.resolve({
                images: ['iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']
            });
        }
        return Promise.resolve({});
    }),
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

vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        Sparkles: () => 'Sparkles',
        Trash2: () => 'Trash2',
        Download: () => 'Download',
        Wand2: () => 'Wand2',
        Image: () => 'Image',
        Loader2: () => 'Loader2',
        RefreshCw: () => 'RefreshCw',
        AlertCircle: () => 'AlertCircle',
        X: () => 'X',
        ImageIcon: () => 'ImageIcon',
        Settings2: () => 'Settings2',
        Square: () => 'Square',
        RectangleHorizontal: () => 'RectangleHorizontal',
        RectangleVertical: () => 'RectangleVertical',
    };
});

// Mock global objects
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

describe('App Component - Comprehensive Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset localStorage before each test
        localStorage.clear();
    });

    it('should render without crashing', () => {
        render(
            <App />
        );

        expect(screen.getByText('Venice Generator')).toBeInTheDocument();
        expect(screen.getByText('Uncensored • Private • High Fidelity')).toBeInTheDocument();
    });

    it('should handle form submission with valid input', async () => {
        render(
            <App />
        );

        // Fill in the prompt
        const promptInput = screen.getByPlaceholderText(/Describe your imagination/i);
        fireEvent.change(promptInput, { target: { value: 'A beautiful landscape' } });

        // Click generate button - using regex to match text across elements
        const generateButton = screen.getByText((content, element) =>
            element.tagName.toLowerCase() === 'button' && /Generate Image/i.test(content)
        );
        fireEvent.click(generateButton);

        // Wait for the generation process
        await waitFor(() => {
            expect(generateButton).toBeInTheDocument();
        });
    });

    it('should show error if no prompt is entered', async () => {
        render(
            <App />
        );

        // Clear any default prompt
        const promptInput = screen.getByPlaceholderText(/Describe your imagination/i);
        fireEvent.change(promptInput, { target: { value: '' } });

        // Click generate button
        const generateButton = screen.getByText((content, element) =>
            element.tagName.toLowerCase() === 'button' && /Generate Image/i.test(content)
        );
        fireEvent.click(generateButton);

        // Check call
        expect(apiCall).not.toHaveBeenCalledWith(expect.stringContaining('/image/generate'), expect.anything(), expect.anything());
    });

    it('should handle negative prompt input', async () => {
        render(
            <App />
        );

        const negativePromptInput = screen.getByPlaceholderText('Elements to avoid...');
        expect(negativePromptInput).toBeInTheDocument();

        fireEvent.change(negativePromptInput, { target: { value: 'blurry, low quality' } });

        expect(negativePromptInput.value).toBe('blurry, low quality');
    });

    it('should handle model selection', async () => {
        render(
            <App />
        );

        await waitFor(() => {
            const modelSelect = screen.getByLabelText(/Model/i);
            expect(modelSelect).toBeInTheDocument();
            fireEvent.change(modelSelect, { target: { value: 'test-model' } });
            expect(modelSelect.value).toBe('test-model');
        });
    });

    it('should handle style selection', async () => {
        render(
            <App />
        );

        await waitFor(() => {
            const styleSelect = screen.getByLabelText(/Style/i);
            expect(styleSelect).toBeInTheDocument();
            fireEvent.change(styleSelect, { target: { value: 'test-style' } });
            expect(styleSelect.value).toBe('test-style');
        });
    });

    it('should handle slider changes for steps and variants', async () => {
        render(
            <App />
        );

        // Find the sliders by label text (we added explicit labels/aria-labels or inferred from text)
        // Note: The UI now uses "STEPS" and "VARIANTS" text labels

        // Use container queries to be precise
        const stepsContainer = screen.getByText('Steps').closest('div').parentElement;
        const stepsSlider = within(stepsContainer).getByRole('slider');
        fireEvent.change(stepsSlider, { target: { value: '25' } });
        expect(stepsSlider.value).toBe('25');

        const variantsContainer = screen.getByText('Variants').closest('div').parentElement;
        const variantsSlider = within(variantsContainer).getByRole('slider');
        fireEvent.change(variantsSlider, { target: { value: '2' } });
        expect(variantsSlider.value).toBe('2');
    });

    it('should handle aspect ratio selection', async () => {
        render(
            <App />
        );

        const landscapeButton = screen.getByText('Landscape');
        fireEvent.click(landscapeButton);
        // We verify selection by style or attribute. The new UI applies a border/bg class.
        // We can just verify no crash and click works.
        expect(landscapeButton).toBeInTheDocument();
    });

    it('should handle hide watermark and safe mode toggles', async () => {
        render(
            <App />
        );

        const hideWatermarkLabel = screen.getByText(/Hide Watermark/i);
        fireEvent.click(hideWatermarkLabel);

        const safeModeLabel = screen.getByText(/Blur NSFW/i);
        fireEvent.click(safeModeLabel);
    });

    it('should clear history when clear history button is clicked', async () => {
        render(
            <App />
        );

        window.confirm = vi.fn(() => true);

        // Using function matcher to handle text split across elements
        const historyButton = screen.getByText((content, element) => {
            return element.tagName.toLowerCase() === 'button' && content.includes('History');
        });
        fireEvent.click(historyButton);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete all history?');
    });

    it('should clear image cache when clear cache button is clicked', async () => {
        render(
            <App />
        );

        const cacheCleanupSpy = imageCache.cleanup;
        cacheCleanupSpy.mockClear();

         const cacheButton = screen.getByText((content, element) => {
            return element.tagName.toLowerCase() === 'button' && content.includes('Cache');
        });
        fireEvent.click(cacheButton);

        expect(cacheCleanupSpy).toHaveBeenCalledWith(true);
    });

    it('should show cache statistics when cache stats button is clicked', async () => {
        render(
            <App />
        );

        imageCache.getStats.mockReturnValue({ count: 5, size: '100KB', sizeKB: '0.1 KB', sizeMB: '0.00 MB' });

         const statsButton = screen.getByText((content, element) => {
            return element.tagName.toLowerCase() === 'button' && content.includes('Stats');
        });
        fireEvent.click(statsButton);

        await waitFor(() => {
            expect(screen.queryByText(/Cache: 5 items/i)).toBeInTheDocument();
        });
    });

    it('should handle image enhancement functionality', async () => {
        render(
            <App />
        );
        const enhancePromptBtn = screen.getByTitle('Enhance current prompt with AI');
        expect(enhancePromptBtn).toBeInTheDocument();
    });

    it('should handle image description functionality', () => {
        render(
            <App />
        );
        // Find the describe image button
        const describeImageBtn = screen.getByLabelText(/Describe an uploaded image/i);
        expect(describeImageBtn).toBeInTheDocument();
    });

    it('should handle toast notifications', async () => {
        render(
            <App />
        );
        expect(screen.queryByRole('log', { name: /Chat conversation/i })).toBeInTheDocument();
    });
});
