import fs from "node:fs/promises";

export const getSize = async (path) => {
  try {
    const { size } = await fs.stat(path);
    return size;
  } catch (error) {
    console.log(error);
    return 0;
  }
};
