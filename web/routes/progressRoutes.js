import express from "express";
import {
  // getProgress,
  updateProgress,
  deleteProgress,
  getCourseProgress,
  getlessonProgress,
  getProgressById,
  getModuleProgress,
  getCourseAllProgress,
} from "../controllers/progressController.js";

const router = express.Router();
router.post("/getCourseAllProgress", getCourseAllProgress);
router.get("/courseprogress/:userId/:courseId", getCourseProgress);
router.get("/moduleprogress/:userId/:moduleId", getModuleProgress);
router.get("/lessonprogress/:userId/:lessonId", getlessonProgress);
router.get("/progressbyid/:id", getProgressById);
router.put("/", updateProgress);

router.delete("/:id", deleteProgress);

export default router;
