import { app, BrowserWindow } from "electron";
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
        icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add your app icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            partition: "persist:aplcore",
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