import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = [".csv", ".xlsx", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only .csv, .xlsx, and .xls files are allowed"));
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");
