import { promises as fsPromises } from "node:fs";
import { PATH_FILE, PATH_XML } from "./path.js";
import { readXml } from "./utils/index.js";

// import "./utils/readEJ.js";
// export const getSize = async () => {
//   try {
//     const { size } = await fsPromises.stat(PATH_FILE);
//     return size;
//   } catch (error) {
//     console.log(error);
//     return 0;
//   }
// };

// const len = await getSize();

// await readXml(PATH_FILE, PATH_XML, len);
// console.log("reading is finished!");

import "./service/createHtml.js";
