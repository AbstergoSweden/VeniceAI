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

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        },
        get length() {
            return Object.keys(store).length;
        }
    };
})();

global.localStorage = localStorageMock;

// Mock Global Variables for Vite/Build
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
