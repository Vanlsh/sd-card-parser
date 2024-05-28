import fs from "node:fs";
import iconv from "iconv-lite";
import { promises as fsPromises } from "node:fs";
import {
  PATH_FILE,
  PATH_TEXT_EJ,
  PATH_TEXT_JSON,
  PATH_TEXT_PDF,
} from "../path.js";
import {
  DELIMITER,
  BUFFER_ENCODING,
  HIGH_WATER_MARK,
} from "../constants/index.js";
import PDFDocument from "pdfkit";

export const getSize = async () => {
  try {
    const { size } = await fsPromises.stat(PATH_FILE);
    return size;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const len = await getSize();
const parseData = ({ len, sdCardPath, outputFilePath }) => {
  const startAddress = 0x10000;
  const endAddress = Math.floor((len - 0x100000) / 2) - 1 - 0x10000;

  const readStream = fs.createReadStream(sdCardPath, {
    start: startAddress,
    end: endAddress,
    highWaterMark: HIGH_WATER_MARK,
  });

  const writeStream = fs.createWriteStream(outputFilePath, {
    encoding: "utf8",
  });
  writeStream.write("[\n");
  let remaining = Buffer.alloc(0);
  let isOpen = false;

  readStream.on("data", (chunk) => {
    remaining = Buffer.concat([remaining, chunk]);

    while (remaining.length > 0) {
      let receipt = null;
      let receiptStart = 0;

      if (!isOpen) {
        receiptStart = remaining.findIndex(findStartMark);
        if (receiptStart !== -1) remaining = remaining.slice(receiptStart + 5);
      }
      if (receiptStart < 0) {
        remaining = Buffer.alloc(0);
        return;
      }

      isOpen = true;

      const receiptEnd = remaining.findIndex(findEndMark);

      if (receiptEnd < 0) {
        return;
      }

      isOpen = false;

      receipt = splitBuffer(remaining.slice(0, receiptEnd));
      remaining = remaining.slice(receiptEnd, remaining.length);

      const info = getReceipt(receipt);

      const jsonData = JSON.stringify(info, null, 2);
      if (info.info.dateTime.month === 3) {
        writeStream.write(jsonData);
        writeStream.write(",");
      }
    }
  });

  readStream.on("end", () => {
    writeStream.write("\n]");
    console.log(`Parsed data written to ${outputFilePath}`);
  });

  readStream.on("error", (err) => {
    console.error("Error reading the file:", err);
  });
};

parseData({ len, sdCardPath: PATH_FILE, outputFilePath: PATH_TEXT_JSON });

const findStartMark = (hex, index, buff) => {
  if (hex === 0x01 && index + 5 < buff.length) {
    return (
      buff[index + 1] === 0x02 &&
      buff[index + 2] === 0x03 &&
      buff[index + 3] === 0x04 &&
      buff[index + 4] === DELIMITER &&
      buff[index + 5] === 0x80
    );
  }
  return false;
};

const findEndMark = (hex, index, buff) => {
  if (hex === 0x01 && index + 3 < buff.length) {
    return (
      buff[index + 1] === 0x02 &&
      buff[index + 2] === 0x03 &&
      buff[index + 3] === 0x04
    );
  }
  return false;
};

function splitBuffer(buffer, delimiter = DELIMITER) {
  let parts = [];
  let start = 0;
  let end = 0;

  while ((end = buffer.indexOf(delimiter, start)) !== -1) {
    parts.push(buffer.slice(start, end));
    start = end + 1;
  }

  // Push the remaining part after the last delimiter (if any)
  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }

  return parts;
}

const getReceipt = (receipts) => {
  const decodedReceipt = receipts.map((receipt) =>
    decodeNonPrintableCharacters(receipt)
  );

  const info = parseReceiptInfo(decodedReceipt[0]);
  const data = [];

  for (let i = 1; i < decodedReceipt.length; i++) {
    if (decodedReceipt[i].length < 5) continue;

    const lineText = parseTextLine(decodedReceipt[i]);
    data.push(lineText);
    if (
      ["СЛУЖБОВИЙ ЧЕК", "ФIСКАЛЬНИЙ ЧЕК", "ВИДАТКОВИЙ ЧЕК"].includes(
        lineText.text
      )
    )
      break;
  }

  return { info, data };
};

const decodeNonPrintableCharacters = (buffer) => {
  let decoded = [];
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x10 && i + 1 < buffer.length) {
      decoded.push(buffer[++i] - 0x20);
    } else if (buffer[i] === 0x14 && i + 1 < buffer.length) {
      const repeatChar = decoded[decoded.length - 1];
      const repeatCount = buffer[++i];
      for (let j = 0; j < repeatCount; j++) {
        decoded.push(repeatChar);
      }
    } else {
      decoded.push(buffer[i]);
    }
  }
  return Buffer.from(decoded);
};

const parseTextLine = (buffer) => {
  const flags = buffer.readUInt32LE(0);
  const text = iconv.decode(buffer.slice(4, buffer.length), BUFFER_ENCODING);
  return { flags, text };
};

const parseReceiptInfo = (buffer, offset = 0) => {
  return {
    receiptStatus: buffer.readUInt32LE(offset),
    beginAddress: buffer.readUInt32LE(offset + 4),
    endAddress: buffer.readUInt32LE(offset + 8),
    lastReceiptLine: buffer.readUInt32LE(offset + 12),
    nReceipt: buffer.readUInt32LE(offset + 16),
    nRefundReceipt: buffer.readUInt32LE(offset + 20),
    nGlobalReceipt: buffer.readUInt32LE(offset + 24),
    dateTime: {
      sec: buffer.readUInt8(offset + 28),
      min: buffer.readUInt8(offset + 29),
      hour: buffer.readUInt8(offset + 30),
      day: buffer.readUInt8(offset + 31),
      month: buffer.readUInt8(offset + 32),
      year: buffer.readUInt8(offset + 33),
      dayOfWeek: buffer.readUInt8(offset + 34),
      daylightSavingFlag: buffer.readUInt8(offset + 35),
      dayOfYear: buffer.readUInt16LE(offset + 36),
    },
    receiptType: buffer.readUInt8(offset + 38),
    padding1: buffer.readUInt8(offset + 39),
    closureNumber: buffer.readUInt16LE(offset + 40),
    padding2: buffer.readUInt16LE(offset + 42),
  };
};
//  ---------------------------