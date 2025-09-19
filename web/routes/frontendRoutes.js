import express from "express";
import User from "../models/User.js";
import CourseAccess from "../models/CourseAccess.js";
import Course from "../models/Course.js";
import { Op } from "sequelize";
import Lesson from "../models/Lesson.js";
import Progress from "../models/Progress.js";
import Module from "../models/Module.js";
import jwt from "jsonwebtoken";
import { generateSecureStreamUrl } from "../utils/bunnyUtilis.js";
import File from "../models/File.js";
import Merchant from "../models/Merchant.js";

const router = express.Router();

// Return the all courses of the user
router.get("/courses/getAllcourses/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    console.log("customer_id", customer_id);

    const user = await User.findOne({
      where: { shopifyCustomerId: customer_id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user.id);

    const courses = await CourseAccess.findAll({
      where: { userId: user.id },
    });
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "Courses not found for this user" });
    }
    console.log("courses...", courses);

    const coursesData = await Course.findAll({
      where: {
        id: {
          [Op.in]: courses.map((ca) => ca.courseId),
        },
      },
    });
    console.log("coursesData", coursesData);
    if (coursesData.length === 0) {
      return res.status(404).json({
        message: "User Has Course Access but its not available in our database",
      });
    }

    return res.status(200).json(coursesData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// return the progress
router.get(
  "/progress/courseprogress/:customer_id/:courseid",
  async (req, res) => {
    try {
      let { customer_id, courseid } = req.params;
      // Fetch all lessons in the course
      const totalLessons = await Lesson.count({
        where: { courseId: courseid, deleteFlag: false },
      });

      // Get user's progress records for the course
      const userProgressList = await Progress.findAll({
        where: { userId: customer_id, courseId: courseid },
      });

      // Count completed lessons
      const completedLessons = userProgressList.filter(
        (p) => p.status === "completed"
      ).length;

      // Calculate average progress percentage across all lessons
      const averageProgress =
        totalLessons > 0
          ? parseFloat(((completedLessons / totalLessons) * 100).toFixed(2))
          : 0;

      res.status(200).json({
        success: true,
        data: {
          courseId: courseid,
          totalLessons,
          completedLessons,
          averageProgress,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "error while get the progress of the course",
        error: error?.message || "Error",
      });
    }
  }
);

// Get All Modules of course

router.get("/modules/getallmodulesofcourse/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const modules = await Module.findAll({
      where: {
        courseId: courseId,
      },
      include: [
        {
          model: Lesson,
          as: "lessons",
          order: [["order", "ASC"]],
        },
      ],
      order: [["order", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get All lesson of the modules
router.get(
  "/lessons/getalllessonsofmodules/:courseId/:moduleId",
  async (req, res) => {
    try {
      const { moduleId, courseId } = req.params;

      const lessons = await Lesson.findAll({
        where: {
          deleteFlag: false, // Add this if you want to filter out deleted lessons
          moduleId: moduleId,
          courseId: courseId,
        },
        order: [["order", "ASC"]],
      });

      res.status(200).json({
        success: true,
        count: lessons.length,
        data: { lessons },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// get the single lesson
router.get("/lessons/getlesson/:id", async (req, res) => {
  try {
    console.log("get lesson run...");

    const lesson = await Lesson.findOne({
      where: {
        id: req.params.id,
        deleteFlag: false,
      },
      include: [
        {
          model: File,
          as: "files",
          where: { deleteFlag: false },
          required: false,
        },
      ],
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    // let find there merchant

    const merchant = await Merchant.findOne({
      where: {
        id: lesson.merchantId,
      },
    });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found or unauthorized access",
      });
    }

    const coursedata = await Course.findOne({
      where: {
        id: lesson.courseId,
      },
    });

    if (!coursedata) {
      return res.status(404).json({
        success: false,
        error: "Course not found or unauthorized access",
      });
    }

    // console.log("lesson", lesson);

    // let resdata = await axios.get("http://localhost:5000/VideosStreamWorker");
    // console.log(resdata.data);
    let token = null;
    if (lesson?.videoId) {
      let hlsurl = generateSecureStreamUrl({
        libraryId: merchant?.streamLibraryId || process.env.STREAM_LIB_ID,
        videoGuid: lesson?.videoId,
        securityKey:
          merchant?.streamSecureTokenApiKey ||
          process.env.STREAM_SECURE_TOKEN_KEY,
      });

      token = jwt.sign(
        {
          url: hlsurl,
        },
        process.env.JWT_SECRET,
        { expiresIn: "90m" }
      );
    }
    let { videoId, ...cleanup } = { ...lesson?.dataValues };
    res.status(200).json({
      success: true,
      data: { ...cleanup, videoUrl: token },
    });
  } catch (error) {
    console.error("getLesson error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
export default router;
