import { Module, Lesson, File, Course } from "../models/associations.js";
// import * as csv from "csv-parse/sync";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import csv from "csvtojson";
import { Op } from "sequelize";

// Create a new module
export const createModule = async (req, res) => {
  try {
    let { title, description, order = null, courseId } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }
    const moduleCount = await Module.count({
      where: { courseId },
    });
    if (moduleCount === 0) {
      order = 1;
    } else if (order == null) {
      order = moduleCount + 1;
    } else {
      const AfterModules = await Module.findAll({
        where: {
          courseId,
          order: { [Op.gte]: order },
        },
        order: [["order", "ASC"]],
      });

      for (let data of AfterModules) {
        await Module.update(
          { order: data.order + 1 },
          { where: { id: data.id } }
        );
      }
    }
    let module = await Module.create({
      title,
      description,
      order,
      courseId,
    });

    return res.status(201).json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all modules for a course
export const getModules = async (req, res) => {
  try {
    const { courseId, search } = req.query;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const modules = await Module.findAll({
      where,
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
};

// Get single module
export const getModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      include: [
        {
          model: Lesson,
          as: "lessons",
          order: [["order", "ASC"]],
        },
      ],
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    res.status(200).json({
      success: true,
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update module
export const updateModule = async (req, res) => {
  try {
    const { title, description, order } = req.body;

    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    await module.update({
      title,
      description,
      order,
    });

    res.status(200).json({
      success: true,
      data: module,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete module
export const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    await module.destroy();

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

// Reorder modules
export const reorderModules = async (req, res) => {
  try {
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      return res.status(400).json({
        success: false,
        error: "moduleIds must be an array",
      });
    }

    const updates = moduleIds.map((id, index) =>
      Module.update({ order: index + 1 }, { where: { id } })
    );

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: "Modules reordered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get module statistics
export const getModuleStats = async (req, res) => {
  try {
    const moduleId = req.params.id;

    const [totalLessons, totalDuration, totalFiles] = await Promise.all([
      Lesson.count({ where: { moduleId } }),
      Lesson.sum("duration", { where: { moduleId } }),
      Lesson.count({
        where: { moduleId },
        include: [
          {
            model: File,
            as: "files",
          },
        ],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLessons,
        totalDuration: totalDuration || 0,
        totalFiles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const exportModules = async (req, res) => {
  try {
    const modules = await Module.findAll();
    const csvWriter = createObjectCsvWriter({
      path: path.join(__dirname, "../exports/modules.csv"),
      header: [
        { id: "title", title: "Title" },
        { id: "description", title: "Description" },
        { id: "order", title: "Order" },
        { id: "courseId", title: "Course ID" },
      ],
    });
    const records = modules.map((m) => ({
      title: m.title,
      description: m.description,
      order: m.order,
      courseId: m.courseId,
    }));
    await csvWriter.writeRecords(records);
    res.download(path.join(__dirname, "../exports/modules.csv"));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const CreateModulesFromcsv = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Please upload a CSV file" });
    }

    if (!courseId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Course ID is required in the request body",
      });
    }

    const filePath = req.file.path;

    // Convert CSV to JSON
    const modulesData = await csv().fromFile(filePath);

    const createdModules = [];

    for (const record of modulesData) {
      const module = await Module.create({
        title: record.title,
        description: record.description,
        order: parseInt(record.order, 10),
        courseId,
      });
      createdModules.push(module);
    }

    fs.unlinkSync(filePath); // Remove file after processing

    res.status(200).json({
      success: true,
      message: `${createdModules.length} modules imported successfully`,
      data: createdModules,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download Module Content
export const DownloadModuleContent = async (req, res) => {
  try {
    const data = await Module.findByPk(req.params.id, {
      attributes: ["title", "order", "totalLessons"],

      include: [
        {
          model: Lesson,
          as: "lessons",
          attributes: ["title", "order", "thumbnail"],
          separate: true, // Ensures ordering works properly on nested includes
          order: [["order", "ASC"]],
          include: [
            {
              model: File,
              as: "files",
              attributes: ["name", "mimeType", "url"],
              separate: true, // Ensures ordering works properly on nested includes
              order: [["createdAt", "ASC"]],
            },
          ],
        },
      ],
      separate: true, // Optional but recommended if you want proper ordering
      order: [["order", "ASC"]],
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
