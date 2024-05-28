import fs from "node:fs";
import XmlStream from "xml-stream";

function parseXmlStream(filePath, processChunk) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const xml = new XmlStream(stream);

    xml.collect("subitem");

    xml.on("endElement: IDX", function (item) {
      console.log(item);
      processChunk(item);
    });

    xml.on("end", function () {
      resolve();
    });

    xml.on("error", function (err) {
      reject(err);
    });
  });
}

export { parseXmlStream };
