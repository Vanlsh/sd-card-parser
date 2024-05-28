import fs from "node:fs";
import iconv from "iconv-lite";

const SPLIT_MARKER = "\n";

export const readXml = async (sdCardPath, outputFilePath, sdSize) => {
  const startAddress = Math.floor((sdSize - 0x100000) / 2);
  const endAddress = sdSize - 0x100000;
  const chunkSize = 1024 * 1024;

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sdCardPath, {
      start: startAddress,
      end: endAddress,
      highWaterMark: chunkSize,
    });
    const writeStream = fs.createWriteStream(outputFilePath);
    let remaining = "";

    readStream.on("data", (chunk) => {
      if (chunk[0] === 0) {
        const indexNotZero = chunk.findIndex((item) => item !== 0x00);
        if (indexNotZero < 0) {
          readStream.destroy();
          resolve();
        }
      }
      remaining += iconv.decode(chunk, "windows-1251");

      let documentIndex;
      while ((documentIndex = remaining.indexOf("\x09")) > -1) {
        const document = remaining.slice(0, documentIndex);
        remaining = remaining.slice(documentIndex + 1);

        const sections = document.split("\x0A");
        if (sections.length >= 3) {
          const indexSection = sections[0] + SPLIT_MARKER;
          const datSection = sections[1] + SPLIT_MARKER;
          const macSection = sections[2] + SPLIT_MARKER;

          const xmlDocument = `${indexSection}${datSection}${macSection}\n`;
          writeStream.write(iconv.encode(xmlDocument, "utf-8"));
        }
      }
    });

    readStream.on("end", () => {
      if (remaining.length > 0) {
        const sections = remaining.split("\x0A");
        if (sections.length >= 3) {
          const indexSection = sections[0] + SPLIT_MARKER;
          const datSection = sections[1] + SPLIT_MARKER;
          const macSection = sections[2] + SPLIT_MARKER;

          const xmlDocument = `${indexSection}${datSection}${macSection}\t`;
          writeStream.write(xmlDocument, "utf-8");
        }
      }
      writeStream.end(() => {
        console.log(
          "XML documents have been extracted and written to",
          outputFilePath
        );
      });
      resolve();
    });

    readStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });
  });
};
