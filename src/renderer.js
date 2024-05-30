// src/renderer.js

const { ipcRenderer } = require("electron");

import { showInfo, IS_CLOSED } from "./renderer/renderInfo.js";
import {
  selectFilePath,
  selectFolderPath,
  warningAlert,
  openFolder,
  errorAlert,
  successAlert,
} from "./documentRefs.js";
import { setIsComplete, setIsLoading } from "./renderer/loadButton.js";

let selectedFile = null;

const handleSelectFile = async () => {
  const file = await ipcRenderer.invoke("select-file");
  selectedFile = file;

  warningAlert.classList.add(IS_CLOSED);
  errorAlert.classList.add(IS_CLOSED);
  successAlert.classList.add(IS_CLOSED);

  if (selectedFile) {
    showInfo(selectedFile.sdInfo);
  }
};

const handleSelectFolder = async () => {
  errorAlert.classList.add(IS_CLOSED);
  successAlert.classList.add(IS_CLOSED);

  if (!selectedFile) {
    warningAlert.classList.remove(IS_CLOSED);
    return;
  }

  const folderPath = await ipcRenderer.invoke("select-folder");
  console.log(folderPath);
  if (!folderPath) {
    return;
  }
  setIsLoading();
  const savedFilePath = await ipcRenderer.invoke(
    "parse-and-save-file",
    selectedFile,
    folderPath
  );

  if (!savedFilePath) {
    errorAlert.classList.remove(IS_CLOSED);
    return;
  }
  openFolder.textContent = savedFilePath;
  setIsComplete();
  successAlert.classList.remove(IS_CLOSED);
};

const handleOpenFolder = (e) => {
  e.preventDefault();
  const pathFolder = openFolder.textContent;
  ipcRenderer.send("open-folder", pathFolder);
};

selectFilePath.addEventListener("click", handleSelectFile);

selectFolderPath.addEventListener("click", handleSelectFolder);

openFolder.addEventListener("click", handleOpenFolder);
