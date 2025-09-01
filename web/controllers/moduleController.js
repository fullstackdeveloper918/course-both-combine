import { Module, Lesson, File, Course } from "../models/associations.js";
// import * as csv from "csv-parse/sync";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import csv from "csvtojson";
import { Op, Sequelize } from "sequelize";
import { ApiError } from "../utils/ApiUtilis.js";

// Create a new module
// Create a new module
export const createModule = async (req, res) => {
  const { title, description, order, courseId } = req.body;
  if (!title || !description || !courseId) {
    return res.status(400).json({
      success: false,
      error: "All fields are required",
    });
  }

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Get current number of modules in the course
    const moduleCount = await Module.count({ where: { courseId } });

    let finalOrder;

    // If no modules exist, first module is always order 1
    if (moduleCount === 0) {
      finalOrder = 1;
    } else if (!order || isNaN(order) || order < 1) {
      finalOrder = moduleCount + 1;
    } else if (order > moduleCount + 1) {
      finalOrder = moduleCount + 1;
    } else {
      finalOrder = order;

      // Increment order for subsequent modules
      await Module.increment(
        { order: 1 },
        {
          where: {
            courseId,
            order: { [Op.gte]: finalOrder },
          },
        }
      );
    }

    // Create the module with the determined order
    const module = await Module.create({
      title,
      description,
      order: finalOrder,
      courseId,
    });

    return res.status(201).json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// export const createModule = async (req, res) => {
//   try {
//     let { title, description, order = null, courseId } = req.body;
//     if (!title || !description || !courseId) {
//       return res.status(400).json({
//         success: false,
//         error: "All fields are required",
//       });
//     }
//     const course = await Course.findByPk(courseId);
//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         error: "Course not found",
//       });
//     }
//     const moduleCount = await Module.count({
//       where: { courseId },
//     });
//     if (moduleCount === 0) {
//       order = 1;
//     } else if (order == null) {
//       order = moduleCount + 1;
//     } else {
//       const AfterModules = await Module.findAll({
//         where: {
//           courseId,
//           order: { [Op.gte]: order },
//         },
//         order: [["order", "ASC"]],
//       });

//       for (let data of AfterModules) {
//         await Module.update(
//           { order: data.order + 1 },
//           { where: { id: data.id } }
//         );
//       }
//     }
//     let module = await Module.create({
//       title,
//       description,
//       order,
//       courseId,
//     });

//     return res.status(201).json({
//       success: true,
//       data: module,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

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

    if (!title || !description || order === undefined) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Find the module to update
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    // Only proceed if the order is actually changing
    if (module.order !== order) {
      // Find all modules in the course, excluding the current one
      const modules = await Module.findAll({
        where: {
          courseId: module.courseId,
          id: { [Op.ne]: module.id },
        },
        order: [["order", "ASC"]],
      });

      // Remove the current module from its present order
      let modulesToUpdate = [];

      // If moving up (e.g. 5 → 2), increment affected modules in the target range
      if (order < module.order) {
        modulesToUpdate = modules.filter(
          (m) => m.order >= order && m.order < module.order
        );
        for (let m of modulesToUpdate) {
          await Module.update({ order: m.order + 1 }, { where: { id: m.id } });
        }
      }
      // If moving down (e.g. 2 → 5), decrement affected modules in the target range
      else if (order > module.order) {
        modulesToUpdate = modules.filter(
          (m) => m.order <= order && m.order > module.order
        );
        for (let m of modulesToUpdate) {
          await Module.update({ order: m.order - 1 }, { where: { id: m.id } });
        }
      }
    }

    // Update the module itself
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

// delete the module
export const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    const deletedOrder = module.order;
    const courseId = module.courseId;

    // Delete the module
    await module.destroy();

    // Shift orders of subsequent modules down by 1
    await Module.update(
      { order: Sequelize.literal("`order` - 1") },
      {
        where: {
          courseId: courseId,
          order: { [Op.gt]: deletedOrder },
        },
      }
    );

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

// csv bulk Upload

export const CreateModulesFromcsv = async (req, res) => {
  let localFilePath;
  try {
    const { courseId } = req.body;

    if (!req.file) throw new ApiError("Please upload a CSV file", 400);
    localFilePath = req.file.path;

    if (!courseId) throw new ApiError("Course ID is required", 400);

    // Convert CSV to JSON
    let modulesData = await csv().fromFile(localFilePath);
    // Clean and parse order values; assign 0 to invalid or missing
    modulesData = modulesData.map((mod) => {
      return {
        title: mod.title || "default title",
        description: mod.description || "default description",
        order: parseInt(mod.order, 10) || 0,
      };
    });

    // Sort modules by their assigned order, those with 0 orders go last
    modulesData.sort((a, b) => {
      if (a.order === 0) return 1;
      if (b.order === 0) return -1;
      return a.order - b.order;
    });

    // Fetch existing modules orders for the course
    const existingModules = await Module.findAll({
      where: { courseId },
      order: [["order", "ASC"]],
    });

    // Get max current order in DB
    let maxExistingOrder = existingModules.length
      ? existingModules[existingModules.length - 1].order
      : 0;

    // Prepare combined order sequence:
    // Re-assign orders in modulesData starting at 1 if no existing
    // or at maxExistingOrder + 1 if existing modules present
    let startOrder = maxExistingOrder + 1;
    let nextOrder = startOrder;

    for (let i = 0; i < modulesData.length; i++) {
      // If order is less than or equal to maxExistingOrder,
      // we must shift existing modules' orders to make room.
      if (
        modulesData[i].order > 0 &&
        modulesData[i].order <= maxExistingOrder
      ) {
        // Shift existing modules with order >= this order by +1
        await Module.increment(
          { order: 1 },
          {
            where: {
              courseId,
              order: { [Op.gte]: modulesData[i].order },
            },
          }
        );

        maxExistingOrder++; // Update max after shift
        modulesData[i].order = modulesData[i].order; // Keep original order
      } else if (modulesData[i].order === 0) {
        // Assign next available order
        modulesData[i].order = nextOrder++;
      } else if (modulesData[i].order > maxExistingOrder) {
        // Accept order if larger than maxExistingOrder
        nextOrder = modulesData[i].order + 1;
      }
    }

    // Now ensure the orders in modulesData are unique & sequential
    // Sort modulesData again by order
    modulesData.sort((a, b) => a.order - b.order);

    // Fix any potential gaps or duplicates by reassigning orders sequentially
    let lastOrder = 0;
    for (let mod of modulesData) {
      if (mod.order <= lastOrder) {
        mod.order = lastOrder + 1;
      }
      lastOrder = mod.order;
    }

    // Create modules in DB
    const createdModules = [];
    for (const moduleData of modulesData) {
      const module = await Module.create({
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order,
        courseId,
      });
      createdModules.push(module);
    }

    fs.unlinkSync(localFilePath);

    res.status(200).json({
      success: true,
      message: `${createdModules.length} modules imported successfully`,
      data: createdModules,
    });
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// export const CreateModulesFromcsv = async (req, res) => {
//   let localfilepath;
//   try {
//     const { courseId } = req.body;

//     if (!req.file) throw new ApiError("Please upload a CSV file", 400);
//     const filePath = req.file.path;
//     localfilepath = filePath;

//     if (!courseId) throw new ApiError("Course ID is required", 400);

//     // Convert CSV to JSON
//     const modulesData = await csv().fromFile(filePath);

//     const createdModules = [];

//     for (const record of modulesData) {
//       const {
//         title = "default title",
//         description = "default description",
//         order = null,
//       } = record;

//       const module = await Module.create({
//         title: record.title,
//         description: record.description,
//         order: parseInt(record.order, 10),
//         courseId,
//       });
//       createdModules.push(module);
//     }

//     fs.unlinkSync(filePath); // Remove file after processing

//     res.status(200).json({
//       success: true,
//       message: `${createdModules.length} modules imported successfully`,
//       data: createdModules,
//     });
//   } catch (error) {
//     if (req.file?.path && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

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
