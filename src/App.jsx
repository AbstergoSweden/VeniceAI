import React, { useState, useEffect, lazy, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Sparkles, Trash2, Download, Wand2, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, X } from 'lucide-react';
import { apiCall } from './utils/api';
import { compressImage } from './utils/image';
import imageCache from './utils/cache';

// Lazy load heavy components
const ChatPanel = lazy(() => import('./components/ChatPanel'));
const Transactions = lazy(() => import('./components/Transactions'));

/**
 * Loading component for lazy-loaded components.
 * @param {object} props - Component props.
 * @param {string} [props.message="Loading..."] - The message to display while loading.
 */
const LoadingComponent = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant">{message}</p>
    </div>
);


// --- CONFIGURATION ---
const CONFIG = {
    // Loaded from .env
    API_KEYS: (import.meta.env.VITE_VENICE_API_KEYS || '').split(',').filter(Boolean).map(key => key.trim()),
    BASE_API_URL: "https://api.venice.ai/api/v1",
    DEFAULT_NEGATIVE_PROMPT: "Ugly, old, overage, low-resolution, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, JPEG artifacts, signature, watermark, username, blurry.",
    COLLECTION_NAME: 'generatedImages'
};

// --- VENICE CHAT MODELS ---
const VENICE_CHAT_MODELS = [
    { id: 'mistral-31-24b', name: 'Venice Medium', vision: true, reasoning: false },
    { id: 'grok-41-fast', name: 'Grok 4.1 Fast', vision: true, reasoning: true },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', vision: true, reasoning: true },
    { id: 'claude-opus-45', name: 'Claude Opus 4.5', vision: true, reasoning: true },
    { id: 'google-gemma-3-27b-it', name: 'Google Gemma 3 27B', vision: true, reasoning: false },
    { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen 3 235B Instruct', vision: false, reasoning: false },
    { id: 'qwen3-235b-a22b-thinking-2507', name: 'Qwen 3 235B Thinking', vision: false, reasoning: true },
    { id: 'openai-gpt-52', name: 'GPT-5.2', vision: false, reasoning: true },
];

const DEFAULT_CHAT_MODEL = 'mistral-31-24b'; // Venice Medium - vision capable

// --- VENICE PROMPT ENGINEERING SYSTEM PROMPT ---
const VENICE_SYSTEM_PROMPT = `You are an expert prompt engineer specializing in creating highly detailed, evocative prompts for AI image generation (Midjourney, Stable Diffusion, DALL-E, etc.).

Your task is to transform user input into a single, powerful image generation prompt that maximizes visual quality and creative impact.

ANALYSIS PHASE:
- Identify the core subject/concept
- Determine mood, atmosphere, and emotional tone
- Assess level of abstraction and complexity
- Note any specific style preferences

OUTPUT REQUIREMENTS:
- Create ONE comprehensive prompt (not a conversation)
- Include vivid sensory details (lighting, textures, colors, atmosphere)
- Add technical quality markers (4K, highly detailed, professional photography, etc.)
- Incorporate artistic style references when appropriate
- Keep under 200 words but maximize descriptive density
- DO NOT include command prefixes like "/imagine prompt:" - just the prompt itself
- DO NOT ask questions or have a conversation - output the prompt directly

ENHANCEMENT GUIDELINES:
- For simple inputs: expand with relevant details, mood, and technical specs
- For existing prompts: refine, add depth, improve coherence
- Always maintain the user's original intent
- Prioritize visual richness and specificity

Return ONLY the enhanced prompt text, nothing else.`;


// --- FIREBASE INITIALIZATION ---
let firebaseConfig, appId;

// Validate and load Firebase configuration
if (typeof __firebase_config === 'undefined') {
    throw new Error("Firebase configuration is required but not provided. Please configure firebase in vite.config.js or build process.");
} else {
    try {
        firebaseConfig = JSON.parse(__firebase_config);
    } catch {
        throw new Error("Invalid Firebase configuration format. Please ensure __firebase_config contains valid JSON.");
    }
}

appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase only once
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    // Handle case where app is already initialized or config is bad
    console.error("Firebase initialization failed:", e);
    // Re-throw to fail fast in production
    throw e;
}



// --- HELPER FUNCTIONS ---
// Moved to src/utils/api.js and src/utils/image.js

/**
 * Main Application Component.
 * Handles the state and logic for the image generator, chat, and history.
 */
export default function App() {
    // --- STATE ---
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);

    // Form State
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState(CONFIG.DEFAULT_NEGATIVE_PROMPT);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('none');
    const [aspectRatio, setAspectRatio] = useState('square');
    const [steps, setSteps] = useState(30);
    const [variants, setVariants] = useState(1);
    const [seed] = useState('');
    const [hideWatermark, setHideWatermark] = useState(true);
    const [safeMode, setSafeMode] = useState(false);

    // Data Lists
    const [modelsList, setModelsList] = useState([]);
    const [stylesList, setStylesList] = useState([]);

    // UI State

    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [promptLoading, setPromptLoading] = useState(false); // For suggestion/enhance
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' }); // Toast notifications

    // Modal State
    const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
    const [enhanceTarget, setEnhanceTarget] = useState(null);
    const [enhancePrompt, setEnhancePrompt] = useState('');
    const [enhanceCreativity, setEnhanceCreativity] = useState(0.5);

    // Image Description Modal State
    const [describeModalOpen, setDescribeModalOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imageDescription, setImageDescription] = useState('');
    const [describingImage, setDescribingImage] = useState(false);

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {string} [type='info'] - The type of toast ('info', 'success', 'warning', 'error').
     */
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    // --- EFFECTS ---

    // 1. Auth
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    showToast('Authenticated successfully', 'success');
                } else {
                    await signInAnonymously(auth);
                    showToast('Running in demo mode - history may not persist', 'warning');
                }
            } catch (err) {
                console.error("Auth failed:", err);
                showToast("Authentication failed. Running in offline mode - history will not be saved.", 'warning');
                // Set a mock user so the app can still function
                setUser({ uid: 'offline-user', isAnonymous: true, offline: true });
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser && !authUser.offline) {
                setUser(authUser);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Models/Styles
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelsRes, stylesRes] = await Promise.all([
                    apiCall(`${CONFIG.BASE_API_URL}/models?type=image`, null, CONFIG),
                    apiCall(`${CONFIG.BASE_API_URL}/image/styles`, null, CONFIG)
                ]);

                if (modelsRes.data && modelsRes.data.length > 0) {
                    setModelsList(modelsRes.data);
                    setSelectedModel(modelsRes.data[0].id);
                    showToast(`Loaded ${modelsRes.data.length} models`, 'success');
                } else {
                    throw new Error("No models returned from API");
                }

                if (stylesRes.data) {
                    setStylesList(stylesRes.data);
                }
            } catch (e) {
                console.error("Failed to fetch models/styles", e);
                showToast("Could not load models from API. Using fallback model.", 'warning');
                // Fallbacks if API fails essentially (allows UI to render)
                setModelsList([{ id: "fluently-xl", name: "Fluently XL" }]);
                setSelectedModel("fluently-xl");
            }
        };
        fetchData();
    }, []);

    // 3. Firestore Listener
    useEffect(() => {
        if (!user) return;
        if (user.offline || !navigator.onLine) {
            showToast("Running in offline mode - history is local only", 'info');
            return;
        }

        const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;

        // Safety check for DB access
        try {
            const q = query(collection(db, ...collectionPath.split('/')));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                items.sort((a, b) => (b.params?.timestamp || 0) - (a.params?.timestamp || 0));
                setHistory(items);
            }, (err) => {
                console.warn("Firestore access denied or error:", err);
                showToast("Could not sync history from cloud. Using local storage only.", 'warning');
            });

            return () => unsubscribe();
        } catch (e) {
            console.warn("Firestore query error:", e);
            showToast("Firestore unavailable. History will be stored locally.", 'warning');
        }
    }, [user]);

    // --- LOGIC ---

    // --- VENICE CHAT API CALL ---
    /**
     * Calls the Venice Chat API.
     * @param {string} userMessage - The user's message.
     * @param {string} [systemPrompt=VENICE_SYSTEM_PROMPT] - The system prompt.
     * @param {string} [modelId=DEFAULT_CHAT_MODEL] - The model ID to use.
     * @param {string|null} [imageBase64=null] - Base64 string of an image to send (if vision capable).
     * @returns {Promise<string>} The response content.
     */
    const callVeniceChat = async (userMessage, systemPrompt = VENICE_SYSTEM_PROMPT, modelId = DEFAULT_CHAT_MODEL, imageBase64 = null) => {
        setPromptLoading(true);
        try {
            // Build messages array
            const messages = [
                { role: "system", content: systemPrompt }
            ];

            // Add user message with optional image
            if (imageBase64) {
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: userMessage },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                });
            } else {
                messages.push({ role: "user", content: userMessage });
            }

            // Call Venice Chat API using OpenAI-compatible format
            const response = await apiCall(`${CONFIG.BASE_API_URL}/chat/completions`, {
                model: modelId,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            }, CONFIG);

            const content = response.choices?.[0]?.message?.content;
            if (!content) throw new Error("No response from Venice Chat API");

            return content.trim();
        } catch (err) {
            console.error("Venice Chat API error:", err);
            throw err;
        } finally {
            setPromptLoading(false);
        }
    };

    /**
     * Handles generating a prompt suggestion based on a user idea.
     */
    const handleSuggest = async () => {
        const idea = window.prompt("Enter a simple idea (e.g., 'a cyberpunk city'):");
        if (!idea) return;
        try {
            const result = await callVeniceChat(`Create a detailed image generation prompt based on this idea: "${idea}"`);
            setPrompt(result);
            showToast('Prompt suggestion generated!', 'success');
        } catch (e) {
            showToast("Failed to suggest prompt: " + e.message, 'error');
        }
    };

    /**
     * Handles enhancing the current prompt.
     */
    const handleEnhancePrompt = async () => {
        if (!prompt) return alert("Please enter a prompt first.");
        try {
            const result = await callVeniceChat(`Enhance and improve this image generation prompt: "${prompt}"`);
            setPrompt(result);
            showToast('Prompt enhanced!', 'success');
        } catch (e) {
            showToast("Failed to enhance prompt: " + e.message, 'error');
        }
    };

    // Image Description Handlers
    /**
     * Handles image upload for description.
     * @param {Event} e - The file input change event.
     */
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            setUploadedImage(base64);
            setImageDescription('');
        };
        reader.readAsDataURL(file);
    };

    /**
     * Generates a description for the uploaded image.
     */
    const handleDescribeImage = async () => {
        if (!uploadedImage) return;

        setDescribingImage(true);
        try {
            // Use a vision-capable model
            const visionModel = VENICE_CHAT_MODELS.find(m => m.vision)?.id || DEFAULT_CHAT_MODEL;
            const description = await callVeniceChat(
                "Describe this image in detail, focusing on elements that would be useful for creating a similar image with AI. Include details about subjects, composition, lighting, color palette, mood, and artistic style.",
                VENICE_SYSTEM_PROMPT,
                visionModel,
                uploadedImage
            );

            setImageDescription(description);
            showToast('Image described successfully!', 'success');
        } catch (e) {
            showToast("Failed to describe image: " + e.message, 'error');
        } finally {
            setDescribingImage(false);
        }
    };

    /**
     * Uses the generated image description as the main prompt.
     */
    const handleUseDescription = () => {
        if (imageDescription) {
            setPrompt(imageDescription);
            setDescribeModalOpen(false);
            setUploadedImage(null);
            setImageDescription('');
            showToast('Description inserted into prompt!', 'success');
        }
    };

    /**
     * Handles the image generation process.
     * @param {Event} e - Form submission event.
     */
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!user) return alert("You must be signed in.");
        if (!prompt.trim()) return alert("Prompt cannot be empty");

        setGenerating(true);
        setError(null);
        setStatusMessage("Initializing generation...");

        const baseSeed = seed ? parseInt(seed) : Math.floor(Math.random() * 1000000000);
        const variantsNum = parseInt(variants);

        // Calculate dimensions
        let width = 1024, height = 1024;
        if (aspectRatio === 'tall') { width = 768; height = 1024; }
        if (aspectRatio === 'wide') { width = 1024; height = 768; }

        try {
            const promises = [];
            for (let i = 0; i < variantsNum; i++) {
                const currentSeed = baseSeed + i;
                const requestData = {
                    model: selectedModel,
                    prompt,
                    negative_prompt: negativePrompt,
                    width, height,
                    steps: parseInt(steps),
                    hide_watermark: hideWatermark,
                    safe_mode: safeMode,
                    seed: currentSeed,
                    format: "png", // API returns base64 inside JSON
                    embed_exif_metadata: false,
                    ...(selectedStyle !== 'none' && { style_preset: selectedStyle })
                };

                const p = apiCall(`${CONFIG.BASE_API_URL}/image/generate`, requestData, CONFIG)
                    .then(async (result) => {
                        setStatusMessage(`Compressing image ${i + 1}...`);

                        if (!result.images || !result.images[0]) {
                            throw new Error("No image data received from API");
                        }

                        const compressed = await compressImage(result.images[0]);

                        const itemToSave = {
                            base64: compressed,
                            params: { ...requestData, seed: currentSeed, timestamp: Date.now() }
                        };

                        const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;

                        try {
                            await addDoc(collection(db, ...collectionPath.split('/')), itemToSave);
                        } catch (dbErr) {
                            console.warn("Failed to save to firestore", dbErr);
                            // We still want to show it in ephemeral state if we could
                            // Add a temporary ID for React key
                            setHistory(prev => [{ ...itemToSave, id: `offline-${Date.now()}-${currentSeed}` }, ...prev]);
                        }
                    });
                promises.push(p);
            }
            const results = await Promise.allSettled(promises);

            const failed = results.filter(r => r.status === 'rejected');
            const successful = results.filter(r => r.status === 'fulfilled');

            if (successful.length === 0 && failed.length > 0) {
                throw failed[0].reason;
            }

            if (failed.length > 0) {
                console.warn("Some generations failed:", failed);
                setStatusMessage(`Generation complete! (${successful.length}/${variantsNum} successful)`);
            } else {
                setStatusMessage("Generation complete!");
            }
        } catch (err) {
            console.error("Generation error:", err);
            let msg = err.message || "Generation failed.";

            // Handle 402 Payment Required specifically for premium models
            if (msg.includes("402") || msg.toLowerCase().includes("payment")) {
                msg = `The model "${selectedModel}" requires a premium subscription (Error 402). Please select a different model (e.g., Fluently XL).`;
            }

            // Mock fallback if API keys fail completely (for demo purposes if keys are dead)
            if (msg.includes("API keys failed")) {
                setError("API Keys Invalid or Quota Exceeded. Switching to Demo Mode (Mock).");
                await new Promise(r => setTimeout(r, 2000));
                // Create a fake image
                const mockItem = {
                    id: 'mock-' + Date.now(),
                    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 red pixel
                    params: { prompt: prompt, seed: baseSeed, model: selectedModel, timestamp: Date.now() }
                };
                setHistory(prev => [mockItem, ...prev]);
                setGenerating(false);
                return;
            }

            setError(msg);
        } finally {
            setGenerating(false);
        }
    };

    /**
     * Opens the enhancement modal for a selected image.
     * @param {object} item - The history item to enhance.
     */
    const openEnhanceModal = (item) => {
        setEnhanceTarget(item);
        setEnhancePrompt(''); // Optional: prefill with original prompt
        setEnhanceCreativity(0.5);
        setEnhanceModalOpen(true);
    };

    /**
     * Submits the image enhancement request.
     * @param {Event} e - Form submission event.
     */
    const handleEnhanceSubmit = async (e) => {
        e.preventDefault();
        if (!enhanceTarget) return;

        setGenerating(true); // Re-use main loader
        setEnhanceModalOpen(false); // Close modal
        setStatusMessage("Enhancing image...");

        try {
            const requestData = {
                image: enhanceTarget.base64,
                scale: 1, // Usually implies upscale, but maybe just enhancement here
                enhance: true,
                enhanceCreativity: parseFloat(enhanceCreativity),
                enhancePrompt: enhancePrompt
            };

            const response = await apiCall(`${CONFIG.BASE_API_URL}/image/upscale`, requestData, CONFIG, 0, true);
            const blob = new Blob([response], { type: 'image/png' });

            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const newBase64 = reader.result.split(',')[1];
                    const compressed = await compressImage(newBase64);

                    // Bug #4 Fix: Validate Firestore document ID before attempting update
                    if (!enhanceTarget.id || enhanceTarget.id.startsWith('mock-') || enhanceTarget.id.startsWith('offline-')) {
                        showToast('Cannot enhance offline images. Please generate online first.', 'error');
                        setGenerating(false);
                        return;
                    }

                    const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;
                    const docRef = doc(db, ...collectionPath.split('/'), enhanceTarget.id);

                    await updateDoc(docRef, {
                        base64: compressed,
                        'params.enhanced': true,
                        'params.enhancementPrompt': enhancePrompt
                    });
                    setGenerating(false);
                    setStatusMessage("Enhancement saved!");
                } catch (innerErr) {
                    setGenerating(false);
                    setError("Enhancement failed: " + innerErr.message);
                }
            };
            reader.readAsDataURL(blob);

        } catch (err) {
            setGenerating(false);
            setError("Enhancement failed: " + err.message);
        }
    };

    /**
     * Clears all generated image history.
     */
    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to delete all history?")) return;
        try {
            const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;
            const colRef = collection(db, ...collectionPath.split('/'));
            const snapshot = await getDocs(colRef);

            // Chunk deletions into batches of 500
            const CHUNK_SIZE = 500;
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch {
            // alert("Failed to clear history.");
            setHistory([]); // Local clear at least
        }
    };

    // Chat state
    const [chatHistory, setChatHistory] = useState([]);
    const [systemPrompt, setSystemPrompt] = useState('');

    /**
     * Downloads the generated image.
     * @param {string} base64 - Base64 string of the image.
     * @param {string} seed - Seed used for generation (for filename).
     */
    const downloadImage = (base64, seed) => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${base64}`;
        link.download = `venice_art_${seed}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-surface-dim text-on-surface font-sans selection:bg-primary selection:text-on-primary">
            {/* Header */}
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-10">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-secondary/30 to-tertiary/40 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                        <img
                            src="https://preview.redd.it/73z6v668xffc1.jpeg?width=1055&format=pjpg&auto=webp&s=b15ae1f6d53d93bf004d8bbff24d5135026bbd2d"
                            alt="Logo"
                            className="relative mx-auto h-24 w-24 rounded-full mb-4 object-cover border-2 border-primary/30 shadow-elevation-4 group-hover:border-primary/60 group-hover:scale-105 transition-all duration-300 ease-spring"
                        />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gradient-primary">
                        Venice.ai Generator
                    </h1>
                    <p className="text-on-surface-variant mt-3 text-sm max-w-lg mx-auto">
                        Uncensored, high-fidelity image generation with persistent history.
                    </p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT COLUMN: CONTROLS */}
                    <div className="lg:w-1/3 space-y-6">
                        <div className="m3-surface-elevated p-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-on-surface">
                                <RefreshCw className="w-5 h-5 text-secondary" /> Controls
                            </h2>

                            <form onSubmit={handleGenerate} className="space-y-5">
                                {/* Prompt Area */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="prompt-input" className="text-sm font-medium text-on-surface">Prompt</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={handleSuggest} disabled={promptLoading} className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1" aria-label="Generate prompt from idea">
                                                {promptLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Idea
                                            </button>
                                            <button type="button" onClick={handleEnhancePrompt} disabled={promptLoading} className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1 !bg-primary-container !text-on-primary-container hover:!bg-primary hover:!text-on-primary" aria-label="Enhance current prompt with AI">
                                                {promptLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Enhance
                                            </button>
                                            <button type="button" onClick={() => setDescribeModalOpen(true)} className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1 !bg-tertiary-container !text-on-tertiary-container hover:!bg-tertiary hover:!text-on-tertiary" aria-label="Describe an uploaded image to generate prompt">
                                                <ImageIcon className="w-3 h-3" /> Describe
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        id="prompt-input"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="m3-textfield w-full rounded-lg resize-none h-28"
                                        placeholder="A futuristic cityscape at dusk..."
                                    />
                                </div>

                                {/* Negative Prompt */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">Negative Prompt</label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        className="m3-textfield w-full rounded-lg resize-none h-20 text-xs text-on-surface-variant"
                                    />
                                </div>

                                {/* Model & Style */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Model</label>
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="m3-select w-full"
                                        >
                                            {modelsList.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Style</label>
                                        <select
                                            value={selectedStyle}
                                            onChange={(e) => setSelectedStyle(e.target.value)}
                                            className="m3-select w-full"
                                        >
                                            <option value="none">None</option>
                                            {stylesList.map(s => <option key={s.id || s} value={s.id || s}>{s.name || s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Sliders & Toggles */}
                                <div className="space-y-4 pt-4 border-t border-outline-variant">
                                    <div>
                                        <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                                            <span>Steps</span> <span className="text-primary font-medium">{steps}</span>
                                        </div>
                                        <input type="range" min="10" max="30" value={steps} onChange={(e) => setSteps(e.target.value)} className="m3-slider w-full" aria-label="Steps" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                                            <span>Variants</span> <span className="text-primary font-medium">{variants}</span>
                                        </div>
                                        <input type="range" min="1" max="4" value={variants} onChange={(e) => setVariants(e.target.value)} className="m3-slider w-full" aria-label="Variants" />
                                    </div>
                                </div>

                                {/* Aspect Ratio */}
                                <div>
                                    <label className="block text-xs font-medium text-on-surface-variant mb-2">Aspect Ratio</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['tall', 'wide', 'square'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setAspectRatio(r)}
                                                className={`m3-chip py-2 text-center transition-all duration-200 ${aspectRatio === r ? 'm3-chip-selected !bg-primary !text-on-primary' : 'hover:bg-surface-container-highest'}`}
                                            >
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced */}
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group">
                                        <input type="checkbox" checked={hideWatermark} onChange={(e) => setHideWatermark(e.target.checked)} className="m3-checkbox mr-2" />
                                        <span className="group-hover:text-on-surface transition-colors">Hide Watermark</span>
                                    </label>
                                    <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group">
                                        <input type="checkbox" checked={safeMode} onChange={(e) => setSafeMode(e.target.checked)} className="m3-checkbox mr-2" />
                                        <span className="group-hover:text-on-surface transition-colors">Blur NSFW</span>
                                    </label>
                                </div>

                                <div className="pt-5 flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={generating}
                                        className={`w-full py-3.5 px-4 rounded-full font-bold text-on-primary shadow-elevation-2 transition-all duration-300 flex justify-center items-center gap-2 ${generating ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-gradient-to-r from-primary via-secondary to-tertiary hover:shadow-elevation-4 hover:scale-[1.02] active:scale-[0.98]'}`}
                                    >
                                        {generating ? <><Loader2 className="animate-spin" /> Generating...</> : <><Sparkles /> Generate</>}
                                    </button>
                                    <button type="button" onClick={clearHistory} className="m3-button-outlined text-xs text-error border-error/50 hover:bg-error/10 flex items-center justify-center gap-1 py-2" aria-label="Clear all generated image history">
                                        <Trash2 className="w-3 h-3" /> Clear History
                                    </button>
                                    <button type="button" onClick={() => {
                                        imageCache.cleanup(true);
                                        showToast('Image cache cleared', 'info');
                                    }} className="m3-button-outlined text-xs text-on-surface-variant border-outline-variant/50 hover:bg-surface-container/50 flex items-center justify-center gap-1 py-2" aria-label="Clear image cache to free up memory">
                                        <Trash2 className="w-3 h-3" /> Clear Image Cache
                                    </button>
                                    <button type="button" onClick={() => {
                                        // Show cache statistics
                                        const stats = imageCache.getStats();
                                        showToast(`Cache: ${stats.count} items, ${stats.size}`, 'info');
                                    }} className="m3-button-outlined text-xs text-on-surface-variant border-outline-variant/50 hover:bg-surface-container/50 flex items-center justify-center gap-1 py-2" aria-label="View image cache statistics">
                                        <ImageIcon className="w-3 h-3" /> Cache Stats
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: GALLERY */}
                    <div className="lg:w-2/3">
                        <div className="m3-surface p-6 min-h-[600px]">
                            {error && (
                                <div className="mb-4 bg-error-container border border-error/30 text-on-error-container p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 text-error" /> {error}
                                </div>
                            )}

                            {generating && (
                                <div className="mb-6 flex flex-col items-center justify-center py-16 bg-surface-container-high rounded-2xl border border-dashed border-outline-variant animate-pulse-glow">
                                    <Loader2 className="w-14 h-14 text-primary animate-spin mb-4" />
                                    <p className="text-primary font-medium">{statusMessage}</p>
                                </div>
                            )}

                            {!generating && history.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-96 text-on-surface-variant">
                                    <ImageIcon className="w-20 h-20 mb-4 opacity-40" />
                                    <p className="text-lg">No images generated yet.</p>
                                    <p className="text-sm mt-1 opacity-60">Enter a prompt and click Generate</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {history.map(item => (
                                    <div key={item.id} className="m3-media-card group relative aspect-square">
                                        <img
                                            src={`data:image/jpeg;base64,${item.base64}`}
                                            alt={item.params?.prompt || 'Generated Image'}
                                            className="w-full h-full object-cover transition-transform duration-500 ease-emphasized group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/95 via-surface-dim/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                                            <p className="text-xs text-on-surface line-clamp-2 mb-2 font-medium">{item.params?.prompt}</p>
                                            <div className="text-[10px] text-on-surface-variant flex justify-between mb-3">
                                                <span>{item.params?.model}</span>
                                                <span className="text-primary">S: {item.params?.seed}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => downloadImage(item.base64, item.params?.seed)}
                                                    className="m3-button-tonal flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1"
                                                    aria-label={`Download image with seed ${item.params?.seed}`}
                                                >
                                                    <Download className="w-3 h-3" /> Save
                                                </button>
                                                <button
                                                    onClick={() => openEnhanceModal(item)}
                                                    className="m3-button-tonal flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 !bg-tertiary-container !text-on-tertiary-container hover:!bg-tertiary"
                                                    aria-label={`Enhance image with seed ${item.params?.seed}`}
                                                >
                                                    <Wand2 className="w-3 h-3" /> Enhance
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Chat Panel */}
            <Suspense fallback={<div className="m3-surface flex flex-col h-full"><LoadingComponent message="Loading chat interface..." /></div>}>
                <ChatPanel
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    systemPrompt={systemPrompt}
                    setSystemPrompt={setSystemPrompt}
                    memoryLimit={20}
                    callVeniceChat={callVeniceChat}
                    defaultChatModel={DEFAULT_CHAT_MODEL}
                />
            </Suspense>

            {/* Transactions Section */}
            <div className="container mx-auto p-4 md:p-8 mt-10">
                <div className="m3-surface-elevated p-6 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-6 text-gradient-primary">Crypto Transactions</h2>
                    <Suspense fallback={<LoadingComponent message="Loading transaction interface..." />}>
                        <Transactions />
                    </Suspense>
                </div>
            </div>

            {/* Enhancement Modal */}
            {enhanceModalOpen && (
                <div className="m3-dialog-scrim fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="m3-dialog w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2"><Wand2 className="text-tertiary" /> Enhance Image</h3>
                            <button onClick={() => setEnhanceModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition p-1 rounded-full hover:bg-surface-container-highest" aria-label="Close enhancement modal"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {enhanceTarget && (
                                <div className="flex gap-4 items-center bg-surface-container p-4 rounded-xl border border-outline-variant">
                                    <img src={`data:image/jpeg;base64,${enhanceTarget.base64}`} className="w-16 h-16 rounded-lg object-cover border border-outline-variant" alt="Target" />
                                    <div className="text-xs text-on-surface-variant">
                                        <p className="font-semibold text-on-surface">Selected Image</p>
                                        <p className="mt-1">Seed: <span className="text-primary">{enhanceTarget.params?.seed}</span></p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-2">Enhancement Prompt (Optional)</label>
                                <input
                                    type="text"
                                    value={enhancePrompt}
                                    onChange={(e) => setEnhancePrompt(e.target.value)}
                                    className="m3-textfield w-full rounded-lg"
                                    placeholder="e.g., cinematic lighting, hyperrealistic, 8k"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm text-on-surface mb-2">
                                    <span>Creative Intensity</span> <span className="text-primary font-medium">{enhanceCreativity}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={enhanceCreativity}
                                    onChange={(e) => setEnhanceCreativity(e.target.value)}
                                    className="m3-slider w-full"
                                />
                                <p className="text-[10px] text-on-surface-variant mt-1.5">Higher values allow the AI to deviate more from the original image.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
                            <button onClick={() => setEnhanceModalOpen(false)} className="m3-button-outlined px-4 py-2 text-sm">Cancel</button>
                            <button onClick={handleEnhanceSubmit} className="m3-button-filled px-4 py-2 text-sm !bg-tertiary !text-on-tertiary">Apply Enhancement</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Description Modal */}
            {describeModalOpen && (
                <div className="m3-dialog-scrim fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="m3-dialog w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <ImageIcon className="text-tertiary" /> Describe Image
                            </h3>
                            <button onClick={() => {
                                setDescribeModalOpen(false);
                                setUploadedImage(null);
                                setImageDescription('');
                            }} className="text-on-surface-variant hover:text-on-surface transition p-1 rounded-full hover:bg-surface-container-highest" aria-label="Close image description modal">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Upload Area */}
                            {!uploadedImage ? (
                                <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 text-center hover:border-primary transition-colors cursor-pointer group">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <ImageIcon className="w-14 h-14 mx-auto mb-3 text-on-surface-variant opacity-50 group-hover:text-primary group-hover:opacity-80 transition" />
                                        <p className="text-sm text-on-surface-variant mb-1">Click to upload an image</p>
                                        <p className="text-xs text-on-surface-variant opacity-60">PNG, JPG, WEBP up to 10MB</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <img
                                            src={`data:image/jpeg;base64,${uploadedImage}`}
                                            alt="Uploaded"
                                            className="w-full h-48 object-contain rounded-xl bg-surface-container border border-outline-variant"
                                        />
                                        <button
                                            onClick={() => {
                                                setUploadedImage(null);
                                                setImageDescription('');
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-error hover:bg-error/80 text-on-error rounded-full transition shadow-elevation-2"
                                            aria-label="Remove uploaded image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {!imageDescription && (
                                        <button
                                            onClick={handleDescribeImage}
                                            disabled={describingImage}
                                            className={`m3-button-filled w-full py-3 font-medium flex items-center justify-center gap-2 ${describingImage
                                                ? '!bg-surface-container-high !text-on-surface-variant cursor-not-allowed'
                                                : '!bg-tertiary !text-on-tertiary'
                                                }`}
                                        >
                                            {describingImage ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image...</>
                                            ) : (
                                                <><Wand2 className="w-4 h-4" /> Describe Image</>
                                            )}
                                        </button>
                                    )}

                                    {imageDescription && (
                                        <div className="space-y-3">
                                            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
                                                <p className="text-sm text-on-surface leading-relaxed">{imageDescription}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleDescribeImage}
                                                    disabled={describingImage}
                                                    className="m3-button-outlined flex-1 py-2.5 text-sm"
                                                >
                                                    Re-analyze
                                                </button>
                                                <button
                                                    onClick={handleUseDescription}
                                                    className="m3-button-filled flex-1 py-2.5 text-sm !bg-primary !text-on-primary"
                                                >
                                                    Use as Prompt
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-2xl shadow-elevation-4 border backdrop-blur-sm animate-slide-up max-w-md ${toast.type === 'success' ? 'bg-success-container/95 border-success/30 text-on-success-container' :
                    toast.type === 'warning' ? 'bg-warning-container/95 border-warning/30 text-on-warning-container' :
                        toast.type === 'error' ? 'bg-error-container/95 border-error/30 text-on-error-container' :
                            'bg-info-container/95 border-info/30 text-on-info-container'
                    }`}>
                    <div className="flex items-start gap-3">
                        {toast.type === 'success' && <div className="text-success text-lg">✓</div>}
                        {toast.type === 'warning' && <div className="text-warning text-lg">⚠</div>}
                        {toast.type === 'error' && <div className="text-error text-lg">✕</div>}
                        {toast.type === 'info' && <div className="text-info text-lg">ℹ</div>}
                        <div className="flex-1">
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => setToast({ show: false, message: '', type: 'info' })}
                            className="text-on-surface-variant hover:text-on-surface transition p-0.5 rounded-full hover:bg-surface/20"
                            aria-label="Close notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
