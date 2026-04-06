"use strict";

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "Estação da Esfiha — Painel Admin",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../client/public/logo.webp"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const startUrl = isDev
    ? `${SERVER_URL}/painel/login`
    : `${SERVER_URL}/painel/login`;

  mainWindow.loadURL(startUrl).catch(() => {
    mainWindow.loadURL(`${SERVER_URL}/painel/login`);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("print-silent", async (event, options = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: "No window found" };

  return new Promise((resolve) => {
    win.webContents.print(
      {
        silent: true,
        printBackground: true,
        color: false,
        margins: { marginType: "printableArea" },
        pageSize: options.pageSize || "A4",
        deviceName: options.printer || "",
      },
      (success, failureReason) => {
        if (success) {
          resolve({ success: true });
        } else {
          console.error("Silent print failed:", failureReason);
          resolve({ success: false, error: failureReason });
        }
      }
    );
  });
});

ipcMain.handle("print-pdf", async (event, options = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false };

  try {
    const data = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: options.pageSize || "A4",
    });

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: options.filename || "pedido.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    require("fs").writeFileSync(filePath, data);
    return { success: true, filePath };
  } catch (err) {
    console.error("PDF export failed:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("get-printers", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return [];
  try {
    return await win.webContents.getPrintersAsync();
  } catch {
    return [];
  }
});

ipcMain.handle("reload", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.reload();
});
