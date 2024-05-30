import fs from "node:fs";
import iconv from "iconv-lite";
import { PATH_FILE, PATH_FOLDER, PATH_XML } from "../path.js";
import {
  DELIMITER,
  BUFFER_ENCODING,
  HIGH_WATER_MARK,
} from "../constants/index.js";
import path from "node:path";
import {
  generateFooterHTML,
  generateTableRow,
  generateHeaderHTML,
} from "../utils/htmlMarkup.js";
import { getSize } from "../utils/getFileSize.js";
import { readXml } from "../utils/readXml.js";

const len = await getSize(PATH_FILE);
const receiptsXml = await readXml(PATH_FILE, len);

const createHtml = ({ len, sdCardPath, outputFolderPath, receiptsXml }) => {
  const startAddress = 0x10000;
  const endAddress = Math.floor((len - 0x100000) / 2) - 1 - 0x10000;
  const readStream = fs.createReadStream(sdCardPath, {
    start: startAddress,
    end: endAddress,
    highWaterMark: HIGH_WATER_MARK,
  });

  // const writeStream = fs.createWriteStream(PATH_XML, {
  //   encoding: "utf8",
  // });
  // writeStream.write("[\n");
  const outputStreams = new Map();

  let remaining = Buffer.alloc(0);
  let isOpen = false;
  const types = {};

  readStream.on("data", async (chunk) => {
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
      const outputFilePath = getFileName(info.info.dateTime, outputFolderPath);

      // const jsonData = JSON.stringify(info, null, 2);
      // writeStream.write(jsonData);
      // writeStream.write(",");
      let stream = null;

      let currentXml = "";
      const currentDI = Number(info.info.numberDI);
      const receiptType = Number(info.info.receiptType);
      if (receiptType === 17 || receiptType === 34) {
        currentXml = binarySearch(receiptsXml, currentDI) || "Xml not found";
      }
      // test
      types[info.info.receiptType] = types[info.info.receiptType]
        ? types[info.info.receiptType] + 1
        : 1;

      if (!outputStreams.has(outputFilePath)) {
        outputStreams.set(
          outputFilePath,
          fs.createWriteStream(outputFilePath, { flags: "a" })
        );
        stream = outputStreams.get(outputFilePath);
        stream.write(generateHeaderHTML());
      }

      stream = outputStreams.get(outputFilePath);
      stream.write(generateTableRow({ info: info, xml: currentXml }));
    }
  });

  readStream.on("end", () => {
    // writeStream.write("\n]");
    console.log(types);
    for (const stream of outputStreams.values()) {
      stream.write(generateFooterHTML());
    }
    console.log(`Parsed data written to ${outputFolderPath}`);
  });

  readStream.on("error", (err) => {
    console.error("Error reading the file:", err);
  });
};

createHtml({
  len,
  sdCardPath: PATH_FILE,
  outputFolderPath: PATH_FOLDER,
  receiptsXml,
});

const getFileName = (dateTime, outputFolderPath) => {
  const { month, year } = dateTime;
  const monthYear = `${year + 1900}-${String(month + 1).padStart(2, "0")}`;
  return path.join(outputFolderPath, `${monthYear}.html`);
};

function replaceCharacters(str) {
  return str
    .replace(/</g, "&lt;") // Replace < with &lt;
    .replace(/>/g, "&gt;") // Replace > with &gt;
    .replace(/\//g, "&sol;"); // Replace / with &sol;
}

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
    const details = extractDetails(lineText.text);
    if (details) {
      info.numberDI = details.secondNumber;
      info.closeDateTime = details.date;
    }
    if (
      ["СЛУЖБОВИЙ ЧЕК", "ФIСКАЛЬНИЙ ЧЕК", "ВИДАТКОВИЙ ЧЕК"].includes(
        lineText.text
      )
    ) {
      break;
    }
  }

  return { info, data };
};
function containsSimilarStructure(str) {
  const regex = /ЗН\s+КС\d+\s+ФН\d+/;
  return regex.test(str);
}

function extractDetails(inputString) {
  const regex =
    /^\d+\s+(\d+)\s+(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/;
  const match = inputString.match(regex);

  if (match) {
    return {
      secondNumber: match[1],
      date: {
        day: match[2],
        month: match[3],
        year: match[4],
        hour: match[5],
        minutes: match[6],
        seconds: match[7],
      },
    };
  }
  return null;
}

const decodeNonPrintableCharacters = (buffer) => {
  let decoded = [];
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x10 && i + 1 < buffer.length) {
      decoded.push(buffer[++i] - 0x20);
    } else if (buffer[i] === 0x14 && i + 1 < buffer.length) {
      const repeatChar = decoded[decoded.length - 1];
      const repeatCount = buffer[++i];
      for (let j = 0; j < repeatCount - 1; j++) {
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
    },
    receiptType: buffer.readUInt8(offset + 38),
    closureNumber: buffer.readUInt16LE(offset + 40),
  };
};

function extractIdx(entry) {
  const match = entry.match(/<IDX=\d+,(\d+)>/);
  return match ? parseInt(match[1], 10) : null;
}

// function extractTS(entry) {
//   const match = entry.match(/<TS>(\d{14})<\/TS>/);
//   return match ? match[1] : null;
// }

// Binary search function
function binarySearch(data, targetIdx) {
  let low = 0;
  let high = data.length - 1;

  // const dataString =
  //   date.year + date.month + date.day + date.hour + date.minutes + date.seconds;

  // if xml not found try find it
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midIdx = extractIdx(data[mid]);

    if (midIdx === targetIdx) {
      return replaceCharacters(data[mid]);
    } else if (midIdx < targetIdx) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return "Xml not found!";
}
//  ---------------------------
