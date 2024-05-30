import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { getSDInfo } from "./service/getSDInfo.js";
import { createHtml } from "./service/createHtml.js";
import { readXml } from "./utils/readXml.js";
import { exec } from "child_process";
import fs from "node:fs";
import path from "node:path";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("src/index.html");

  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file selection
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
  });
  const filePath = result.filePaths[0];

  if (filePath) {
    const sdInfo = await getSDInfo(filePath);
    return { filePath, sdInfo };
  }
  return null;
});

// Handle folder selection
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

// Handle file parsing and saving
ipcMain.handle("parse-and-save-file", async (event, file, folderPath) => {
  console.log();
  const { size, fiscalPrinterSerialNumber } = file.sdInfo;
  const sdPath = file.filePath;
  const newFolderPath = path.join(folderPath, fiscalPrinterSerialNumber);

  if (!fs.existsSync(newFolderPath)) fs.mkdirSync(newFolderPath);
  try {
    const xml = await readXml(sdPath, size);
    const params = {
      len: size,
      sdCardPath: sdPath,
      outputFolderPath: newFolderPath,
      receiptsXml: xml,
    };
    await createHtml(params);
    return newFolderPath;
  } catch (e) {
    console.log(e);
    return null;
  }
});

ipcMain.on("open-folder", (event, folderPath) => {
  const command =
    process.platform === "win32"
      ? "explorer"
      : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  exec(`${command} "${folderPath}"`);
});
