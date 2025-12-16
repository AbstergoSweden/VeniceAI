import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImage } from './image';

// Mock Canvas API
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toDataURL: vi.fn(),
};

const mockContext = {
  drawImage: vi.fn(),
};

global.HTMLCanvasElement = vi.fn(() => mockCanvas);
global.Image = vi.fn(() => ({
  width: 100,
  height: 100,
  src: '',
  set onload(value) {
    // Simulate image loading after a short delay
    setTimeout(() => {
      if (typeof value === 'function') value();
    }, 10);
  },
  set onerror(value) {
    // In case of error
    if (typeof value === 'function') {
      // No error in this test
    }
  }
}));

describe('image compression utility', () => {
  beforeEach(() => {
    mockCanvas.width = 100;
    mockCanvas.height = 100;
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,testCompressedData');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should compress an image and return base64 string without data prefix', async () => {
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='; // 1x1 PNG
    const quality = 0.8;

    const result = await compressImage(base64Image, quality);

    expect(result).toBe('testCompressedData'); // Should return the part after data:image/jpeg;base64,
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', quality);
  });

  it('should detect JPEG format from base64 header', async () => {
    const base64Image = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA=='; // JPEG header

    await compressImage(base64Image);

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85); // Default quality
  });

  it('should detect WebP format from base64 header', async () => {
    const base64Image = 'UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAAB/32VtaWYgAAAAAAA='; // WebP header

    await compressImage(base64Image);

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85); // Should always output JPEG regardless of input
  });

  it('should handle timeout properly', async () => {
    // Create a mock image that never loads to trigger timeout
    const mockImageNeverLoads = {
      width: 100,
      height: 100,
      src: '',
      onload: null,
      onerror: null,
    };

    global.Image = vi.fn(() => mockImageNeverLoads);

    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    // Mock setTimeout to control the timing
    vi.useFakeTimers();

    const promise = compressImage(base64Image);

    // Fast-forward time beyond the 30 second timeout
    vi.advanceTimersByTime(31000);

    await expect(promise).rejects.toThrow('Image load timeout after 30 seconds');

    vi.useRealTimers();
  });

  it('should handle image loading errors', async () => {
    const mockImageError = {
      width: 100,
      height: 100,
      src: '',
      set onload(value) {
        // Don't call onload, but simulate an error
      },
      set onerror(value) {
        if (typeof value === 'function') {
          setTimeout(() => value(new Error('Image load error')), 10);
        }
      }
    };

    global.Image = vi.fn(() => mockImageError);

    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    await expect(compressImage(base64Image)).rejects.toThrow();
  });
});