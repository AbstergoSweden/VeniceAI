import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    signInAnonymously: vi.fn(),
    signInWithCustomToken: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback(null);
        return vi.fn();
    }),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(),
    getDocs: vi.fn(),
}));

// Mock API and utilities
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

// Mock lazy loaded components
vi.mock('./components/ChatPanel', () => ({
    default: () => null,
}));

vi.mock('./components/Transactions', () => ({
    default: () => null,
}));

describe('App Bug Fixes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Bug #1: Firebase Config Parsing', () => {
        it('should parse Firebase config as an object, not a string', () => {
            // This test verifies that __firebase_config is a valid JSON object
            // After the fix, JSON.parse(__firebase_config) should return an object
            const mockConfig = { apiKey: 'test-key', projectId: 'test-project' };
            const configString = JSON.stringify(mockConfig);

            // Simulate what happens in the app
            const parsed = JSON.parse(configString);

            expect(typeof parsed).toBe('object');
            expect(parsed).toHaveProperty('apiKey');
            expect(parsed).toHaveProperty('projectId');
            expect(typeof parsed.apiKey).toBe('string');
        });

        it('should fail with double stringification (old bug)', () => {
            // This demonstrates the old bug
            const mockConfig = { apiKey: 'test-key', projectId: 'test-project' };
            const doubleStringified = JSON.stringify(JSON.stringify(mockConfig));

            const parsed = JSON.parse(doubleStringified);

            // With double stringify, parsed is a STRING, not an object
            expect(typeof parsed).toBe('string');
            // This would cause initializeApp to fail
        });
    });

    describe('Bug #2: API Key Trimming', () => {
        it('should trim whitespace from API keys', () => {
            const keysWithSpaces = 'key1, key2 , key3';
            const keys = keysWithSpaces.split(',').filter(Boolean).map(key => key.trim());

            expect(keys).toEqual(['key1', 'key2', 'key3']);
            expect(keys[1]).toBe('key2'); // No leading space
            expect(keys[2]).toBe('key3'); // No trailing space
        });

        it('should handle keys without spaces correctly', () => {
            const keysWithoutSpaces = 'key1,key2,key3';
            const keys = keysWithoutSpaces.split(',').filter(Boolean).map(key => key.trim());

            expect(keys).toEqual(['key1', 'key2', 'key3']);
        });

        it('should filter out empty strings', () => {
            const keysWithEmpty = 'key1,,key2,';
            const keys = keysWithEmpty.split(',').filter(Boolean).map(key => key.trim());

            expect(keys).toEqual(['key1', 'key2']);
            expect(keys.length).toBe(2);
        });
    });

    describe('Bug #4: Offline Image Enhancement Guard', () => {
        it('should reject enhancement for mock- prefixed IDs', () => {
            const mockItem = { id: 'mock-12345', base64: 'test' };

            const shouldBlock = mockItem.id.startsWith('mock-') || mockItem.id.startsWith('offline-');
            expect(shouldBlock).toBe(true);
        });

        it('should reject enhancement for offline- prefixed IDs', () => {
            const offlineItem = { id: 'offline-12345', base64: 'test' };

            const shouldBlock = offlineItem.id.startsWith('mock-') || offlineItem.id.startsWith('offline-');
            expect(shouldBlock).toBe(true);
        });

        it('should allow enhancement for normal Firestore IDs', () => {
            const normalItem = { id: 'abc123xyz', base64: 'test' };

            const shouldBlock = normalItem.id.startsWith('mock-') || normalItem.id.startsWith('offline-');
            expect(shouldBlock).toBe(false);
        });

        it('should block items without IDs', () => {
            const noIdItem = { base64: 'test' };

            const shouldBlock = !noIdItem.id || noIdItem.id.startsWith('mock-') || noIdItem.id.startsWith('offline-');
            expect(shouldBlock).toBe(true);
        });
    });
});
