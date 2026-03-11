import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "path";
import { fileURLToPath } from "url";

let mainWindow;

// Convert __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        minWidth: 1100,
        minHeight: 700,
        frame: true,
        titleBarStyle: 'default',
        icon: path.join(__dirname, 'src', 'assets', 'icon00.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            partition: "persist:aplcore",
            preload: path.join(__dirname, 'preload.js'),
            // Allow loading from localhost during development
            allowRunningInsecureContent: false
        }
    });

    // Load the React build (dist/index.html)
    const startURL = path.join(__dirname, "dist", "index.html");
    mainWindow.loadFile(startURL);

    // Optional: Open DevTools for debugging (comment out for production)
    // mainWindow.webContents.openDevTools();

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // Handle external links (open in default browser instead of Electron)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // You can use shell.openExternal(url) here if you import shell from electron
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

// IPC Handlers for secure token storage using OS keychain
ipcMain.handle('store-token', async (event, token) => {
    try {
        if (!safeStorage.isEncryptionAvailable()) {
            // console.error('❌ Encryption not available on this system');
            return { success: false, error: 'Encryption not available' };
        }

        // Encrypt and store token
        const encryptedToken = safeStorage.encryptString(token);
        // Store in a global variable or use electron-store for persistence
        global.encryptedAuthToken = encryptedToken.toString('base64');
        // console.log('✅ Token encrypted and stored securely');
        return { success: true };
    } catch (error) {
        // console.error('❌ Failed to store token:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-token', async () => {
    try {
        if (!global.encryptedAuthToken) {
            // console.log('⚠️ No token found in secure storage');
            return null;
        }

        // Decrypt token
        const buffer = Buffer.from(global.encryptedAuthToken, 'base64');
        const decryptedToken = safeStorage.decryptString(buffer);
        // console.log('✅ Token retrieved and decrypted successfully');
        return decryptedToken;
    } catch (error) {
        // console.error('❌ Failed to retrieve token:', error);
        return null;
    }
});

ipcMain.handle('remove-token', async () => {
    try {
        global.encryptedAuthToken = null;
        // console.log('✅ Token removed from secure storage');
        return { success: true };
    } catch (error) {
        // console.error('❌ Failed to remove token:', error);
        return { success: false, error: error.message };
    }
});

// When Electron is ready
app.whenReady().then(createWindow);

// Quit app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// Recreate window on macOS if no windows are open
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});