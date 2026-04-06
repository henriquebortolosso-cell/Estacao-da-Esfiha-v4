"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  printSilent: (options) =>
    ipcRenderer.invoke("print-silent", options),

  printPDF: (options) =>
    ipcRenderer.invoke("print-pdf", options),

  getPrinters: () =>
    ipcRenderer.invoke("get-printers"),

  reload: () =>
    ipcRenderer.invoke("reload"),
});
