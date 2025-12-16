const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        // Securely expose specific IPC channels
        send: (channel, data) => {
            // Whitelist channels
            const validChannels = ['app-event'];
            if (validChannels.includes(channel)) {
                try {
                    ipcRenderer.send(channel, data);
                } catch (error) {
                    console.error(`Error sending IPC message to channel '${channel}':`, error);
                }
            }
        },
        receive: (channel, func) => {
            const validChannels = ['app-update'];
            if (validChannels.includes(channel)) {
                try {
                    // Strip event as it includes sender
                    ipcRenderer.on(channel, (event, ...args) => func(...args));
                } catch (error) {
                    console.error(`Error receiving IPC message from channel '${channel}':`, error);
                }
            }
        }
    }
);