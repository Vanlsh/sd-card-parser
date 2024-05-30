import fs from "node:fs";
import fsPromises from "node:fs/promises";

import path from "node:path";
import { parseFirstPartData } from "../parsers/index.js";

export const PATH_FILE = path.join(process.cwd(), "files", "КРЦ_тест.img");

// {
//   dateTimeOfFormatting: 2020-08-17T06:49:00.000Z,
//   fiscalPrinterSerialNumber: 'КС00020959',
//   stateOfSDCardAfterErasing: 0,
//   electronicJournalIdentification: 'DATECSFPA-KLEN',
//   charactersPerLine: 48,
//   electronicJournalNumber: 0,
//   size: 3980394496
// }

export async function getSDInfo(filePath) {
  try {
    const { size } = await fsPromises.stat(filePath);
    const infoBuffer = await readFromFile(filePath);
    const data = parseFirstPartData(infoBuffer);
    return { ...data, size };
  } catch (e) {
    console.log(e);
    return null;
  }
}

function readFromFile(filePath) {
  const startAddress = 0x00;
  const length = 0x59;
  return new Promise((resolve, reject) => {
    fs.open(filePath, "r", (err, fd) => {
      if (err) {
        reject(err);
        return;
      }

      const buffer = Buffer.alloc(length);

      fs.read(fd, buffer, 0, length, startAddress, (err, bytesRead, buffer) => {
        if (err) {
          reject(err);
          return;
        }

        fs.close(fd, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log();
          resolve(buffer);
        });
      });
    });
  });
}
