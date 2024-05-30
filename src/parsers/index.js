import iconv from "iconv-lite";
import { BUFFER_ENCODING } from "../constants/index.js";

export function parseFirstPartData(data) {
  const formattedData = {
    dateTimeOfFormatting: parseDOSDateTime(data.slice(0, 4)),
    fiscalPrinterSerialNumber: iconv
      .decode(data.slice(0x0004, 0x001f), BUFFER_ENCODING)
      .replace(/\0/g, ""),
    stateOfSDCardAfterErasing: data.readUInt8(0x001f),
    electronicJournalIdentification: iconv
      .decode(data.slice(0x0020, 0x002f), BUFFER_ENCODING)
      .replace(/\0/g, ""),
    charactersPerLine: data.readUInt16LE(0x0030),
    electronicJournalNumber: data.readUInt16LE(0x0032),
  };
  return formattedData;
}

function parseDOSDate(dateBuffer) {
  const date = dateBuffer.readUInt16LE(0);
  const day = date & 0x1f;
  const month = (date >> 5) & 0x0f;
  const year = ((date >> 9) & 0x7f) + 2000;

  return { year, month, day };
}

function parseDOSTime(timeBuffer) {
  const time = timeBuffer.readUInt16LE(0);
  const seconds = (time & 0x1f) * 2;
  const minutes = (time >> 5) & 0x3f;
  const hours = (time >> 11) & 0x1f;

  return { hours, minutes, seconds };
}

function parseDOSDateTime(dataTimeBuffer) {
  const dateBuffer = dataTimeBuffer.slice(2);
  const timeBuffer = dataTimeBuffer.slice(0, 2);
  const { year, month, day } = parseDOSDate(dateBuffer);
  const { hours, minutes, seconds } = parseDOSTime(timeBuffer);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
