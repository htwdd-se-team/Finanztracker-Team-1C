import { BadRequestException } from "@nestjs/common";
import { FileFilterCallback } from "multer";

/**
 * File filter for entry import files.
 * Allows: TXT, CSV, XLSX files and any text files (text/* MIME type).
 */
export function entryImportFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void {
  const allowedMimeTypes = [
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  // Get file extension
  const fileExtension = file.originalname
    .substring(file.originalname.lastIndexOf("."))
    .toLowerCase();

  const allowedExtensions = [".txt", ".csv", ".xlsx"];
  const isExtensionAllowed = allowedExtensions.includes(fileExtension);

  // Check if MIME type is allowed (for text files, accept any text/*)
  const isMimeTypeAllowed =
    file.mimetype.startsWith("text/") ||
    allowedMimeTypes.includes(file.mimetype);

  if (isExtensionAllowed || isMimeTypeAllowed) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `File type: ${file.mimetype} or extension: ${fileExtension} not allowed. Allowed types: TXT, CSV, XLSX, and other text files.`,
      ),
    );
  }
}
