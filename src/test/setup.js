import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock Canvas for image compression tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
}));
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/jpeg;base64,mockCompressedImage");
