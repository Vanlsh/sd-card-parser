const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

const path = require("node:path");
const { parseFirstPartData } = require("../parsers/index.js");

async function getSDInfo(filePath) {
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

module.exports = {
  getSDInfo,
};
