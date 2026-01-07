#!/bin/bash

# ==========================================
# JULES VISUAL ENHANCEMENT PROTOCOL (JVEP)
# Target: VeniceAI Repository
# ==========================================

set -e # Exit on error

echo "🔵 [JULES] Initializing Visual Enhancement Protocol..."
echo "🔵 [JULES] Verifying Environment..."

# 1. System Check & Update
if [ -f "package.json" ]; then
    echo "✅ [JULES] Repository root detected."
else
    echo "❌ [JULES] Error: package.json not found. Please run this script from the repo root."
    exit 1
fi

# 2. Dependency Injection for Visuals
echo "🔵 [JULES] Injecting High-Fidelity UI Dependencies..."

# Install Framer Motion for animations
if ! grep -q "framer-motion" package.json; then
    echo "📦 [JULES] Installing framer-motion..."
    npm install framer-motion
else
    echo "✅ [JULES] framer-motion already installed."
fi

# Install Radix UI primitives for accessible components (Dialog, Tooltip)
if ! grep -q "@radix-ui/react-dialog" package.json; then
    echo "📦 [JULES] Installing Radix UI primitives..."
    npm install @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-dropdown-menu
fi

# Install Lucide React for consistent iconography
if ! grep -q "lucide-react" package.json; then
    echo "📦 [JULES] Installing lucide-react..."
    npm install lucide-react
fi

# Install utility libraries for Tailwind class merging
if ! grep -q "clsx" package.json; then
    echo "📦 [JULES] Installing clsx and tailwind-merge..."
    npm install clsx tailwind-merge
fi

# 3. Tailwind Configuration Check
echo "🔵 [JULES] Verifying Tailwind Configuration..."
if [ -f "tailwind.config.js" ]; then
    # Simple check to see if we might want to add animation extensions
    if ! grep -q "keyframes" tailwind.config.js; then
        echo "⚠️ [JULES] Suggestion: Update tailwind.config.js with custom keyframes for smoother UI."
    fi
fi

# 4. Asset Generation (Placeholder for Visual Assets)
echo "🔵 [JULES] Checking Asset Integrity..."
mkdir -p src/assets/ui

# Check for ImageMagick (convert) and generate placeholders if available
if command -v convert >/dev/null 2>&1; then
    echo "🎨 [JULES] ImageMagick detected. Generating placeholder assets..."

    # Generate a simple placeholder image if it doesn't exist
    if [ ! -f "src/assets/ui/placeholder.png" ]; then
        # Create a 100x100 gradient image
        convert -size 100x100 gradient:blue-purple src/assets/ui/placeholder.png
        echo "✅ [JULES] Created src/assets/ui/placeholder.png"
    else
        echo "✅ [JULES] Placeholder assets already exist."
    fi
else
    echo "⚠️ [JULES] ImageMagick (convert) not found. Skipping asset generation."
    echo "ℹ️  To enable asset generation, please install ImageMagick."
fi

# 5. Linting & Code Style
echo "🔵 [JULES] Enforcing Code Style..."
if grep -q "lint" package.json; then
    npm run lint || echo "⚠️ [JULES] Lint warnings detected. Proceeding with caution."
fi

# 6. Final Status
echo "=========================================="
echo "🟢 [JULES] Bootup Sequence Complete."
echo "🟢 [JULES] Visual Dependencies: INSTALLED"
echo "🟢 [JULES] Environment: READY"
echo "=========================================="
echo "👉 You may now proceed with the visual overhaul of App.jsx and ChatPanel.jsx."