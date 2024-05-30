import { selectFolderPath } from "../documentRefs.js";

const VISUALLY_HIDDEN = "visually-hidden";

export const setIsLoading = () => {
  selectFolderPath.disabled = true;
  selectFolderPath.children[0].classList.add(VISUALLY_HIDDEN);
  selectFolderPath.children[1].classList.remove(VISUALLY_HIDDEN);
  selectFolderPath.children[2].classList.remove(VISUALLY_HIDDEN);
};

export const setIsComplete = () => {
  selectFolderPath.disabled = false;
  selectFolderPath.children[0].classList.remove(VISUALLY_HIDDEN);
  selectFolderPath.children[1].classList.add(VISUALLY_HIDDEN);
  selectFolderPath.children[2].classList.add(VISUALLY_HIDDEN);
};
