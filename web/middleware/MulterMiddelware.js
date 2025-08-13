import multer from "multer";
import path from "path";
import fs from "fs";

// === Ensure Upload Directories Exist ===
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

["uploads/videos", "uploads/files", "uploads/csv"].forEach(ensureDir);

// === Base Disk Storage Generator ===
const generateStorage = (videoField = "video", fileField = "file") =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const isVideo =
        file.fieldname === videoField || file.fieldname === "videos";
      const isCSV = file.mimetype === "text/csv";
      if (isCSV) return cb(null, "uploads/csv/");
      cb(null, isVideo ? "uploads/videos/" : "uploads/files/");
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${sanitized}`;
      cb(null, uniqueName);
    },
  });

// === Common File Filter ===
// const fileFilter = (req, file, cb) => {
//   const { fieldname, mimetype } = file;

//   const videoFieldNames = ["video", "videos"];
//   const allowedDocsAndImages = [
//     "application/pdf",
//     "image/jpeg",
//     "image/png",
//     "text/plain",
//   ];

//   if (videoFieldNames.includes(fieldname) && mimetype.startsWith("video/"))
//     return cb(null, true);

//   if (fieldname === "thumbnail" && mimetype.startsWith("image/"))
//     return cb(null, true);

//   if (fieldname === "file" && allowedDocsAndImages.includes(mimetype))
//     return cb(null, true);

//   if (fieldname === "csvFile" && mimetype === "text/csv") return cb(null, true);

//   return cb(new Error(`Invalid file type or field: ${fieldname}`), false);
// };
const fileFilter = (req, file, cb) => {
  const { fieldname, mimetype } = file;

  const allowedMimeTypes = {
    video: ["video/mp4", "video/webm", "video/ogg"],
    thumbnail: ["image/jpeg", "image/png", "image/webp"],
    file: [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/plain", // .txt
      "text/csv", // .csv
      "application/zip", // .zip
      "application/x-zip-compressed", // .zip
    ],
  };

  // Allow videos
  if (fieldname === "video" && allowedMimeTypes.video.includes(mimetype)) {
    return cb(null, true);
  }

  // Allow thumbnails (images)
  if (
    fieldname === "thumbnail" &&
    allowedMimeTypes.thumbnail.includes(mimetype)
  ) {
    return cb(null, true);
  }

  // Allow general files
  if (fieldname === "file" && allowedMimeTypes.file.includes(mimetype)) {
    return cb(null, true);
  }

  // Allow CSV explicitly if coming via "csvFile" field
  if (fieldname === "csvFile" && mimetype === "text/csv") {
    return cb(null, true);
  }

  // Reject everything else
  return cb(
    new Error(`Invalid file type or field: ${fieldname}, ${mimetype}`),
    false
  );
};

// === Lesson Upload ===

//  1. Storage that always saves to 'uploads/' folder
const generateStorageforlessons = () =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // ✅ All files go here
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${sanitized}`;
      cb(null, uniqueName);
    },
  });

//  2. Define lessonUpload middleware
export const lessonUpload = multer({
  storage: generateStorageforlessons(),
  fileFilter,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600MB per file
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "file", maxCount: 5 },
]);

// export const lessonUpload = multer({
//   storage: generateStorage("video"),
//   fileFilter,
//   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
// }).fields([
//   { name: "video", maxCount: 1 },
//   { name: "thumbnail", maxCount: 1 },
//   { name: "file", maxCount: 5 },
// ]);

// === Bulk Upload ===

let bulkuploadfields = [
  { name: "videos", maxCount: 10 },
  { name: "thumbnail", maxCount: 10 },
];
for (let i = 1; i < 10; i++) {
  bulkuploadfields.push({ name: `file${i}`, maxCount: 5 });
}

const generateStoragebulkupload = (videoField = "video", fileField = "file") =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const isVideo =
        file.fieldname === videoField || file.fieldname === "videos";
      const isCSV = file.mimetype === "text/csv";

      const folder = isCSV
        ? "uploads/csv/"
        : isVideo
        ? "uploads/videos/"
        : "uploads/files/";

      // Ensure folder exists
      fs.mkdirSync(folder, { recursive: true });

      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${sanitized}`;
      cb(null, uniqueName);
    },
  });

// 3. File filter
const fileFilterbulkUpload = (req, file, cb) => {
  const allowedFields = [
    "videos",
    "thumbnail",
    ...Array.from({ length: 9 }, (_, i) => `file${i + 1}`),
  ];

  if (allowedFields.includes(file.fieldname)) {
    return cb(null, true);
  }

  return cb(new Error("Invalid file type or field: " + file.fieldname));
};

export const bulkupload = multer({
  storage: generateStorageforlessons(),
  fileFilter: fileFilterbulkUpload,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
}).fields(bulkuploadfields);

// === CSV Upload ===
export const csvupload = multer({
  storage: generateStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit CSV to 5MB
}).single("csvFile");

export const upload = multer({ dest: "./uploads/" });
