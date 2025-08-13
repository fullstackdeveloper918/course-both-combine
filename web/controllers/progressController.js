import {
  Progress,
  User,
  Course,
  Module,
  Lesson,
} from "../models/associations.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Create or update progress
export const updateProgress = async (req, res) => {
  try {
    const {
      userId,
      lessonId,
      courseId,
      moduleId,
      status,
      progress,
      lastPosition,
    } = req.body;

    const [userProgress, created] = await Progress.findOrCreate({
      where: { userId, lessonId },
      defaults: {
        courseId,
        moduleId,
        status,
        progress,
        lastPosition,
        lastAccessedAt: new Date(),
      },
    });

    if (!created) {
      await userProgress.update({
        status,
        progress,
        lastPosition,
        lastAccessedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null,
      });
    }

    res.status(200).json({
      success: true,
      data: userProgress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Get Leasson Progress
export const getlessonProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    if (!userId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: "Both userId and lessonId are required",
      });
    }

    const progress = await Progress.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: "Progress record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single progress record
export const getProgressById = async (req, res) => {
  try {
    const progress = await Progress.findByPk(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: "Progress record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete progress record
export const deleteProgress = async (req, res) => {
  try {
    const progress = await Progress.findByPk(req.params.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: "Progress record not found",
      });
    }

    await progress.destroy();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Fetch all lessons in the course
    const totalLessons = await Lesson.count({
      where: { courseId, deleteFlag: false },
    });

    // Get user's progress records for the course
    const userProgressList = await Progress.findAll({
      where: { userId, courseId },
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
        courseId,
        totalLessons,
        completedLessons,
        averageProgress,
      },
    });
  } catch (error) {
    console.error("getCourseProgress error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const getCourseAllProgress = async (req, res) => {
  try {
    const { userId, courseId, moduleId } = req.body;

    // ----- COURSE PROGRESS -----
    const totalCourseLessons = await Lesson.count({
      where: { courseId, deleteFlag: false },
    });

    const courseProgressList = await Progress.findAll({
      where: { userId, courseId },
    });

    const completedCourseLessons = courseProgressList.filter(
      (p) => p.status === "completed"
    ).length;

    const averageCourseProgress =
      totalCourseLessons > 0
        ? parseFloat(
            ((completedCourseLessons / totalCourseLessons) * 100).toFixed(2)
          )
        : 0;

    // ----- MODULE PROGRESS -----
    const moduleProgressList = await Progress.findAll({
      where: { userId, moduleId },
      include: [
        {
          model: Lesson,
          as: "lesson",
        },
      ],
      order: [[{ model: Lesson, as: "lesson" }, "order", "ASC"]],
    });

    const totalModuleLessons = await Lesson.count({
      where: { moduleId, deleteFlag: false },
    });

    const completedModuleLessons = moduleProgressList.filter(
      (p) => p.status === "completed"
    ).length;

    const averageModuleProgress =
      totalModuleLessons > 0
        ? parseFloat(
            ((completedModuleLessons / totalModuleLessons) * 100).toFixed(2)
          )
        : 0;

    // ----- FINAL RESPONSE -----
    res.status(200).json({
      success: true,
      data: {
        course: {
          courseId,
          totalLessons: totalCourseLessons,
          completedLessons: completedCourseLessons,
          averageProgress: averageCourseProgress,
          isCompleted: totalCourseLessons === completedCourseLessons,
        },
        module: {
          moduleId,
          totalLessons: totalModuleLessons,
          completedLessons: completedModuleLessons,
          averageProgress: averageModuleProgress,
          isCompleted: totalModuleLessons === completedModuleLessons,
        },
      },
    });
  } catch (error) {
    console.error("getCourseAllProgress error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get module progress
export const getModuleProgress = async (req, res) => {
  try {
    const { userId, moduleId } = req.params;

    // Fetch all progress records for this module and user
    const progress = await Progress.findAll({
      where: { userId, moduleId },
      include: [
        {
          model: Lesson,
          as: "lesson",
        },
      ],
      order: [[{ model: Lesson, as: "lesson" }, "order", "ASC"]],
    });

    // Count total lessons in the module
    const totalLessons = await Lesson.count({ where: { moduleId } });

    // Count how many of those lessons are completed
    const completedLessons = progress.filter(
      (p) => p.status === "completed"
    ).length;

    // Calculate average progress percentage safely
    const averageProgress =
      totalLessons > 0
        ? parseFloat(((completedLessons / totalLessons) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLessons,
        completedLessons,
        averageProgress, // This is the % of completed lessons
      },
    });
  } catch (error) {
    console.error("getModuleProgress error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get progress statistics
export const getProgressStats = async (req, res) => {
  try {
    const { userId, courseId, moduleId } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    if (moduleId) where.moduleId = moduleId;

    const [totalProgress, completedProgress, averageProgress, recentProgress] =
      await Promise.all([
        Progress.count({ where }),
        Progress.count({ where: { ...where, status: "completed" } }),
        Progress.findAll({
          where,
          attributes: [
            [sequelize.fn("AVG", sequelize.col("progress")), "averageProgress"],
          ],
        }),
        Progress.findAll({
          where,
          include: [
            {
              model: User,
              as: "user",
            },
            {
              model: Course,
              as: "course",
            },
            {
              model: Lesson,
              as: "lesson",
            },
          ],
          order: [["lastAccessedAt", "DESC"]],
          limit: 10,
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalProgress,
        completedProgress,
        averageProgress:
          averageProgress[0].getDataValue("averageProgress") || 0,
        recentProgress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
