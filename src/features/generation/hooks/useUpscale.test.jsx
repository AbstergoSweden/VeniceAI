import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpscale } from './useUpscale';
import { updateDoc } from 'firebase/firestore';
import { apiCall } from '../../../utils/api';
import { compressImage } from '../../../utils/image';

// Mock dependencies
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
    updateDoc: vi.fn(),
}));

vi.mock('../../../utils/api', () => ({
    apiCall: vi.fn(),
}));

vi.mock('../../../utils/image', () => ({
    compressImage: vi.fn(),
}));

vi.mock('../../../utils/config', () => ({
    CONFIG: {
        BASE_API_URL: 'https://api.venice.ai',
        COLLECTION_NAME: 'images'
    }
}));

describe('useUpscale', () => {
    const mockUser = { uid: 'test-user' };
    const mockAppId = 'test-app';
    const mockDb = {};
    const mockShowToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock API success
        apiCall.mockResolvedValue(new ArrayBuffer(8)); // Mock binary response

        // Mock compressImage success
        compressImage.mockResolvedValue('compressed-base64-string');

        // Mock FileReader
        // Since FileReader is used inside the hook, we need to ensure it works in JSDOM or mock it.
        // JSDOM has FileReader, but let's ensure readAsDataURL triggers onloadend.
    });

    it('should validate target ID and prevent update if missing', async () => {
        const { result } = renderHook(() => useUpscale({
            user: mockUser,
            appId: mockAppId,
            db: mockDb,
            showToast: mockShowToast
        }));

        const invalidTarget = {
            base64: 'original-base64',
            // Missing ID
        };

        act(() => {
            result.current.handleOpenEnhance(invalidTarget);
        });

        await act(async () => {
            await result.current.handleEnhance();
        });

        // Since FileReader is async, we need to wait a bit.
        // However, we can't easily wait for the FileReader callback unless we mock FileReader.
        // But let's rely on waitFor.

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('Cannot enhance offline/mock images'),
                'error'
            );
        });

        expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should validate target ID and prevent update if starts with mock-', async () => {
        const { result } = renderHook(() => useUpscale({
            user: mockUser,
            appId: mockAppId,
            db: mockDb,
            showToast: mockShowToast
        }));

        const invalidTarget = {
            id: 'mock-123',
            base64: 'original-base64',
        };

        act(() => {
            result.current.handleOpenEnhance(invalidTarget);
        });

        await act(async () => {
            await result.current.handleEnhance();
        });

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('Cannot enhance offline/mock images'),
                'error'
            );
        });

        expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should proceed with update if target ID is valid', async () => {
        const { result } = renderHook(() => useUpscale({
            user: mockUser,
            appId: mockAppId,
            db: mockDb,
            showToast: mockShowToast
        }));

        const validTarget = {
            id: 'valid-id-123',
            base64: 'original-base64',
        };

        act(() => {
            result.current.handleOpenEnhance(validTarget);
        });

        await act(async () => {
            await result.current.handleEnhance();
        });

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalled();
        });

        expect(mockShowToast).toHaveBeenCalledWith("Image enhanced successfully!", "success");
        expect(compressImage).toHaveBeenCalled();
    });
});
