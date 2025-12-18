/**
 * Global Configuration for the Application
 */
export const CONFIG = {
    // Loaded from .env
    API_KEYS: (import.meta.env.VITE_VENICE_API_KEYS || '').split(',').filter(Boolean).map(key => key.trim()),
    BASE_API_URL: "https://api.venice.ai/api/v1",
    DEFAULT_NEGATIVE_PROMPT: "Ugly, old, overage, low-resolution, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, JPEG artifacts, signature, watermark, username, blurry.",
    COLLECTION_NAME: 'generatedImages'
};
