import {
  Course,
  Module,
  Lesson,
  File,
  CourseAccess,
  User,
} from "../models/associations.js";
// import * as csv from "csv-parse/sync";
import slug from "slug";

import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import Merchant from "../models/Merchant.js";
import fetch from "node-fetch";
import csv from "csvtojson";
import fs2 from "fs/promises";
import envConfig from "../config/env.js";
import {
  createCollection,
  deleteBunnyStorageFile,
  uploadToBunnyStorage,
} from "../utils/bunnyUtilis.js";
import { getBunnyPublicUrl } from "./lessonController.js";
import { ApiError, SuccessResponse } from "../utils/ApiUtilis.js";
import { where } from "sequelize";
// Create a new course
const StreamApiKEY = process.env.STREAM_API_KEY;
const StreamSecureTokenApi = process.env.STREAM_SECURE_TOKEN_KEY;
const LibId = process.env.STREAM_LIB_ID;
export const createCourse = async (req, res, next) => {
  let thumbnailpath = "";
  let thumbnaillocalfile = "";
  const session = res.locals.shopify?.session || req.session;
  let shopDomain;
  if (process.env.NODE_ENV_ENV == "development") {
    shopDomain = process.env.TEST_DOMAIN;
    console.log(shopDomain, "shopDomaincreateCourse");
  } else if (session && session.shop) {
    shopDomain = session.shop;
  } else {
    return res
      .status(401)
      .json({ error: "Unauthorized: No valid Shopify session." });
  }
  try {
    let thumbnail = req.file;
    let thumbnailUrl = "";
    if (!thumbnail) {
      throw new ApiError("Thumbnail is required", 422);
    }
    thumbnaillocalfile = thumbnail.filename;

    const merchant = await Merchant.findOne({
      where: { shop: shopDomain },
    });
    if (!merchant) {
      // return res.status(404).json({ error: "Merchant not found for this shop." });
      throw new ApiError("Merchant not found for this shop.", 404);
    }

    const merchantId = merchant.id;

    const accessToken = merchant.shopifyAccessToken;
    // console.log("accessTokencreateCourse", accessToken);

    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      throw new ApiError("All fields Are Required", 422);
    }

    const sanitizedFilename = thumbnail.originalname.replace(/\s+/g, "-");
    const extension = path.extname(sanitizedFilename);
    const baseName = path.basename(sanitizedFilename, extension);
    const uniqueFilename = `${baseName}-${Date.now()}${extension}`;

    // Final destination
    const destination = `thumbnails/${uniqueFilename}`;
    // thumbnaillocalfile = thumbnail.filename;

    const result = await uploadToBunnyStorage(thumbnail.filename, destination);
    if (result?.error) {
      throw new ApiError("Failed to upload thumbnail.", 422);
    }
    thumbnailpath = destination;
    thumbnailUrl = getBunnyPublicUrl(destination);

    // 1. Create product in Shopify
    const productPayload = {
      product: {
        title,
        body_html: description,
        // images: thumbnail ? [{ src: thumbnail }] : [],
        images: thumbnailUrl ? [{ src: thumbnailUrl }] : [],
        variants: [
          {
            price: price ? price.toString() : "0.00",
            inventory_management: "shopify",
            inventory_policy: "deny",
            fulfillment_service: "manual",
            requires_shipping: false,
          },
        ],
      },
    };
    const shopifyRes = await fetch(
      `https://${shopDomain}/admin/api/2023-10/products.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productPayload),
      }
    );
    const shopifyData = await shopifyRes.json();

    // console.log("shopifyData", shopifyData);

    // console.log("shopifyDatacreateCourse", shopifyData);
    if (!shopifyRes.ok || !shopifyData.product) {
      throw new ApiError("Failed to create Shopify product", 500);
    }
    const shopifyProductId = shopifyData.product.id;
    const shopifyHandle = shopifyData.product.handle;

    let collectionId = await createCollection({
      LibraryId: merchant?.StreamLibraryId || LibId,
      apiKey: merchant?.AccessKey || StreamApiKEY,
      name: slug(title),
    });
    // console.log("collectionIdcreateCourse", collectionId);

    // 2. Create course in DB, linked to Shopify product
    const course = await Course.create({
      title,
      description,
      thumbnail: thumbnailUrl,
      shopifyProductId,
      shopifyHandle,
      price,
      thumbnailDestinationPath: thumbnailpath,
      merchantId,
      Colletionid: collectionId?.guid,
    });

    res.status(201).json({
      success: true,
      data: { course, shopifyProduct: shopifyData.product },
    });
  } catch (error) {
    // console.log(error);

    await deleteBunnyStorageFile(thumbnailpath);
    return next(new ApiError(error?.message, error?.status));
  } finally {
    if (thumbnaillocalfile) {
      try {
        await fs2.unlink(path.join("uploads", thumbnaillocalfile));
      } catch (err) {
        console.warn(" Failed to delete thumbnail:", err.message);
      }
    }
  }
};

// Get all courses
export const getCourses = async (req, res, next) => {
  try {
    const session = res.locals.shopify?.session || req.session;

    let shopDomain;

    if (process.env.NODE_ENV_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      throw new ApiError("Unauthorized: No valid Shopify session.", 401);
    }

    const merchant = await Merchant.findOne({
      where: { shop: shopDomain },
    });

    if (!merchant) {
      throw new ApiError("Merchant not found for this shop.", 404);
    }
    const merchantId = merchant.id;

    const where = {};

    if (merchantId) where.merchantId = merchantId;

    const courses = await Course.findAll({
      where,
      include: [
        {
          model: Module,
          as: "modules",
          include: [
            {
              where: { status: "published" },
              model: Lesson,
              as: "lessons",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    // console.log(error);

    return next(new ApiError(error?.message, error?.status));
    // res.status(500).json({
    //   success: false,
    //   error: error.message,
    // });
  }
};

// Get single course
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Module,
          as: "modules",
          include: [
            {
              model: Lesson,
              as: "lessons",
              where: { deleteFlag: false },
              include: [
                {
                  model: File,
                  as: "files",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!course) {
      throw new ApiError("Course not found");
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  let thumbnailpath = "";
  let thumbnaillocalfile = "";
  const session = res.locals.shopify?.session || req.session;
  let shopDomain;
  if (process.env.NODE_ENV_ENV === "development") {
    shopDomain = process.env.TEST_DOMAIN;
  } else if (session && session.shop) {
    shopDomain = session.shop;
  } else {
    return res
      .status(401)
      .json({ error: "Unauthorized: No valid Shopify session." });
  }

  const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
  if (!merchant) {
    return res.status(404).json({ error: "Merchant not found for this shop." });
  }
  const accessToken = merchant.shopifyAccessToken;

  try {
    const { title, description, price, status } = req.body;
    let thumbnailUrl = null;

    let destinationPath = null;
    if (req?.file) {
      let thumbnail = req.file;
      if (thumbnail) {
        thumbnaillocalfile = thumbnail.filename;
        const sanitizedFilename = thumbnail.originalname.replace(/\s+/g, "-");
        const extension = path.extname(sanitizedFilename);
        const baseName = path.basename(sanitizedFilename, extension);
        const uniqueFilename = `${baseName}-${Date.now()}${extension}`;

        // Final destination
        const destination = `thumbnails/${uniqueFilename}`;
        destinationPath = destination;
        // const destination = `thumbnails/${sanitizedFilename}`;

        const result = await uploadToBunnyStorage(
          thumbnail.filename,
          destination
        );
        if (result?.error) {
          throw new ApiError("Failed to upload thumbnail.", 422);
        }
        thumbnailpath = destination;
        thumbnailUrl = getBunnyPublicUrl(destination); // make sure this returns a valid URL
      }
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Update Shopify product
    if (course.shopifyProductId) {
      const productPayload = {
        product: {
          id: course.shopifyProductId,
          title,
          body_html: description,
          images: thumbnailUrl
            ? [{ src: thumbnailUrl }]
            : [{ src: course?.thumbnail }],
          variants: [
            {
              price: price ? price.toString() : "0.00",
              inventory_management: "shopify",
              inventory_policy: "deny",
              fulfillment_service: "manual",
              requires_shipping: false,
            },
          ],
          status: status || "active",
        },
      };
      const shopifyRes = await fetch(
        `https://${shopDomain}/admin/api/2023-10/products/${course.shopifyProductId}.json`,
        {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productPayload),
        }
      );
      const shopifyData = await shopifyRes.json();

      if (!shopifyRes.ok || !shopifyData.product) {
        return res.status(500).json({
          success: false,
          error: "Failed to update Shopify product",
          details: shopifyData,
        });
      }
    }
    let prevoiusDestinationPath = course?.thumbnailDestinationPath;
    await course.update({
      title,
      description,
      thumbnail: thumbnailUrl ? thumbnailUrl : course?.thumbnail,
      thumbnailDestinationPath: destinationPath
        ? destinationPath
        : course.thumbnailDestinationPath,
      price,
      status,
    });

    if (thumbnailUrl) {
      await deleteBunnyStorageFile(prevoiusDestinationPath);
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    if (thumbnailpath) {
      await deleteBunnyStorageFile(thumbnailpath);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (thumbnaillocalfile) {
      try {
        await fs2.unlink(path.join("uploads", thumbnaillocalfile));
      } catch (err) {
        console.warn(" Failed to delete thumbnail:", err.message);
      }
    }
  }
};

// Delete course
export const deleteUser = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid Shopify session.",
      });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found for this shop.",
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    //  Check if the user belongs to the current merchant
    if (user.merchantId !== merchant.id) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access to this user.",
      });
    }

    // Delete Shopify customer if present
    if (user.shopifyCustomerId) {
      const shopifyRes = await fetch(
        `https://${shopDomain}/admin/api/2023-10/customers/${user.shopifyCustomerId}.json`,
        {
          method: "DELETE",
          headers: {
            "X-Shopify-Access-Token": merchant.shopifyAccessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!shopifyRes.ok) {
        const shopifyData = await shopifyRes.json();
        return res.status(500).json({
          success: false,
          error: "Failed to delete Shopify customer",
          details: shopifyData,
        });
      }
    }

    // Delete from local DB
    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User and linked Shopify customer deleted.",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Export courses to CSV
export const exportCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: Module,
          as: "modules",
          include: [
            {
              model: Lesson,
              as: "lessons",
              include: [
                {
                  model: File,
                  as: "files",
                },
              ],
            },
          ],
        },
      ],
    });

    const csvWriter = createObjectCsvWriter({
      path: path.join(__dirname, "../exports/courses.csv"),
      header: [
        { id: "title", title: "Title" },
        { id: "description", title: "Description" },
        { id: "shopifyProductId", title: "Shopify Product ID" },
        { id: "price", title: "Price" },
        { id: "status", title: "Status" },
        { id: "modules", title: "Modules" },
        { id: "lessons", title: "Lessons" },
        { id: "files", title: "Files" },
      ],
    });

    const records = courses.map((course) => ({
      title: course.title,
      description: course.description,
      shopifyProductId: course.shopifyProductId,
      price: course.price,
      status: course.status,
      modules: course.modules.length,
      lessons: course.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      ),
      files: course.modules.reduce(
        (acc, module) =>
          acc +
          module.lessons.reduce(
            (acc2, lesson) => acc2 + lesson.files.length,
            0
          ),
        0
      ),
    }));

    await csvWriter.writeRecords(records);

    res.download(path.join(__dirname, "../exports/courses.csv"));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Import courses from CSV

// Controller
export const uploadCoursesFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "CSV file is required" });
    }

    const filePath = req.file.path;
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      fs.unlinkSync(filePath);
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid Shopify session." });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      fs.unlinkSync(filePath);
      return res
        .status(404)
        .json({ error: "Merchant not found for this shop." });
    }

    const accessToken = merchant.shopifyAccessToken;
    const merchantId = merchant.id;

    const courseList = await csv().fromFile(filePath);
    console.log("courseList", courseList);

    const createdCourses = [];

    for (const course of courseList) {
      const { title, description, thumbnail, price } = course;

      const productPayload = {
        product: {
          title,
          body_html: description,
          images: thumbnail ? [{ src: thumbnail }] : [],
          variants: [
            {
              price: price || "0.00",
              inventory_management: "shopify",
              inventory_policy: "deny",
              fulfillment_service: "manual",
              requires_shipping: false,
            },
          ],
        },
      };

      const shopifyRes = await fetch(
        `https://${shopDomain}/admin/api/2023-10/products.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productPayload),
        }
      );

      const shopifyData = await shopifyRes.json();
      if (!shopifyRes.ok || !shopifyData.product) continue;

      const savedCourse = await Course.create({
        title,
        description,
        thumbnail,
        price,
        shopifyProductId: shopifyData.product.id,
        shopifyHandle: shopifyData.product.handle,
        merchantId,
      });

      createdCourses.push(savedCourse);
    }

    fs.unlinkSync(filePath); // cleanup

    res.status(201).json({
      success: true,
      message: `${createdCourses.length} courses created successfully.`,
      data: createdCourses,
    });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error("Bulk upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get course statistics
export const getCourseStats = async (req, res) => {
  try {
    const courseId = req.params.id;

    const [totalStudents, totalProgress, totalFiles, totalDuration] =
      await Promise.all([
        CourseAccess.count({ where: { courseId } }),
        Progress.count({ where: { courseId } }),
        File.count({ where: { courseId } }),
        Lesson.sum("duration", { where: { courseId } }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalProgress,
        totalFiles,
        totalDuration: totalDuration || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//  get course Details

export const getCourseDetails = async (req, res) => {
  try {
    // console.log("course id",req.params.id);

    const course = await Course.findByPk(req.params.id, {
      attributes: ["id", "title", "description", "price", "thumbnail"], // Course fields
      include: [
        {
          model: Module,
          as: "modules",
          attributes: ["id", "title", "description", "order"],
          include: [
            {
              model: Lesson,
              as: "lessons",
              attributes: ["id", "title", "description", "order"],
              separate: true, // Ensures ordering works properly on nested includes
              order: [["order", "ASC"]],
            },
          ],
          separate: true, // Optional but recommended if you want proper ordering
          order: [["order", "ASC"]],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete Course
export const deleteCourse = async (req, res) => {
  console.log("runing");

  const session = res.locals.shopify?.session || req.session;
  let shopDomain;
  if (process.env.NODE_ENV_ENV === "development") {
    shopDomain = process.env.TEST_DOMAIN;
  } else if (session && session.shop) {
    shopDomain = session.shop;
  } else {
    return res
      .status(401)
      .json({ error: "Unauthorized: No valid Shopify session." });
  }
  const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
  // console.log("merchant", merchant);

  if (!merchant) {
    return res.status(404).json({ error: "Merchant not found for this shop." });
  }
  const accessToken = merchant.shopifyAccessToken;
  // console.log("accessToken", accessToken);

  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }
    // console.log("course", course);

    // Delete Shopify product
    if (course.shopifyProductId) {
      console.log("runing2");

      const shopifyRes = await fetch(
        `https://${shopDomain}/admin/api/2023-10/products/${course.shopifyProductId}.json`,
        {
          method: "DELETE",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!shopifyRes.ok) {
        const shopifyData = await shopifyRes.json();
        return res.status(500).json({
          success: false,
          error: "Failed to delete Shopify product",
          details: shopifyData,
        });
      }
    }

    let response = await deleteBunnyStorageFile(
      course?.thumbnailDestinationPath
    );

    await course.destroy();

    res.status(200).json({
      success: true,
      message: "Course and linked Shopify product deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    console.log("final");
  }
};
export const GetMerchantDetails = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;
    if (process.env.NODE_ENV_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
      console.log(shopDomain, "shopDomain");
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid Shopify session." });
    }

    const merchant = await Merchant.findOne({
      where: { shop: shopDomain },
    });

    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Download all Course Content
export const DownloadCourseContent = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid Shopify session.",
      });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found for this shop.",
      });
    }
    const course = await Course.findOne({
      where: {
        id: req.params.id,
        merchantId: merchant?.id,
      },

      attributes: ["title", "thumbnail"], // Course fields
      include: [
        {
          model: Module,
          as: "modules",
          attributes: ["id", "title", "order", "totalLessons"],
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
        },
      ],
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
