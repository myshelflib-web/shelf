/** Max folders from root through deepest child (root counts as 1). */
export const MAX_FOLDER_DEPTH = 10;

export class FolderDepthError extends Error {
  constructor(message = "Folder nesting limit reached") {
    super(message);
    this.name = "FolderDepthError";
  }
}
