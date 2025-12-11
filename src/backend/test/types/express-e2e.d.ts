// Extend Express namespace for Multer types in e2e tests
/// <reference types="node" />

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      stream?: import("stream").Readable;
      destination?: string;
      filename?: string;
      path?: string;
      buffer?: Buffer;
    }
  }
}

