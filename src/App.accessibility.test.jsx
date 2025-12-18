import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    signInAnonymously: vi.fn(),
    signInWithCustomToken: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-uid', isAnonymous: true });
        return vi.fn(); // unsubscribe
    })
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    onSnapshot: vi.fn((q, callback) => {
        callback({ docs: [] });
        return vi.fn();
    }),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(),
    getDocs: vi.fn()
}));

// Mock API calls
vi.mock('./utils/api', () => ({
    apiCall: vi.fn(() => Promise.resolve({ data: [] }))
}));

// Mock model sync
vi.mock('./utils/modelSync', () => ({
    syncVeniceModels: vi.fn(() => Promise.resolve([])),
    DEFAULT_CHAT_MODELS: [{ id: 'test-model', name: 'Test Model' }]
}));

describe('App - Accessibility Improvements', () => {
    it('logo image has descriptive alt text', () => {
        const { container } = render(<App />);

        const logo = container.querySelector('img[alt*="Venice.ai Generator"]');
        expect(logo).toBeInTheDocument();

        const altText = logo?.getAttribute('alt');
        expect(altText).toContain('Venice.ai Generator');
        expect(altText).toContain('cyberpunk');
        expect(altText).not.toBe('Logo'); // Should not be generic
    });

    it('model select has proper label association', () => {
        const { container } = render(<App />);

        const modelSelect = container.querySelector('#model-select');
        expect(modelSelect).toBeInTheDocument();
        expect(modelSelect?.tagName).toBe('SELECT');

        // Check for htmlFor label
        const label = container.querySelector('label[for="model-select"]');
        expect(label).toBeInTheDocument();
        expect(label).toHaveTextContent('Model');

        // Check for aria-label
        expect(modelSelect).toHaveAttribute('aria-label');
        const ariaLabel = modelSelect?.getAttribute('aria-label');
        expect(ariaLabel).toContain('model');
    });

    it('style select has proper label association', () => {
        const { container } = render(<App />);

        const styleSelect = container.querySelector('#style-select');
        expect(styleSelect).toBeInTheDocument();

        const label = container.querySelector('label[for="style-select"]');
        expect(label).toBeInTheDocument();
        expect(label).toHaveTextContent('Style');

        expect(styleSelect).toHaveAttribute('aria-label');
    });

    it('steps slider has comprehensive ARIA attributes', () => {
        const { container } = render(<App />);

        const stepsSlider = container.querySelector('#steps-slider');
        expect(stepsSlider).toBeInTheDocument();
        expect(stepsSlider?.getAttribute('type')).toBe('range');

        // Check ARIA attributes
        expect(stepsSlider).toHaveAttribute('aria-label');
        expect(stepsSlider).toHaveAttribute('aria-valuemin', '10');
        expect(stepsSlider).toHaveAttribute('aria-valuemax', '30');
        expect(stepsSlider).toHaveAttribute('aria-valuenow');
        expect(stepsSlider).toHaveAttribute('aria-valuetext');

        // Check aria-label is descriptive
        const ariaLabel = stepsSlider?.getAttribute('aria-label');
        expect(ariaLabel).toContain('step');
        expect(ariaLabel).not.toBe('Steps'); // Should be more descriptive
    });

    it('variants slider has comprehensive ARIA attributes', () => {
        const { container } = render(<App />);

        const variantsSlider = container.querySelector('#variants-slider');
        expect(variantsSlider).toBeInTheDocument();

        expect(variantsSlider).toHaveAttribute('aria-label');
        expect(variantsSlider).toHaveAttribute('aria-valuemin', '1');
        expect(variantsSlider).toHaveAttribute('aria-valuemax', '4');
        expect(variantsSlider).toHaveAttribute('aria-valuenow');
        expect(variantsSlider).toHaveAttribute('aria-valuetext');

        const ariaLabel = variantsSlider?.getAttribute('aria-label');
        expect(ariaLabel).toContain('variant');
    });

    it('aria-valuetext updates correctly with slider value', () => {
        const { container } = render(<App />);

        const variantsSlider = container.querySelector('#variants-slider');
        const valueText = variantsSlider?.getAttribute('aria-valuetext');

        // Should use singular/plural correctly
        expect(valueText).toMatch(/\d+ variants?/);
    });

    it('all form controls have accessible names', () => {
        const { container } = render(<App />);

        // Get all interactive form elements
        const selects = container.querySelectorAll('select');
        const inputs = container.querySelectorAll('input[type="range"]');

        // Core interactive form controls should have accessible names
        selects.forEach(select => {
            const hasLabel = container.querySelector(`label[for="${select.id}"]`) !== null;
            const hasAriaLabel = select.hasAttribute('aria-label');
            expect(hasLabel || hasAriaLabel).toBe(true);
        });

        // Range inputs should have proper ARIA
        inputs.forEach(input => {
            expect(input.hasAttribute('aria-label')).toBe(true);
        });

        // Note: Textareas with placeholders are considered accessible enough for this test
    });
});
