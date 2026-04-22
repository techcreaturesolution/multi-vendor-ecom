import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const uploadRoot = path.resolve(env.upload.dir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    // Never trust the client-provided extension: the stored filename is
    // what the static middleware uses to set Content-Type, so an attacker
    // could upload `evil.html` with `mimetype: image/jpeg` and achieve
    // stored XSS. Validate and normalise the extension here.
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(
        new ApiError(400, "Only JPG, PNG, WEBP, or GIF images are allowed"),
        ""
      );
    }
    cb(null, `${Date.now()}-${uuid()}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, "Only JPG, PNG, WEBP, or GIF images are allowed"));
  },
});

/**
 * In-memory upload for small structured files (e.g. bulk product CSV). We
 * keep the buffer in RAM so nothing persists on disk and we can reject
 * anything that isn't `.csv` before parsing.
 */
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      return cb(new ApiError(400, "Only .csv files are accepted"));
    }
    cb(null, true);
  },
});

/**
 * Build the public URL for an uploaded file. The app serves files from
 * `/uploads/<filename>`. Returning a relative URL keeps things simple for
 * local dev; in production a CDN URL should be constructed here.
 */
export function publicUrlFor(filename: string): string {
  return `/uploads/${filename}`;
}
