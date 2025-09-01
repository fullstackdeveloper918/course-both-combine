import multer from "multer";
import path from "path";
import fs from "fs";

// === Ensure Upload Directories Exist ===
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

["uploads/videos", "uploads/files", "uploads/csv"].forEach(ensureDir);

// CSV file filter
const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv") {
    cb(null, true); // accept
  } else {
    cb(new Error("Only CSV files are allowed"), false); // reject
  }
};

// === Base Disk Storage Generator ===
const generateStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // all files go here
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, "_"); // replace spaces
      const uniqueName = `${Date.now()}-${sanitized}`; // prepend timestamp
      cb(null, uniqueName);
    },
  });

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

// FIle Validation for the lesson upload
const LessonfileFilter = (req, file, cb) => {
  const { fieldname, mimetype } = file;

  if (fieldname === "video") {
    // Only allow mp4 videos
    if (mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb(new Error("Invalid video format. Only MP4 is allowed."));
    }
  } else if (fieldname === "thumbnail") {
    // Allow common image types for thumbnails
    if (
      mimetype === "image/jpeg" ||
      mimetype === "image/jpg" ||
      mimetype === "image/png" ||
      mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid thumbnail format. Only JPG, PNG, GIF are allowed.")
      );
    }
  } else if (fieldname === "file") {
    // Allow common document types - adjust as needed
    if (
      mimetype === "application/pdf" ||
      mimetype === "application/msword" || // .doc
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      mimetype === "text/plain" ||
      mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for additional files."));
    }
  } else {
    cb(new Error("Unexpected field " + fieldname));
  }
};

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

// For lesson Upload
export const lessonUpload = multer({
  storage: generateStorageforlessons(),
  fileFilter: LessonfileFilter,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600MB per file
}).fields([
  // { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "file", maxCount: 5 },
]);

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

// === CSV Upload  for the course and module ===
export const csvupload = multer({
  storage: generateStorage(),
  fileFilter: csvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit CSV to 5MB
}).single("csvFile");

// For Single File Upload Used in Course
export const upload = multer({ dest: "./uploads/" });
