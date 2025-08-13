import express from "express";
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  bulkUploadLessons,
  exportLessons,
  importLessons,
  BulkUpload,
  DownloadLessonContent,
} from "../controllers/lessonController.js";
import {
  // upload,
  bulkupload,
  csvupload,
  lessonUpload,
  // lessonUpload,
} from "../middleware/MulterMiddelware.js";
const router = express.Router();

router.get("/", getLessons);
router.post("/bulk-upload", bulkupload, BulkUpload);
router.get("/DownloadLessonContent/:id", DownloadLessonContent);
router.get("/:id", getLesson);
router.post("/", lessonUpload, createLesson);

router.put("/:id", lessonUpload, updateLesson);
router.delete("/:id", deleteLesson);

// router.get("/bulkUploadLessons", exportLessons);
// router.post("/csvbulkUpload", csvupload, bulkUploadLessons);

export default router;
