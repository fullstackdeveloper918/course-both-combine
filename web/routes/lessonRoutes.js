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
  createBunnyTusUpload,
  getVideoProcessingStatus,
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
// Genrating the tus upload url for bunny stream
router.post("/createBunnyTusUpload", createBunnyTusUpload);
// Get video processing status from Bunny Stream
router.get("/video-status/:videoGuid", getVideoProcessingStatus);
router.get("/DownloadLessonContent/:id", DownloadLessonContent);
router.get("/:id", getLesson);
router.post("/", lessonUpload, createLesson);

router.put("/:id", lessonUpload, updateLesson);
router.delete("/:id", deleteLesson);

// router.get("/bulkUploadLessons", exportLessons);
// router.post("/csvbulkUpload", csvupload, bulkUploadLessons);

export default router;
