/**
 * Compresses a base64 encoded image using canvas.
 * Converts any input format to JPEG to reduce size.
 *
 * @param {string} base64Src - The base64 string of the image (without data URI prefix).
 * @param {number} [quality=0.85] - Compression quality (0 to 1).
 * @returns {Promise<string>} A promise that resolves with the compressed base64 string (without prefix).
 */
export const compressImage = async (base64Src, quality = 0.85) => {
    return new Promise((resolve, reject) => {
        // Simple MIME detection
        let mimeType = 'image/png';
        if (base64Src.startsWith('/9j/')) mimeType = 'image/jpeg';
        else if (base64Src.startsWith('UklGR')) mimeType = 'image/webp';

        const img = new Image();
        let loaded = false;

        const cleanup = () => {
            img.onload = null;
            img.onerror = null;
            img.src = '';
        };

        const timeout = setTimeout(() => {
            if (!loaded) {
                cleanup();
                reject(new Error('Image load timeout after 30 seconds'));
            }
        }, 30000); // 30 second timeout

        img.onload = () => {
            loaded = true;
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                cleanup(); // Fix Bug #5: Cleanup after successful processing
                resolve(compressedBase64.split(',')[1]);
            } catch (err) {
                cleanup(); // Fix Bug #5: Cleanup on error
                reject(err);
            }
        };

        img.onerror = (e) => {
            loaded = true;
            clearTimeout(timeout);
            cleanup(); // Fix Bug #5: Cleanup on error
            reject(e);
        };

        img.src = `data:${mimeType};base64,${base64Src}`;
    });
};
