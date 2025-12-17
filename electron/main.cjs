const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false, // Security best practice
            sandbox: true,          // Security best practice
        },
        titleBarStyle: 'hiddenInset', // Native macOS look
        trafficLightPosition: { x: 20, y: 16 },
        backgroundColor: '#111827', // Match app background
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Open external links in default browser, not Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Open DevTools in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Check for updates in production mode only
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Optional: Handle update events for better user feedback
autoUpdater.on('update-available', () => {
    console.log('Update available');
});

autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded');
});
