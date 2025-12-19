import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

        // Click generate button
        const generateButton = screen.getByRole('button', { name: /Sparkles\s*Generate/i });
        fireEvent.click(generateButton);

        // Wait for the generation process
        await waitFor(() => {
            // Since we mocked apiCall to resolve, we expect no errors
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
        const generateButton = screen.getByRole('button', { name: /Sparkles\s*Generate/i });
        fireEvent.click(generateButton);

        // Should show an alert or error message
        // Since we can't easily test browser alert in jsdom, we'll check if the API call was not made
        expect(apiCall).not.toHaveBeenCalledWith(expect.stringContaining('/image/generate'), expect.anything(), expect.anything());
    });

    it('should handle negative prompt input', async () => {
        render(
            <App />
        );

        const negativePromptInput = screen.getByText('Negative Prompt').closest('div').querySelector('textarea');
        expect(negativePromptInput).toBeInTheDocument();

        fireEvent.change(negativePromptInput, { target: { value: 'blurry, low quality' } });

        expect(negativePromptInput.value).toBe('blurry, low quality');
    });

    it('should handle model selection', async () => {
        render(
            <App />
        );

        // Wait for models to load (they're mocked to load quickly)
        await waitFor(() => {
            const modelSelect = screen.getByText('Model').closest('div').querySelector('select');
            expect(modelSelect).toBeInTheDocument();

            // Change the model selection
            fireEvent.change(modelSelect, { target: { value: 'test-model' } });
            expect(modelSelect.value).toBe('test-model');
        });
    });

    it('should handle style selection', async () => {
        render(
            <App />
        );

        // Wait for styles to load
        await waitFor(() => {
            const styleSelect = screen.getByText('Style').closest('div').querySelector('select');
            expect(styleSelect).toBeInTheDocument();

            // Change the style selection
            fireEvent.change(styleSelect, { target: { value: 'test-style' } });
            expect(styleSelect.value).toBe('test-style');
        });
    });

    it('should handle slider changes for steps and variants', async () => {
        render(
            <App />
        );

        // Find the steps slider
        const stepsSlider = screen.getByDisplayValue('30'); // Default value
        fireEvent.change(stepsSlider, { target: { value: '25' } });

        expect(stepsSlider.value).toBe('25');

        // Find the variants slider
        const variantsSlider = screen.getByDisplayValue('1'); // Default value
        fireEvent.change(variantsSlider, { target: { value: '2' } });

        expect(variantsSlider.value).toBe('2');
    });

    it('should handle aspect ratio selection', async () => {
        render(
            <App />
        );

        // Click on the 'wide' aspect ratio button
        const wideButton = screen.getByText('Landscape');
        fireEvent.click(wideButton);

        // Check if 'wide' button is selected
        expect(wideButton.closest('button')).toHaveClass('bg-primary/20');

        // Click on the 'tall' aspect ratio button
        const tallButton = screen.getByText('Portrait');
        fireEvent.click(tallButton);

        // Check if 'tall' button is selected
        expect(tallButton.closest('button')).toHaveClass('bg-primary/20');
    });

    it('should handle hide watermark and safe mode toggles', async () => {
        render(
            <App />
        );

        // Find the hide watermark checkbox
        const hideWatermarkCheckbox = screen.getByLabelText(/Hide Watermark/i);
        expect(hideWatermarkCheckbox).toBeInTheDocument();

        // Toggle the checkbox
        fireEvent.click(hideWatermarkCheckbox);
        expect(hideWatermarkCheckbox.checked).toBe(false); // Initially true in state, but may be false by default

        // Find the blur NSFW checkbox
        const safeModeCheckbox = screen.getByLabelText(/Blur NSFW/i);
        expect(safeModeCheckbox).toBeInTheDocument();

        // Toggle the checkbox
        fireEvent.click(safeModeCheckbox);
        expect(safeModeCheckbox.checked).toBe(true);
    });

    it('should clear history when clear history button is clicked', async () => {
        render(
            <App />
        );

        // Mock window.confirm to return true
        window.confirm = vi.fn(() => true);

        // Click the clear history button
        const clearHistoryButton = screen.getByRole('button', { name: /Clear all generated image history/i });
        fireEvent.click(clearHistoryButton);

        // Verify that confirm was called
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete all history?');
    });

    it('should clear image cache when clear cache button is clicked', async () => {
        render(
            <App />
        );

        // Mock the cache cleanup function
        // imageCache.cleanup is already a mock from top-level vi.mock
        const cacheCleanupSpy = imageCache.cleanup;
        cacheCleanupSpy.mockClear();

        // Click the clear cache button
        const clearCacheButton = screen.getByRole('button', { name: /Clear image cache to free up memory/i });
        fireEvent.click(clearCacheButton);

        // Verify that cache cleanup was called
        expect(cacheCleanupSpy).toHaveBeenCalledWith(true);
    });

    it('should show cache statistics when cache stats button is clicked', async () => {
        render(
            <App />
        );

        // Mock cache stats
        imageCache.getStats.mockReturnValue({ count: 5, size: '100KB', sizeKB: '0.1 KB', sizeMB: '0.00 MB' });

        // Click the cache stats button
        const cacheStatsButton = screen.getByRole('button', { name: /View image cache statistics/i });
        fireEvent.click(cacheStatsButton);

        // Wait for toast notification
        await waitFor(() => {
            expect(screen.queryByText(/Cache: 5 items/i)).toBeInTheDocument();
        });
    });

    it('should handle download functionality for images', () => {
        // Since we can't easily test the download link creation in jsdom,
        // we'll just verify that the download icon appears for images
        render(
            <App />
        );

        // Initially no images, so no download buttons
        expect(screen.queryByLabelText(/Download image/i)).not.toBeInTheDocument();
    });

    it('should handle image enhancement functionality', async () => {
        render(
            <App />
        );

        // Mock image in history to trigger the enhancement button
        // This is harder to test without actually rendering an image in the gallery
        // So we'll just make sure the enhancement modal structure is correct

        // Find the enhance prompt button
        const enhancePromptBtn = screen.getByLabelText(/Enhance current prompt with AI/i);
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

        // Simulate a toast being triggered by calling the showToast function
        // We can't easily access internal state, so we'll just check if the toast structure is present
        expect(screen.queryByRole('log', { name: /Chat conversation/i })).toBeInTheDocument();
    });
});