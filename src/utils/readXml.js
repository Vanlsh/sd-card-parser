const fs = require("node:fs");
const iconv = require("iconv-lite");

const readXml = async (sdCardPath, sdSize) => {
  const startAddress = Math.floor((sdSize - 0x100000) / 2);
  const endAddress = sdSize - 0x100000;
  const chunkSize = 64 * 1024;
  const receipt = [];

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sdCardPath, {
      start: startAddress,
      end: endAddress,
      highWaterMark: chunkSize,
    });

    let remaining = "";

    readStream.on("data", (chunk) => {
      if (chunk[0] === 0) {
        const indexNotZero = chunk.findIndex((item) => item !== 0x00);
        if (indexNotZero < 0) {
          if (remaining.length > 0) {
            const sections = remaining.split("\x0A");
            if (sections.length >= 3) {
              const xmlDocument = getXmlDocument(sections);
              receipt.push(xmlDocument);
            }
          }
          readStream.destroy();
          resolve(receipt);
          return;
        }
      }

      remaining += iconv.decode(chunk, "windows-1251");

      let documentIndex;

      while ((documentIndex = remaining.indexOf("\x09")) > -1) {
        const document = remaining.slice(0, documentIndex);
        remaining = remaining.slice(documentIndex + 1);

        const sections = document.split("\x0A");
        if (sections.length < 3) continue;

        const xmlDocument = getXmlDocument(sections);
        receipt.push(xmlDocument);
      }
    });

    readStream.on("end", () => {
      if (remaining.length > 0) {
        const sections = remaining.split("\x0A");
        if (sections.length >= 3) {
          const xmlDocument = getXmlDocument(sections);
          receipt.push(xmlDocument);
        }
      }
      resolve(receipt);
    });

    readStream.on("error", (err) => {
      reject(err);
    });
  });
};

const getXmlDocument = (sections) => {
  const SPLIT_MARKER = "\n";
  const indexSection = sections[0] + SPLIT_MARKER;
  const datSection = sections[1] + SPLIT_MARKER;
  const macSection = sections[2] + SPLIT_MARKER;

  return `${indexSection}${datSection}${macSection}\n`;
};

module.exports = {
  readXml,
};
