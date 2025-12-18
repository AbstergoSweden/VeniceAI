import React, { useState, useEffect, lazy, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { Sparkles, Trash2, Download, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, X } from 'lucide-react';
import { apiCall } from './utils/api';

import imageCache from './utils/cache';
import { syncVeniceModels, DEFAULT_CHAT_MODELS } from './utils/modelSync';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from './utils/config';

import { useImageGeneration } from './features/generation/hooks/useImageGeneration';
import { usePromptEnhancement } from './features/generation/hooks/usePromptEnhancement';
import { useUpscale } from './features/generation/hooks/useUpscale';
import { useVeniceChat } from './features/chat/hooks/useVeniceChat';
import DescribeModal from './features/generation/components/DescribeModal';
import EnhanceModal from './features/generation/components/EnhanceModal';
import ControlPanel from './features/generation/components/ControlPanel';
import ImageGallery from './features/generation/components/ImageGallery';


export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return <div role="alert">Something went wrong.</div>;
        }
        return this.props.children;
    }
}

// Lazy load heavy components
const ChatPanel = lazy(() => import('./features/chat/components/ChatPanel'));
const Transactions = lazy(() => import('./features/web3/components/Transactions'));

/**
 * Loading component for lazy-loaded components.
 * @param {object} props - Component props.
 * @param {string} [props.message="Loading..."] - The message to display while loading.
 * @returns {JSX.Element} The loading component JSX.
 */
const LoadingComponent = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant">{message}</p>
    </div>
);


// --- CONFIGURATION ---
// --- CONFIGURATION ---
// Loaded from utils/config.js

// --- VENICE CHAT MODELS ---
// Models are now dynamically fetched from API via modelSync utility
// DEFAULT_CHAT_MODELS imported from ./utils/modelSync as fallback
const DEFAULT_CHAT_MODEL = DEFAULT_CHAT_MODELS[0]?.id || 'mistral-31-24b'; // Venice Medium - vision capable




// --- FIREBASE INITIALIZATION ---
let firebaseConfig, appId;

// Validate and load Firebase configuration
if (typeof __firebase_config === 'undefined') {
    throw new Error("Firebase configuration is required but not provided. Please configure firebase in vite.config.js or build process.");
} else {
    try {
        // Handle both string (production build) and object (Vite dev) formats
        firebaseConfig = typeof __firebase_config === 'string'
            ? JSON.parse(__firebase_config)
            : __firebase_config;
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
 * @returns {JSX.Element} The main application JSX component.
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
    const [chatModels, setChatModels] = useState(DEFAULT_CHAT_MODELS);

    // Toast State & Handler (Moved up to prevent TDZ errors in hooks)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [toastTimeoutId, setToastTimeoutId] = useState(null);

    const showToast = (message, type = 'info') => {
        if (toastTimeoutId) clearTimeout(toastTimeoutId);
        setToast({ show: true, message, type });
        const id = setTimeout(() => {
            setToast({ show: false, message: '', type: 'info' });
            setToastTimeoutId(null);
        }, 4000);
        setToastTimeoutId(id);
    };

    // Chat Hook (for ChatPanel)
    const { callVeniceChat } = useVeniceChat();

    // Prompt Enhancement Hook
    const {
        promptLoading,
        describeModalOpen,
        setDescribeModalOpen,
        uploadedImage,
        setUploadedImage,
        imageDescription,
        setImageDescription,
        describingImage,
        handleSuggest,
        handleEnhancePrompt,
        handleImageUpload,
        handleDescribeImage,
        handleUseDescription
    } = usePromptEnhancement({
        showToast,
        setPrompt,
        prompt,
        chatModels
    });

    // Upscale Hook
    const {
        enhanceModalOpen,
        setEnhanceModalOpen,
        enhanceTarget,
        enhancePrompt,
        setEnhancePrompt,
        enhanceCreativity,
        setEnhanceCreativity,
        upscaling,
        upscaleStatus,
        upscaleError,
        handleOpenEnhance,
        handleEnhance
    } = useUpscale({ user, appId, db, showToast });

    // Hook for Image Generation Logic
    const {
        generating: isGenerating,
        error: generationError,
        statusMessage: generationStatus,
        handleGenerate: generateImage
    } = useImageGeneration({
        user,
        appId,
        db,
        showToast,
        setHistory
    });

    // Derived UI State
    const generating = isGenerating || upscaling;
    const error = generationError || upscaleError;
    const statusMessage = generationStatus || upscaleStatus;



    // Toast Cleanup Effect
    useEffect(() => {
        return () => {
            if (toastTimeoutId) clearTimeout(toastTimeoutId);
        };
    }, [toastTimeoutId]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2b. Sync Chat Models
    useEffect(() => {
        const syncModels = async () => {
            if (CONFIG.API_KEYS.length === 0) {
                console.warn('[ModelSync] No API keys available, using defaults');
                return;
            }

            try {
                const models = await syncVeniceModels(CONFIG.API_KEYS[0], CONFIG.BASE_API_URL);
                setChatModels(models);
                if (import.meta.env.DEV) {
                    console.log(`[ModelSync] Loaded ${models.length} chat models`);
                }
            } catch (error) {
                console.error('[ModelSync] Failed to sync models:', error);
                // Keep using defaults
            }
        };
        syncModels();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // --- LOGIC ---



    /**
     * Handles the image generation process.
     * @param {Event} e - Form submission event.
     * @returns {Promise<void>}
     */
    /**
     * Handles the image generation process.
     * @param {Event} e - Form submission event.
     * @returns {Promise<void>}
     */
    const handleGenerate = (e) => {
        generateImage(e, {
            selectedModel,
            prompt,
            negativePrompt,
            steps,
            variants,
            seed,
            aspectRatio,
            hideWatermark,
            safeMode,
            selectedStyle
        });
    };



    /**
     * Clears all generated image history.
     * @returns {Promise<void>}
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
     * @returns {void}
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
                            alt="Venice.ai Generator application logo featuring cyberpunk aesthetic with neon purple and blue accents"
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
                    <ControlPanel
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        negativePrompt={negativePrompt}
                        onNegativePromptChange={setNegativePrompt}
                        promptLoading={promptLoading}
                        onSuggest={handleSuggest}
                        onEnhance={handleEnhancePrompt}
                        onDescribe={() => setDescribeModalOpen(true)}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        modelsList={modelsList}
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                        stylesList={stylesList}
                        steps={steps}
                        onStepsChange={setSteps}
                        variants={variants}
                        onVariantsChange={setVariants}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        hideWatermark={hideWatermark}
                        onWatermarkChange={setHideWatermark}
                        safeMode={safeMode}
                        onSafeModeChange={setSafeMode}
                        generating={generating}
                        onGenerate={handleGenerate}
                        onClearHistory={clearHistory}
                        onClearCache={() => {
                            imageCache.cleanup(true);
                            showToast('Image cache cleared', 'info');
                        }}
                        onShowCacheStats={() => {
                            const stats = imageCache.getStats();
                            showToast(`Cache: ${stats.count} items, ${stats.size}`, 'info');
                        }}
                    />

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

                            <ImageGallery
                                images={history}
                                isGenerating={generating}
                                onDownload={downloadImage}
                                onEnhance={handleOpenEnhance}
                            />
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
            <EnhanceModal
                isOpen={enhanceModalOpen}
                onClose={() => setEnhanceModalOpen(false)}
                target={enhanceTarget}
                prompt={enhancePrompt}
                onPromptChange={setEnhancePrompt}
                creativity={enhanceCreativity}
                onCreativityChange={setEnhanceCreativity}
                onSubmit={handleEnhance}
            />

            {/* Image Description Modal */}
            <DescribeModal
                isOpen={describeModalOpen}
                onClose={() => {
                    setDescribeModalOpen(false);
                    setUploadedImage(null);
                    setImageDescription('');
                }}
                uploadedImage={uploadedImage}
                imageDescription={imageDescription}
                describingImage={describingImage}
                onImageUpload={handleImageUpload}
                onDescribe={handleDescribeImage}
                onUseDescription={handleUseDescription}
                onRemoveImage={() => {
                    setUploadedImage(null);
                    setImageDescription('');
                }}
            />
            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <Motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`fixed bottom-4 right-4 z-50 p-4 rounded-2xl shadow-elevation-4 border backdrop-blur-sm max-w-md ${toast.type === 'success' ? 'bg-success-container/95 border-success/30 text-on-success-container' :
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
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


