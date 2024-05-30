import {
  electronicJournalInfo,
  electronicJournalContainer,
} from "../documentRefs.js";

export const IS_CLOSED = "is-closed";

export const showInfo = (info) => {
  const {
    dateTimeOfFormatting,
    fiscalPrinterSerialNumber,
    electronicJournalIdentification,
    electronicJournalNumber,
    size,
    charactersPerLine,
  } = info;
  console.log(info);
  electronicJournalInfo.serialNumber.textContent = fiscalPrinterSerialNumber;
  electronicJournalInfo.electronicJournalNumber.textContent =
    electronicJournalNumber + 1;
  electronicJournalInfo.dateCreated.textContent =
    dateTimeOfFormatting.toString();
  electronicJournalInfo.size.textContent = size;
  electronicJournalInfo.charactersPerLine.textContent = charactersPerLine;
  electronicJournalInfo.identification.textContent =
    electronicJournalIdentification;
  electronicJournalContainer.classList.remove(IS_CLOSED);
};

export const hideInfo = () => {
  electronicJournalContainer.classList.add(IS_CLOSED);
};
