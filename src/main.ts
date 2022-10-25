// Second, setup sentry to capture errors for support and maintenance
import * as Sentry from "@sentry/electron/main";
Sentry.init({
  dsn: "https://d7e0056c96674f52ab2c8d8fc2023355@o4504042369318912.ingest.sentry.io/4504042372399104",
  // not really trying to send any traffic, just want valid sentry config.
  tracesSampleRate: 0.00000000001,
});

import { app, BrowserWindow } from "electron";

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // nodeIntegration must be enabled for Bytenode to work
      nodeIntegration: true,
      contextIsolation: false,
      // Electron Forge entry point ⤵
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  })

  // Electron Forge entry point ⤵
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});