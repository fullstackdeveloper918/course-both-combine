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
  deleteStreamCollection,
  deleteBunnyStorageFile,
  uploadToBunnyStorage,
  updateCollectionName,
  deleteBunnyVideo,
} from "../utils/bunnyUtilis.js";
import { getBunnyPublicUrl } from "./lessonController.js";
import { ApiError, SuccessResponse } from "../utils/ApiUtilis.js";
// import { where } from "sequelize";
import axios from "axios";
import sequelize from "../config/database.js";
// import { sendMail } from "../utils/mailSender.js";
// Create a new course
const StreamApiKEY = process.env.STREAM_API_KEY;
const StreamSecureTokenApi = process.env.STREAM_SECURE_TOKEN_KEY;
const LibId = process.env.STREAM_LIB_ID;

// create a new course
export const createCourse = async (req, res, next) => {
  //  creating a global variable for this function
  let thumbnailpath = "";
  let thumbnaillocalfile = "";
  let shopify_Product_Id = "";
  let bunny_collection_id = "";
  let db_course_id = "";
  let accessToken = "";
  let merchantdetails;
  const session = res.locals.shopify?.session || req.session;
  console.log("session", session);

  let shopDomain = session.shop;

  try {
    if (!shopDomain) throw new ApiError("No Shop Domain found.", 401);

    // getting the thumbnail file
    let thumbnail = req.file;
    let thumbnailUrl = "";
    if (!thumbnail) {
      throw new ApiError("Thumbnail is required", 422);
    }
    thumbnaillocalfile = thumbnail.filename;

    // Checking the merchant is available or not
    const merchant = await Merchant.findOne({
      where: { shop: shopDomain },
    });

    if (!merchant) {
      throw new ApiError("Merchant not found for this shop.", 404);
    }

    const merchantId = merchant.id;
    merchantdetails = merchant;
    accessToken = merchant.shopifyAccessToken;
    console.log("accessToken", accessToken);

    // getting the course details
    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      throw new ApiError("All fields Are Required", 422);
    }

    // Sanitize the filename
    const sanitizedFilename = thumbnail.originalname.replace(/\s+/g, "-");
    const extension = path.extname(sanitizedFilename);
    const baseName = path.basename(sanitizedFilename, extension);
    const uniqueFilename = `${baseName}-${Date.now()}${extension}`;

    // Final destination
    const destination = `Coursethumbnails/${uniqueFilename}`;

    // Upload to Bunny
    const result = await uploadToBunnyStorage(thumbnail.filename, destination);
    if (!result.success) {
      throw new ApiError(`thumbnail upload failed ->${result.error}`, 422);
    }
    thumbnailpath = destination;

    // getting the thumbnail url
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

    if (!shopifyRes.ok || !shopifyData.product) {
      throw new ApiError("Failed to create Shopify product", 500);
    }
    // getting the shopify product id
    const shopifyProductId = shopifyData.product.id;
    shopify_Product_Id = shopifyData.product.id;
    const shopifyHandle = shopifyData.product.handle;

    // Creating A Collection of the course
    let collectionId = await createCollection({
      LibraryId: merchant?.StreamLibraryId || LibId,
      apiKey: merchant?.StreamApiKEY || StreamApiKEY,
      name: slug(title),
    });
    bunny_collection_id = collectionId?.guid;

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
      collectionid: collectionId?.guid,
      // thumbnailprovider: "bunny",
    });

    db_course_id = course.id;

    // return the response
    res.status(201).json({
      success: true,
      data: { course, shopifyProduct: shopifyData.product },
    });
  } catch (error) {
    // delete the thumbnail from Bunny Storage
    if (thumbnailpath) {
      await deleteBunnyStorageFile(thumbnailpath);
    }

    // delete the shopify product
    if (shopify_Product_Id) {
      await deleteShopifyProduct(shopDomain, accessToken, shopify_Product_Id);
    }

    // delete the course collection
    if (bunny_collection_id) {
      await deleteStreamCollection({
        LibraryId: merchantdetails?.StreamLibraryId || LibId,
        collectionId: bunny_collection_id,
        apiKey: merchantdetails?.StreamApiKEY || StreamApiKEY,
      });
    }
    if (db_course_id) {
      try {
        await Course.destroy({ where: { id: db_course_id } });
      } catch (error) {
        console.warn(" Failed to delete course from the DB", error.message);
      }
    }

    return next(
      new ApiError(
        error?.message || "Something went wrong",
        error?.status || 500
      )
    );
  } finally {
    if (thumbnaillocalfile) {
      try {
        await fs2.unlink(path.join("uploads", thumbnaillocalfile));
      } catch (err) {
        console.warn(" Failed to delete thumbnail from the local", err.message);
      }
    }
  }
};

// Get all courses
export const getCourses = async (req, res, next) => {
  try {
    console.log("runi");

    const session = res.locals.shopify?.session || req.session;
    console.log("session123", session);

    let shopDomain = session.shop;

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

// Update the course
export const updateCourse = async (req, res) => {
  let thumbnailpath = "";
  let thumbnaillocalfile = "";
  let transaction;
  let iscollectionUpdated = false;
  let collection_Id = "";
  let collectionName = "";
  let merchant;

  const session = res.locals.shopify?.session || req.session;
  let shopDomain;
  try {
    if (req?.file) {
      let thumbnail = req.file;
      thumbnaillocalfile = thumbnail.filename;
    }

    shopDomain = session.shop;
    if (!shopDomain) throw new ApiError("No shop domain found.", 401);

    merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) throw new ApiError("Merchant not found for this shop.", 404);
    const accessToken = merchant.shopifyAccessToken;

    // find the course
    const course = await Course.findByPk(req.params.id);
    if (!course) throw new ApiError("Course not found.", 404);

    const { title, description, price, status = "active" } = req.body;
    if (!["active", "draft"].includes(status)) {
      throw new ApiError("Invalid status value", 400);
    }

    if (!title || !description || !price || !status) {
      throw new ApiError("All fields required in body.", 400);
    }

    // store the previous collection name
    collectionName = slug(course?.title);
    let thumbnailUrl = null;
    let destinationPath = null;

    // check if the thumbnail is uploaded
    let curntSyncTime = new Date().toISOString();

    if (req?.file) {
      let thumbnail = req.file;
      if (thumbnail) {
        // thumbnaillocalfile = thumbnail.filename;
        const sanitizedFilename = thumbnail.originalname.replace(/\s+/g, "-");
        const extension = path.extname(sanitizedFilename);
        const baseName = path.basename(sanitizedFilename, extension);
        const uniqueFilename = `${baseName}-${Date.now()}${extension}`;

        // Final destination
        const destination = `Coursethumbnails/${uniqueFilename}`;

        // Upload the thumbnail to Bunny Storage
        const result = await uploadToBunnyStorage(
          thumbnail.filename,
          destination
        );
        if (!result.success) {
          throw new ApiError("Failed to upload thumbnail.", 422);
        }
        console.log("thumbnail uploaded successfully");

        destinationPath = destination;
        thumbnailpath = destination;
        thumbnailUrl = getBunnyPublicUrl(destination); // make sure this returns a valid URL
      }
    }

    let prevoiusDestinationPath = course?.thumbnailDestinationPath;
    let previousThumbnailUrl = course?.thumbnail;
    // let thumbnailprovider = course?.thumbnailprovider;

    // 🚀 Start a transaction
    transaction = await sequelize.transaction();

    // Update the course
    await course.update(
      {
        title,
        description,
        thumbnail: thumbnailUrl ? thumbnailUrl : course?.thumbnail,
        thumbnailDestinationPath: destinationPath
          ? destinationPath
          : course.thumbnailDestinationPath,
        price,
        status,
        sync_updated_at: curntSyncTime,
        // thumbnailprovider: thumbnailUrl ? "bunny" : course?.thumbnailprovider,
      },
      {
        transaction,
      }
    );

    // Update the bunny collection name
    let collectionUpdateResponse = await updateCollectionName({
      LibraryId: merchant?.StreamLibraryId || LibId,
      collectionId: course.collectionid,
      newName: slug(title),
      apiKey: merchant?.StreamApiKEY || StreamApiKEY,
    });

    if (!collectionUpdateResponse.success) {
      console.warn("❌ Failed to update collection name in the transaction");
      throw new ApiError(collectionUpdateResponse.error, 422);
    }
    // Updated the iscollectionUpdated to true
    collection_Id = course.collectionid;
    iscollectionUpdated = true;

    // Update Shopify product

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
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        error: "Failed to update Shopify product",
        details: shopifyData,
      });
    }

    // 2️⃣ Add a custom updatedAt metafield
    const metafieldPayload = {
      metafield: {
        namespace: "custom", // your grouping
        key: "sync_updated_at", // your custom field name
        value: curntSyncTime, // your timestamp
        type: "single_line_text_field", // or "date" if you prefer
      },
    };

    await fetch(
      `https://${shopDomain}/admin/api/2023-10/products/${course.shopifyProductId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metafieldPayload),
      }
    );

    // 🚀 Commit transaction if everything passed
    await transaction.commit();

    // Delete the previous thumbnail from Bunny Storage if The thumbnail is updated
    if (
      previousThumbnailUrl.startsWith(
        `https://${process.env.BUNNY_STORAGE_ZONE_NAME}`
      ) &&
      thumbnailUrl
    ) {
      await deleteBunnyStorageFile(prevoiusDestinationPath);
    }

    // return the response
    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    // 🚨 Rollback transaction if error
    if (transaction) await transaction.rollback();
    // delete the thumbnail from Bunny Storage
    if (thumbnailpath) {
      await deleteBunnyStorageFile(thumbnailpath);
    }
    // Update the buuny collecton to previous name
    if (iscollectionUpdated) {
      let updateResponse = await updateCollectionName({
        LibraryId: merchant?.StreamLibraryId || LibId,
        collectionId: collection_Id,
        newName: collectionName,
        apiKey: merchant?.StreamApiKEY || StreamApiKEY,
      });
      if (!updateResponse.success) {
        throw new ApiError(
          "Failed to update collection name to previous name in the transaction Failed ",
          422
        );
      }
    }

    // return the error
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (thumbnaillocalfile) {
      try {
        await fs2.unlink(path.join("uploads", thumbnaillocalfile));
      } catch (err) {
        console.warn(
          " Failed to delete thumbnail from the local folder",
          err?.message
        );
      }
    }
  }
};

// Delete course
export const deleteUser = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;

    let shopDomain = session.shop;
    if (!shopDomain)
      throw new ApiError("Unauthorized: No valid Shopify session.", 401);

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

// Check if the image exists
const checkImageExists = async (url) => {
  try {
    const res = await fetch(url, { method: "HEAD" });

    return res.ok && res.headers.get("content-type")?.startsWith("image/");
  } catch (err) {
    return false;
  }
};

// Upload courses from CSV
// export const uploadCoursesFromCSV = async (req, res) => {
//   let filePath;
//   try {
//     if (!req.file) throw new ApiError("CSV file is required", 400);

//     filePath = req.file.path;
//     const session = res.locals.shopify?.session || req.session;
//     let shopDomain;

//     if (process.env.NODE_ENV_ENV === "development") {
//       shopDomain = process.env.TEST_DOMAIN;
//     } else if (session && session.shop) {
//       shopDomain = session.shop;
//     } else {
//       return res
//         .status(401)
//         .json({ error: "Unauthorized: No valid Shopify session." });
//     }

//     const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
//     if (!merchant) throw new ApiError("Merchant not found for this shop.", 404);

//     const accessToken = merchant.shopifyAccessToken;
//     const merchantId = merchant.id;

//     const courseList = await csv().fromFile(filePath);

//     const createdCourses = [];
//     const faildprocess = [];
//     for (const course of courseList) {
//       let productid;
//       let collection_Id;
//       try {
//         let { title, description, thumbnail, price } = course;

//         title = title ? title?.trim() : "Default Title";
//         description = description ? description?.trim() : "Default Description";
//         // thumbnail = thumbnail ? thumbnail : process.env.DEFAULT_THUMBNAIL;
//         price = price ? price?.trim() : "0.00";

//         if (thumbnail) {
//           let isvalid = await checkImageExists(thumbnail);
//           if (isvalid) {
//             thumbnail = thumbnail;
//           } else {
//             thumbnail = process.env.DEFAULT_THUMBNAIL;
//           }
//         } else {
//           thumbnail = process.env.DEFAULT_THUMBNAIL;
//         }

//         // Shopify Product Creation
//         const productPayload = {
//           product: {
//             title,
//             body_html: description,
//             images: thumbnail ? [{ src: thumbnail }] : [],
//             variants: [
//               {
//                 price: price || "0.00",
//                 inventory_management: "shopify",
//                 inventory_policy: "deny",
//                 fulfillment_service: "manual",
//                 requires_shipping: false,
//               },
//             ],
//           },
//         };

//         const shopifyRes = await fetch(
//           `https://${shopDomain}/admin/api/2023-10/products.json`,
//           {
//             method: "POST",
//             headers: {
//               "X-Shopify-Access-Token": accessToken,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(productPayload),
//           }
//         );

//         const shopifyData = await shopifyRes.json();
//         if (!shopifyRes.ok || !shopifyData.product) {
//           console.warn(
//             "Failed to create Shopify product with csv",
//             shopifyData
//           );
//           throw new ApiError("Failed creation of Shopify product", 500);
//         }
//         // get product id
//         productid = shopifyData.product.id;

//         // Creating A Collection of the course
//         let collectionId = await createCollection({
//           LibraryId: merchant?.StreamLibraryId || LibId,
//           apiKey: merchant?.StreamApiKEY || StreamApiKEY,
//           name: slug(title),
//         });

//         collection_Id = collectionId?.guid;

//         // create a course in the database
//         const savedCourse = await Course.create({
//           title,
//           description,
//           thumbnail,
//           price,
//           collectionid: collectionId?.guid,
//           shopifyProductId: shopifyData.product.id,
//           shopifyHandle: shopifyData.product.handle,
//           merchantId,
//         });

//         createdCourses.push(savedCourse);
//       } catch (error) {
//         faildprocess.push(course);
//         // Deleted the  shopify product if created
//         if (productid) {
//           await deleteShopifyProduct(shopDomain, accessToken, productid);
//         }
//         // delete the collection if created
//         if (collection_Id) {
//           await deleteStreamCollection({
//             LibraryId: merchant?.StreamLibraryId || LibId,
//             collectionId: collection_Id,
//             apiKey: merchant?.StreamApiKEY || StreamApiKEY,
//           });
//         }

//         console.error("Failed to create course:", error?.message);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Courses uploaded processing start",
//       createdCourses,
//       faildprocess,
//     });
//     // Send the email to client
//     // await sendMail({
//     //   // to: process.env.APP_EMAIL,
//     //   to: "lovepreetsin9292@gmail.com",
//     //   subject: "Course Upload",
//     //   text: `The Course Upload is completed . The Successfully Completed Courser is ${createdCourses?.length} Courses and the Failed   Courses Process is ${faildprocess.length} Courses`,
//     // });
//   } catch (error) {
//     console.error("Bulk upload error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   } finally {
//     if (filePath) {
//       try {
//         await fs2.unlink(filePath);
//       } catch (err) {
//         console.warn(" Failed to delete thumbnail from the local", err.message);
//       }
//     }
//   }
// };

export const uploadCoursesFromCSV = async (req, res) => {
  let filePath;

  try {
    if (!req.file) throw new ApiError("CSV file is required", 400);

    filePath = req.file.path;
    const session = res.locals.shopify?.session || req.session;

    console.log("session123", session);

    let shopDomain = session.shop;

    if (!shopDomain)
      throw new ApiError("Unauthorized: No valid Shopify session.", 401);

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) throw new ApiError("Merchant not found for this shop.", 404);

    const accessToken = merchant.shopifyAccessToken;
    const merchantId = merchant.id;

    let courseList;
    try {
      courseList = await csv().fromFile(filePath);
    } catch (csvErr) {
      throw new ApiError("Invalid CSV format", 400);
    }

    res.status(200).json({
      success: true,
      message: "CSV file uploaded Processing is start",
      courseList,
    });

    console.log("courseList", courseList);

    // Group CSV data by course name
    const groupedCourses = {};
    for (const row of courseList) {
      const courseName = row.CourseName?.trim();
      if (!courseName) continue;

      if (!groupedCourses[courseName]) {
        groupedCourses[courseName] = {
          courseData: {
            title: courseName,
            description: row.CourseDescription?.trim() || "Default Description",
            thumbnail: row.CourseThumbnail?.trim(),
            price: row.CoursePrice?.trim() || "0.00",
          },
          modules: {},
        };
      }

      const moduleName = row.ModuleName?.trim();
      if (!moduleName) continue;

      if (!groupedCourses[courseName].modules[moduleName]) {
        groupedCourses[courseName].modules[moduleName] = {
          moduleData: {
            title: moduleName,
            description: row.ModuleDescription?.trim() || "",
          },
          lessons: [],
        };
      }

      // Add lesson if it has required data
      if (row.LessonName?.trim() && row.LessonOrder) {
        groupedCourses[courseName].modules[moduleName].lessons.push({
          order: parseInt(row.LessonOrder),
          title: row.LessonName?.trim(),
          videoUrl: row.LessonVideoURL?.trim(),
          helperFiles: row.LessonHelperFiles?.trim() || "",
        });
      }
    }

    console.log("groupedCourses", groupedCourses);

    const createdCourses = [];
    const failedCourses = [];

    // Process each course
    for (const [courseName, courseGroup] of Object.entries(groupedCourses)) {
      let productid;
      let collection_Id;
      let thumbnailurl = null;
      let thumbnailDestinationPath = null;
      let createdCourseId = null;
      let createdModuleIds = [];
      let createdLessonIds = [];
      let createdFileIds = [];
      let transaction;

      try {
        const { title, description, thumbnail, price } = courseGroup.courseData;
        console.log("Course Data");
        console.log("title", title);
        console.log("description", description);
        console.log("thumbnail", thumbnail);
        console.log("price", price);

        // Check if course already exists by title for this merchant
        const existingCourse = await Course.findOne({
          where: {
            title: title,
            merchantId: merchantId,
          },
        });

        if (existingCourse) {
          console.log(
            `Course "${title}" already exists for this merchant, skipping...`
          );
          failedCourses.push({
            courseName,
            error: "Course with this title already exists for this merchant",
          });
          continue;
        }

        // Upload course thumbnail to Bunny if provided (outside transaction)
        if (thumbnail) {
          try {
            // Validate URL first
            const urlTest = await fetch(thumbnail, { method: "HEAD" });
            if (!urlTest.ok) {
              console.warn(`Course thumbnail URL not accessible: ${thumbnail}`);
            } else {
              thumbnailDestinationPath = `Coursethumbnails/${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.webp`;
              let resdata = await uploadRemoteThumbnailToBunny({
                sourceUrl: thumbnail,
                storageZone:
                  merchant?.BUNNY_STORAGE_ZONE_NAME ||
                  process.env.BUNNY_STORAGE_ZONE_NAME,
                accessKey:
                  merchant?.BUNNY_STORAGE_KEY || process.env.BUNNY_STORAGE_KEY,
                destinationPath: thumbnailDestinationPath,
                cdnHostname:
                  merchant?.PUBLIC_CDN_URL || process.env.PUBLIC_CDN_URL,
              });
              thumbnailurl = resdata?.cdnUrl;
              console.log(` Thumbnail uploaded successfully: ${thumbnailurl}`);
            }
          } catch (error) {
            console.warn("Failed to upload course thumbnail to Bunny", error);
          }
        } else {
          console.log(` No thumbnail provided for course: ${title}`);
        }

        // Shopify Product Creation (outside transaction)
        const productPayload = {
          product: {
            title,
            body_html: description,
            images: thumbnailurl ? [{ src: thumbnailurl }] : [],
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
        if (!shopifyRes.ok || !shopifyData.product) {
          throw new ApiError("Failed to create Shopify product", 500);
        }

        productid = shopifyData.product.id;
        console.log(
          `🛍️ Shopify product created successfully: ${title} (ID: ${productid})`
        );

        // Creating A Collection for the course
        let collectionId = await createCollection({
          LibraryId: merchant?.StreamLibraryId || LibId,
          apiKey: merchant?.StreamApiKEY || StreamApiKEY,
          name: slug(title),
        });

        collection_Id = collectionId?.guid;
        console.log(
          `📚 Bunny collection created successfully: ${collection_Id}`
        );

        // Create course in the database
        const savedCourse = await Course.create({
          title,
          description,
          thumbnail: thumbnailurl,
          thumbnailDestinationPath: thumbnailurl
            ? thumbnailDestinationPath
            : null,
          price,
          collectionid: collectionId?.guid,
          shopifyProductId: shopifyData.product.id,
          shopifyHandle: shopifyData.product.handle,
          merchantId,
        });

        createdCourseId = savedCourse.id;
        console.log(
          `✅ Course created successfully in database: ${title} (ID: ${createdCourseId})`
        );

        // Process modules and lessons
        let moduleOrder = 1;
        for (const [moduleName, moduleGroup] of Object.entries(
          courseGroup.modules
        )) {
          // Create module

          console.log("module Details");
          console.log("moduleName", moduleName);
          console.log("moduleGroup", moduleGroup);

          const savedModule = await Module.create({
            title: moduleGroup.moduleData.title,
            description: moduleGroup.moduleData.description,
            order: moduleOrder++,
            courseId: savedCourse.id,
          });

          console.log("Module created Succsufly");

          createdModuleIds.push(savedModule.id);

          // Sort lessons by order
          const sortedLessons = moduleGroup.lessons.sort(
            (a, b) => a.order - b.order
          );

          for (const lessonData of sortedLessons) {
            let videoId = null;
            let videoUrl = null;
            let videoDestinationPath = null;

            console.log("Lesson Details");
            console.log("lessonData", lessonData);

            // Upload video to Bunny if URL provided
            if (lessonData.videoUrl) {
              try {
                const videoUploadResult = await uploadRemoteVideoToBunny({
                  sourceUrl: lessonData.videoUrl,
                  storageZone:
                    merchant?.BUNNY_STORAGE_ZONE_NAME ||
                    process.env.BUNNY_STORAGE_ZONE_NAME,
                  accessKey:
                    merchant?.BUNNY_STORAGE_KEY ||
                    process.env.BUNNY_STORAGE_KEY,
                  collectionId: collection_Id,
                  merchant,
                  lessonTitle: lessonData.title,
                });

                if (videoUploadResult.success) {
                  videoId = videoUploadResult.videoId;
                  console.log(
                    `🎥 Video uploaded successfully for lesson "${lessonData.title}": ${videoId}`
                  );
                } else {
                  console.warn(
                    `❌ Failed to upload video for lesson "${lessonData.title}": ${videoUploadResult.error}`
                  );
                }
              } catch (error) {
                console.warn(
                  `Failed to upload video for lesson ${lessonData.title}:`,
                  error
                );
              }
            }

            // Create lesson
            const savedLesson = await Lesson.create({
              title: lessonData.title,
              description: `Lesson ${lessonData.order}: ${lessonData.title}`,
              order: lessonData.order,
              moduleId: savedModule.id,
              courseId: savedCourse.id,
              merchantId,
              videoId: videoId,
              status: "published",
              libaryId: merchant?.StreamLibraryId || LibId,
            });

            createdLessonIds.push(savedLesson.id);

            // Process helper files if provided
            if (lessonData.helperFiles) {
              const fileUrls = lessonData.helperFiles
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url);

              for (const fileUrl of fileUrls) {
                try {
                  // Validate URL accessibility first
                  const urlTest = await fetch(fileUrl, {
                    method: "HEAD",
                    timeout: 10000, // 10 second timeout
                  });

                  if (!urlTest.ok) {
                    console.warn(
                      `Helper file URL not accessible: ${fileUrl} (Status: ${urlTest.status})`
                    );
                    continue; // Skip this file but continue with others
                  }

                  // Check file size before downloading
                  const contentLength = urlTest.headers.get("content-length");
                  const fileSize = contentLength ? parseInt(contentLength) : 0;
                  const maxSize = 100 * 1024 * 1024; // 100MB

                  if (fileSize > maxSize) {
                    console.warn(
                      `Helper file too large: ${fileUrl} (${fileSize} bytes > ${maxSize} bytes)`
                    );
                    continue;
                  }

                  const fileUploadResult = await uploadRemoteFileToBunny({
                    sourceUrl: fileUrl,
                    storageZone:
                      merchant?.BUNNY_STORAGE_ZONE_NAME ||
                      process.env.BUNNY_STORAGE_ZONE_NAME,
                    accessKey:
                      merchant?.BUNNY_STORAGE_KEY ||
                      process.env.BUNNY_STORAGE_KEY,
                    merchant,
                    fileName: fileUrl.split("/").pop() || "file",
                  });

                  if (fileUploadResult.success) {
                    const savedFile = await File.create({
                      name: fileUploadResult.fileName,
                      type: fileUploadResult.fileType,
                      url: fileUploadResult.cdnUrl,
                      size: fileUploadResult.fileSize,
                      mimeType: fileUploadResult.mimeType,
                      lessonId: savedLesson.id,
                      courseId: savedCourse.id,
                      storageProvider: "bunny",
                      destinationPath: fileUploadResult.destinationPath,
                    });

                    createdFileIds.push(savedFile.id);
                    console.log(
                      `📎 Helper file uploaded successfully: ${fileUploadResult.fileName} (${fileUploadResult.fileSize} bytes)`
                    );
                  } else {
                    console.warn(
                      `❌ Failed to upload helper file ${fileUrl}: ${fileUploadResult.error}`
                    );
                  }
                } catch (error) {
                  console.warn(
                    `Failed to process helper file ${fileUrl}:`,
                    error.message
                  );
                  // Continue with other files even if one fails
                }
              }
            }
          }
        }

        createdCourses.push({
          course: savedCourse,
          modulesCount: Object.keys(courseGroup.modules).length,
          lessonsCount: Object.values(courseGroup.modules).reduce(
            (acc, module) => acc + module.lessons.length,
            0
          ),
        });
      } catch (error) {
        // Cleanup created resources
        await cleanupCreatedResources({
          productid,
          collection_Id,
          thumbnailDestinationPath,
          createdCourseId,
          createdModuleIds,
          createdLessonIds,
          createdFileIds,
          shopDomain,
          accessToken,
          merchant,
        });

        failedCourses.push({
          courseName,
          error: error.message,
        });

        console.error(`Failed to create course ${courseName}:`, error?.message);
      }
    }

    // return res.status(200).json({
    //   success: true,
    //   message: `Processed CSV: ${createdCourses.length} courses created successfully, ${failedCourses.length} courses failed.`,
    //   createdCourses,
    //   failedCourses,
    // });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Delete uploaded CSV file
    if (filePath) {
      try {
        await fs2.unlink(filePath);
      } catch (err) {
        console.warn(
          "Failed to delete CSV file from local storage",
          err.message
        );
      }
    }
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
  const session = res.locals.shopify?.session || req.session;
  const shopDomain = session.shop;
  const courseId = req.params.id;

  console.log("delete course running");

  if (!shopDomain) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthorized: No valid shop domain." });
  }

  if (!courseId) {
    return res
      .status(400)
      .json({ success: false, error: "Bad Request: Missing course ID." });
  }

  try {
    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found." });
    }

    const accessToken = merchant.shopifyAccessToken;
    const course = await Course.findOne({
      where: { id: courseId, merchantId: merchant.id },
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found for this merchant." });
    }

    // Delete Shopify product
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
        error: "Failed to delete Shopify product.",
        details: shopifyData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleting course successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const GetMerchantDetails = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;

    let shopDomain = session.shop;

    if (!shopDomain)
      throw new ApiError("Unauthorized: No valid Shopify session.", 401);

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

//   Deleted the Shopify Product

export const deleteShopifyProduct = async (
  storeDomain,
  accessToken,
  productId
) => {
  try {
    const url = `https://${storeDomain}/admin/api/2023-10/products/${productId}.json`;

    const response = await axios.delete(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (response.status === 200) {
      return true;
    } else {
      console.log("Unexpected response from Shopify", response?.status);
      return false;
    }
  } catch (error) {
    console.error("Error while deleting Shopify product:", error?.message);
    return false;
  }
};

async function uploadRemoteThumbnailToBunny({
  sourceUrl,
  storageZone,
  accessKey,
  destinationPath,
  cdnHostname,
  maxFileSizeBytes = 10 * 1024 * 1024, // 10MB safeguard for thumbnails
  maxRetries = 3,
  timeoutMs = 15000, // 15s timeout
}) {
  if (
    !sourceUrl ||
    !storageZone ||
    !accessKey ||
    !destinationPath ||
    !cdnHostname
  ) {
    throw new Error("Missing required Bunny Storage params");
  }

  // Helper: delay for retries
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // Helper: fetch with timeout
  async function fetchWithTimeout(url, options = {}, timeout = timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // 1) Fetch remote file with retries
  let imgRes;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      imgRes = await fetchWithTimeout(sourceUrl);
      if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);
      break; // success
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to fetch source thumbnail after ${maxRetries} attempts: ${err.message}`
        );
      }
      await delay(500 * attempt); // exponential backoff
    }
  }

  // 2) Enforce max size
  const contentLength = parseInt(
    imgRes.headers.get("content-length") || "0",
    10
  );
  if (contentLength && contentLength > maxFileSizeBytes) {
    throw new Error(
      `Source file too large (${contentLength} bytes, limit ${maxFileSizeBytes})`
    );
  }

  const body = Buffer.from(await imgRes.arrayBuffer());
  if (body.length > maxFileSizeBytes) {
    throw new Error(
      `Source file exceeded max size after download (${body.length} bytes)`
    );
  }

  const contentType =
    imgRes.headers.get("content-type") || "application/octet-stream";

  // 3) PUT to Bunny Storage with retries
  const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${destinationPath.replace(
    /^\/+/,
    ""
  )}`;
  let putRes;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      putRes = await fetchWithTimeout(uploadUrl, {
        method: "PUT",
        headers: {
          AccessKey: accessKey,
          "Content-Type": contentType,
        },
        body,
      });
      if (putRes.ok && putRes.status === 201) break; // success
      const t = await putRes.text().catch(() => "");
      throw new Error(
        `Upload failed: ${putRes.status} ${putRes.statusText} ${t}`
      );
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(
          `Bunny upload failed after ${maxRetries} attempts [${sourceUrl} -> ${destinationPath}]: ${err.message}`
        );
      }
      await delay(1000 * attempt); // backoff
    }
  }

  // 4) Return CDN URL
  return {
    success: true,
    cdnUrl: `${cdnHostname}/${destinationPath}`,

    // cdnUrl: `https://${cdnHostname}/${destinationPath.replace(/^\/+/, "")}`,
  };
}

// Function to upload remote video to Bunny CDN
async function uploadRemoteVideoToBunny({
  sourceUrl,
  storageZone,
  accessKey,
  collectionId,
  merchant,
  lessonTitle,
  maxFileSizeBytes = 2 * 1024 * 1024 * 1024, // 2GB safeguard for videos
  maxRetries = 3,
}) {
  if (!sourceUrl || !storageZone || !accessKey || !collectionId) {
    throw new Error("Missing required Bunny Video params");
  }

  try {
    // Helper: delay for retries
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // Helper: fetch without timeout for large videos
    async function fetchWithoutTimeout(url, options = {}) {
      return await fetch(url, options);
    }

    // 1) Fetch remote video file with retries
    let videoRes;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        videoRes = await fetchWithoutTimeout(sourceUrl);
        if (!videoRes.ok) throw new Error(`Fetch failed: ${videoRes.status}`);
        break; // success
      } catch (err) {
        // Handle network errors specifically for source video fetch
        if (
          err.name === "NetworkError" ||
          err.message.includes("network") ||
          err.message.includes("fetch")
        ) {
          console.log(
            `Source video fetch attempt ${attempt} failed due to network error, retrying...`
          );
          if (attempt === maxRetries) {
            throw new Error(
              `Failed to fetch source video after ${maxRetries} attempts due to network issues. The source URL may be unreachable or your internet connection unstable.`
            );
          }
          continue; // Retry on network errors
        }
        await delay(1000 * attempt); // exponential backoff
      }
    }

    // 2) Enforce max size
    const contentLength = parseInt(
      videoRes.headers.get("content-length") || "0",
      10
    );
    if (contentLength && contentLength > maxFileSizeBytes) {
      throw new Error(
        `Source video too large (${contentLength} bytes, limit ${maxFileSizeBytes})`
      );
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    if (videoBuffer.length > maxFileSizeBytes) {
      throw new Error(
        `Source video exceeded max size after download (${videoBuffer.length} bytes)`
      );
    }

    // 3) Create video record in Bunny Stream
    const libraryId = merchant?.StreamLibraryId || LibId;
    const apiKey = merchant?.StreamApiKEY || StreamApiKEY;

    const videoPayload = {
      title: lessonTitle || "Lesson Video",
      collectionId: collectionId,
    };

    const createVideoRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(videoPayload),
      }
    );

    const videoData = await createVideoRes.json();
    if (!createVideoRes.ok || !videoData.guid) {
      throw new Error("Failed to create video record in Bunny Stream");
    }

    console.log("video title created succfully Step 1");

    const videoGuid = videoData.guid;

    // 4) Upload video to Bunny Stream
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;

    let uploadRes;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        uploadRes = await fetchWithoutTimeout(uploadUrl, {
          method: "PUT",
          headers: {
            AccessKey: apiKey,
            "Content-Type": "application/octet-stream",
          },
          body: videoBuffer,
        });

        if (uploadRes.ok && uploadRes.status === 200) {
          console.log("video uploaded successfully Step 2");
          break; // success
        }

        // Handle duplicate upload error
        if (uploadRes.status === 400) {
          const errorText = await uploadRes.text();
          try {
            const errorData = JSON.parse(errorText);
            if (
              errorData.message &&
              errorData.message.includes("already been uploaded")
            ) {
              console.log(
                "Video already uploaded, proceeding with existing video"
              );
              break; // Treat as success
            }
          } catch (e) {
            // Not JSON, continue with normal error handling
          }
        }

        // Handle network errors specifically
        if (
          err.name === "NetworkError" ||
          err.message.includes("network") ||
          err.message.includes("fetch")
        ) {
          console.log(
            `Upload attempt ${attempt} failed due to network error, retrying...`
          );
          if (attempt === maxRetries) {
            throw new Error(
              `Video upload failed after ${maxRetries} attempts due to network issues. Please check your internet connection and try again.`
            );
          }
          continue; // Retry on network errors
        }

        const t = await uploadRes.text().catch(() => "");
        throw new Error(
          `Video upload failed: ${uploadRes.status} ${uploadRes.statusText} ${t}`
        );
      } catch (err) {
        console.log("video upload failed ", err.message);
        if (attempt === maxRetries) {
          // Cleanup: delete the video record if upload fails
          try {
            await fetch(
              `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
              {
                method: "DELETE",
                headers: { AccessKey: apiKey },
              }
            );
          } catch (cleanupErr) {
            console.warn("Failed to cleanup video record:", cleanupErr.message);
          }
          throw new Error(
            `Bunny video upload failed after ${maxRetries} attempts: ${err.message}`
          );
        }
        await delay(2000 * attempt); // backoff
      }
    }

    // 5) Skip video processing to save time for long videos
    console.log("Skipping video processing for faster upload");

    return {
      success: true,
      videoId: videoGuid,
      destinationPath: `videos/${videoGuid}`,
    };
  } catch (error) {
    console.error("Error uploading remote video to Bunny:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Function to upload remote file to Bunny CDN Storage
async function uploadRemoteFileToBunny({
  sourceUrl,
  storageZone,
  accessKey,
  merchant,
  fileName,
  maxFileSizeBytes = 100 * 1024 * 1024, // 100MB safeguard for files
  maxRetries = 3,
  timeoutMs = 30000, // 30s timeout
}) {
  if (!sourceUrl || !storageZone || !accessKey || !fileName) {
    throw new Error("Missing required Bunny File params");
  }

  try {
    // Helper: delay for retries
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // Helper: fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeout = timeoutMs) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(id);
      }
    }

    // 1) Fetch remote file with retries
    let fileRes;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Attempting to fetch file: ${sourceUrl} (attempt ${attempt}/${maxRetries})`
        );
        fileRes = await fetchWithTimeout(sourceUrl);

        if (!fileRes.ok) {
          const errorDetails = {
            status: fileRes.status,
            statusText: fileRes.statusText,
            url: sourceUrl,
            attempt: attempt,
          };

          if (fileRes.status === 404) {
            throw new Error(`File not found (404): ${sourceUrl}`);
          } else if (fileRes.status === 403) {
            throw new Error(`Access forbidden (403): ${sourceUrl}`);
          } else if (fileRes.status >= 500) {
            throw new Error(`Server error (${fileRes.status}): ${sourceUrl}`);
          } else {
            throw new Error(`HTTP ${fileRes.status}: ${sourceUrl}`);
          }
        }

        // Validate content type
        const contentType = fileRes.headers.get("content-type");
        if (!contentType && fileRes.status === 200) {
          console.warn(`No content-type header for: ${sourceUrl}`);
        }

        console.log(
          `Successfully fetched file: ${sourceUrl} (${contentType}, size: ${fileRes.headers.get(
            "content-length"
          )} bytes)`
        );
        break; // success
      } catch (err) {
        console.warn(
          `Fetch attempt ${attempt} failed for ${sourceUrl}: ${err.message}`
        );

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to fetch source file after ${maxRetries} attempts: ${err.message}`
          );
        }

        // Exponential backoff with jitter
        const backoffTime = Math.min(
          1000 * attempt * (1 + Math.random()),
          10000
        );
        console.log(`Waiting ${backoffTime}ms before retry...`);
        await delay(backoffTime);
      }
    }

    // 2) Enforce max size
    const contentLength = parseInt(
      fileRes.headers.get("content-length") || "0",
      10
    );
    if (contentLength && contentLength > maxFileSizeBytes) {
      throw new Error(
        `Source file too large (${contentLength} bytes, limit ${maxFileSizeBytes})`
      );
    }

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    if (fileBuffer.length > maxFileSizeBytes) {
      throw new Error(
        `Source file exceeded max size after download (${fileBuffer.length} bytes)`
      );
    }

    // 3) Determine file type and generate destination path
    const contentType =
      fileRes.headers.get("content-type") || "application/octet-stream";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "bin";
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).slice(2);
    const destinationPath = `files/${timestamp}-${randomString}.${fileExtension}`;

    // Determine file type based on content type and extension
    let fileType = "other";
    if (contentType.startsWith("video/")) fileType = "video";
    else if (contentType === "application/pdf") fileType = "pdf";
    else if (contentType.includes("zip") || contentType.includes("rar"))
      fileType = "zip";
    else if (contentType.startsWith("image/")) fileType = "image";
    else if (fileExtension === "png") fileType = "png";

    // 4) Upload to Bunny Storage with retries
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${destinationPath}`;

    let uploadRes;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        uploadRes = await fetchWithTimeout(uploadUrl, {
          method: "PUT",
          headers: {
            AccessKey: accessKey,
            "Content-Type": contentType,
          },
          body: fileBuffer,
        });

        if (uploadRes.ok && uploadRes.status === 201) break; // success
        const t = await uploadRes.text().catch(() => "");
        throw new Error(
          `File upload failed: ${uploadRes.status} ${uploadRes.statusText} ${t}`
        );
      } catch (err) {
        if (attempt === maxRetries) {
          throw new Error(
            `Bunny file upload failed after ${maxRetries} attempts: ${err.message}`
          );
        }
        await delay(2000 * attempt); // backoff
      }
    }

    const cdnHostname = merchant?.PUBLIC_CDN_URL || process.env.PUBLIC_CDN_URL;

    return {
      success: true,
      fileName: fileName,
      fileType: fileType,
      cdnUrl: `${cdnHostname}/${destinationPath}`,
      fileSize: fileBuffer.length,
      mimeType: contentType,
      destinationPath: destinationPath,
    };
  } catch (error) {
    console.error("Error uploading remote file to Bunny:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Function to cleanup created resources on failure
async function cleanupCreatedResources({
  productid,
  collection_Id,
  thumbnailDestinationPath,
  createdCourseId,
  createdModuleIds,
  createdLessonIds,
  createdFileIds,
  shopDomain,
  accessToken,
  merchant,
}) {
  const cleanupPromises = [];

  // Delete Shopify product if created
  if (productid) {
    cleanupPromises.push(
      deleteShopifyProduct(shopDomain, accessToken, productid).catch((err) =>
        console.warn("Failed to delete Shopify product:", err.message)
      )
    );
  }

  // Delete Bunny collection if created
  if (collection_Id) {
    cleanupPromises.push(
      deleteStreamCollection({
        LibraryId: merchant?.StreamLibraryId || LibId,
        collectionId: collection_Id,
        apiKey: merchant?.StreamApiKEY || StreamApiKEY,
      }).catch((err) =>
        console.warn("Failed to delete Bunny collection:", err.message)
      )
    );
  }

  // Delete Bunny thumbnail if created
  if (thumbnailDestinationPath) {
    cleanupPromises.push(
      deleteBunnyStorageFile(thumbnailDestinationPath).catch((err) =>
        console.warn("Failed to delete Bunny thumbnail:", err.message)
      )
    );
  }

  // Delete database records if created
  if (createdFileIds.length > 0) {
    cleanupPromises.push(
      File.destroy({ where: { id: createdFileIds } }).catch((err) =>
        console.warn("Failed to delete files from database:", err.message)
      )
    );
  }

  if (createdLessonIds.length > 0) {
    cleanupPromises.push(
      Lesson.destroy({ where: { id: createdLessonIds } }).catch((err) =>
        console.warn("Failed to delete lessons from database:", err.message)
      )
    );
  }

  if (createdModuleIds.length > 0) {
    cleanupPromises.push(
      Module.destroy({ where: { id: createdModuleIds } }).catch((err) =>
        console.warn("Failed to delete modules from database:", err.message)
      )
    );
  }

  if (createdCourseId) {
    cleanupPromises.push(
      Course.destroy({ where: { id: createdCourseId } }).catch((err) =>
        console.warn("Failed to delete course from database:", err.message)
      )
    );
  }

  // Execute all cleanup operations in parallel
  await Promise.allSettled(cleanupPromises);
}

/*
Uplaod a course and there modules and lessons with csv
created by lovepreet singh
createdat: 2025-09-16
*/
