import express from "express";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  uploadCoursesFromCSV,
  getCourseDetails,
  deleteCourse,
  GetMerchantDetails,
  DownloadCourseContent,
} from "../controllers/courseController.js";
import { csvupload, upload } from "../middleware/MulterMiddelware.js";

const router = express.Router();
router.get("/getMerchantDetails", GetMerchantDetails);
router.post("/bulkupload", csvupload, uploadCoursesFromCSV);
router.get("/DowloadCourseContent/:id", DownloadCourseContent);
router.get("/curriculum/:id", getCourseDetails);
router.get("/", getCourses);
router.get("/:id", getCourse);
router.post("/", upload.single("thumbnail"), createCourse);
router.put("/:id", upload.single("thumbnail"), updateCourse);
router.delete("/:id", deleteCourse);

// To get Merchant Details

export default router;
