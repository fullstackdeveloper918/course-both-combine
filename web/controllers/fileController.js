import { File, Lesson, Course } from "../models/associations.js";
import { Op } from "sequelize";
import {
  uploadToStorage,
  deleteFromStorage,
  getSignedUrl,
} from "../services/storageService.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

// Upload a new file
export const uploadFile = (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please upload a file",
        });
      }

      const { lessonId, courseId, isDownloadable } = req.body;

      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: "Lesson not found",
        });
      }

      const { url, key } = await uploadToStorage(req.file, "files");

      const file = await File.create({
        name: req.file.originalname,
        type: req.file.mimetype,
        url,
        size: req.file.size,
        mimeType: req.file.mimetype,
        lessonId,
        courseId,
        isDownloadable: isDownloadable || false,
        storageProvider: "s3",
        bucket: process.env.STORAGE_BUCKET,
        key,
      });

      res.status(201).json({
        success: true,
        data: file,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};

// Get all files
export const getFiles = async (req, res) => {
  try {
    const { lessonId, courseId, type, search } = req.query;
    const where = {};

    if (lessonId) where.lessonId = lessonId;
    if (courseId) where.courseId = courseId;
    if (type) where.type = type;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { type: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const files = await File.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single file
export const getFile = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update file
export const updateFile = async (req, res) => {
  try {
    const { name, isDownloadable } = req.body;

    const file = await File.findByPk(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    await file.update({
      name,
      isDownloadable,
    });

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    await deleteFromStorage(file.key);
    await file.destroy();

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

// Get download URL
export const getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    if (!file.isDownloadable) {
      return res.status(403).json({
        success: false,
        error: "File is not downloadable",
      });
    }

    const signedUrl = await getSignedUrl(file.key, file.name);

    // Increment download count
    await file.increment("downloadCount");

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: signedUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Bulk upload files
export const bulkUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please upload files",
      });
    }

    const { lessonId, courseId, isDownloadable } = req.body;

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const { url, key } = await uploadToStorage(file, "files");

      const uploadedFile = await File.create({
        name: file.originalname,
        type: file.mimetype,
        url,
        size: file.size,
        mimeType: file.mimetype,
        lessonId,
        courseId,
        isDownloadable: isDownloadable || false,
        storageProvider: "s3",
        bucket: process.env.STORAGE_BUCKET,
        key,
      });

      uploadedFiles.push(uploadedFile);
    }

    res.status(201).json({
      success: true,
      count: uploadedFiles.length,
      data: uploadedFiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get file statistics
export const getFileStats = async (req, res) => {
  try {
    const { lessonId, courseId } = req.query;
    const where = {};

    if (lessonId) where.lessonId = lessonId;
    if (courseId) where.courseId = courseId;

    const [totalFiles, totalSize, totalDownloads, fileTypes] =
      await Promise.all([
        File.count({ where }),
        File.sum("size", { where }),
        File.sum("downloadCount", { where }),
        File.findAll({
          where,
          attributes: [
            "type",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["type"],
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalFiles,
        totalSize: totalSize || 0,
        totalDownloads: totalDownloads || 0,
        fileTypes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
