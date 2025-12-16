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

// Mock document.createElement('canvas')
const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement(tagName);
};

// Global Image mock
class MockImage {
  constructor() {
    this.width = 100;
    this.height = 100;
    this.src = '';
    this._onload = null;
    this._onerror = null;
  }

  set onload(callback) {
    this._onload = callback;
    if (callback) {
        // Default behavior: load successfully
        setTimeout(() => callback(), 10);
    }
  }

  get onload() {
      return this._onload;
  }

  set onerror(callback) {
      this._onerror = callback;
  }

  get onerror() {
      return this._onerror;
  }
}

global.Image = MockImage;

describe('image compression utility', () => {
  beforeEach(() => {
    mockCanvas.width = 100;
    mockCanvas.height = 100;
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,testCompressedData');

    // Reset Image mock to default behavior
    global.Image = MockImage;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
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
    // Override Image mock to NOT trigger onload automatically
    class MockImageNeverLoads {
        constructor() {
            this.width = 100;
            this.height = 100;
            this.src = '';
            this.onload = null;
            this.onerror = null;
        }
    }
    global.Image = MockImageNeverLoads;

    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    vi.useFakeTimers();

    const promise = compressImage(base64Image);

    vi.advanceTimersByTime(31000);

    await expect(promise).rejects.toThrow('Image load timeout after 30 seconds');
  });

  it('should handle image loading errors', async () => {
      // Override Image mock to trigger onerror
      class MockImageError {
          constructor() {
            this.width = 100;
            this.height = 100;
            this.src = '';
            this._onload = null;
            this._onerror = null;
          }

          set onload(val) { this._onload = val; }

          set onerror(callback) {
              this._onerror = callback;
              if (callback) {
                  setTimeout(() => callback(new Error('Image load error')), 10);
              }
          }
      }
      global.Image = MockImageError;

    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    await expect(compressImage(base64Image)).rejects.toThrow();
  });
});
