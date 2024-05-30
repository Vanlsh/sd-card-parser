const selectFilePath = document.querySelector("#select-file");
const selectFolderPath = document.querySelector("#select-folder");
const electronicJournalContainer = document.querySelector("#ksef-info");

const electronicJournalInfo = {
  serialNumber: document.querySelector("#serial-number"),
  electronicJournalNumber: document.querySelector("#ksef-num"),
  dateCreated: document.querySelector("#date-created"),
  size: document.querySelector("#size"),
  charactersPerLine: document.querySelector("#max-chars"),
  identification: document.querySelector("#identification"),
};

const openFolder = document.querySelector("#html-folder");
const errorAlert = document.querySelector("#error");
const successAlert = document.querySelector("#success");
const warningAlert = document.querySelector("#file-path");

export {
  selectFilePath,
  selectFolderPath,
  openFolder,
  warningAlert,
  errorAlert,
  successAlert,
  electronicJournalInfo,
  electronicJournalContainer,
};
