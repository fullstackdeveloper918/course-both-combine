import {
  Lesson,
  Module,
  Course,
  File,
  Progress,
  Merchant,
} from "../models/associations.js";
import { Op, where } from "sequelize";
import jwt from "jsonwebtoken";
import {
  uploadToStorage,
  deleteFromStorage,
} from "../services/storageService.js";
import multer from "multer";
import * as csv from "csv-parse/sync";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import csvParser from "csvtojson";
import {
  deleteBunnyStorageFile,
  deleteBunnyVideo,
  generateSecureStreamUrl,
  getVideoInfo,
  registerVideo,
  uploadToBunnyStorage,
  UploadVideo,
  UploadVideoLarge,
  waitForVideoProcessing,
} from "../utils/bunnyUtilis.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import fs2 from "fs/promises";
import { BulkUploadWorker } from "../worker/bulkUploadWorker.js";
import { ApiError } from "../utils/ApiUtilis.js";

const upload = multer({ dest: "uploads/" });

// Create a new lesson
// export const createLesson = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       content,
//       order,
//       duration,
//       moduleId,
//       courseId,
//       isPreview,
//     } = req.body;

//     const video = req.files?.video?.[0];
//     const file = req.files?.file?.[0]; // optional
//     console.log(video);
//     console.log(file);

//     if (!video) {
//       return res.status(400).json({ error: "Video is required." });
//     }
//     let videourl = `/videos/${video?.filename}`;
//     let fileUrl = null;
//     if (file) {
//       fileUrl = `/files/${file?.filename}`;
//     }

//     const module = await Module.findByPk(moduleId);
//     if (!module) {
//       return res.status(404).json({
//         success: false,
//         error: "Module not found",
//       });
//     }

//     const lesson = await Lesson.create({
//       title,
//       description,
//       content,
//       order,
//       duration: 3,
//       moduleId,
//       courseId,
//       videoUrl: videourl,
//       videoDuration: 3,
//       isPreview,
//       fileUrl,
//     });

//     res.status(201).json({
//       success: true,
//       data: lesson,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// const BUNNY_STREAM_LIBRARY_ID = 'your_library_id';
// const BUNNY_STREAM_API_KEY = 'your_stream_api_key';

// const BUNNY_STORAGE_ZONE_NAME = 'your_storage_zone_name';
// const BUNNY_STORAGE_ACCESS_KEY = 'your_storage_access_key';
// const BUNNY_STORAGE_HOSTNAME = 'storage.bunnycdn.com';
const PUBLIC_CDN_URL = process.env.PUBLIC_CDN_URL; // Replace with your CDN pull zone

export function getBunnyPublicUrl(destinationPath) {
  return `${PUBLIC_CDN_URL}/${destinationPath}`;
}

export const createLesson = async (req, res) => {
  console.log(req,"check request is visible");

  const tempFilesToDelete = [];
  const bunnyguid = [];
  const filestoragepath = [];
  let lessonsid = null;
  const filesid = [];

  //  Step 1: Collect all filenames before doing anything else
  try {
    const video = req.files?.video?.[0];
    const thumbnail = req.files?.thumbnail?.[0];
    const filearray = req.files?.file || [];

    if (!video) {
      return res.status(400).json({ error: "Video is required." });
    }

    // Collect filenames
    tempFilesToDelete.push(video.filename);
    if (thumbnail) tempFilesToDelete.push(thumbnail.filename);
    filearray.forEach((file) => {
      tempFilesToDelete.push(file.filename);
    });

    // Session
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;
    if (process.env.NODE_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
      console.log(shopDomain, "shopDomaincreateCourse");
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

    console.log(shopDomain, merchant,"visible data see keys")

    if (!merchant) {
      return res
        .status(404)
        .json({ error: "Merchant not found for this shop." });
    }

    const merchantId = merchant.id;
    console.log("merchantId", merchantId);

    const accessToken = merchant.shopifyAccessToken;
    // console.log("accessTokencreateCourse", accessToken);
    //  Step 2: Begin main logic
    let {
      title,
      description,
      content,
      order = null,
      moduleId,
      courseId,
      isPreview = true,
    } = req.body;

    // Get Course Details
    const courseData = await Course.findOne({
      where: {
        id: courseId,
        merchantId: merchantId,
      },
    });

    if (!courseData) {
      throw new Error("Course  not found for the given Merchant.");
    }

    const module = await Module.findOne({
      where: {
        id: moduleId,
        courseId: courseId,
      },
    });

    if (!module) {
      throw new Error("Module not found for the given course.");
    }

    // 1. Register video
    // const videoGuid = await registerVideo(title);
    // if (!videoGuid || typeof videoGuid !== "string") {
    //   throw new Error("Failed to register video with Bunny.");
    // }

    // bunnyguid?.push(videoGuid);

    // 2. Upload video
    const uploadResult = await UploadVideoLarge({
      title,
      filePath: video.filename,
      collectionid: courseData?.dataValues?.Colletionid,
      // AccessKey: merchant?.StreamApiKey,
      // LibraryId: merchant?.StreamLibraryId,
    });

    if (!uploadResult?.success || !uploadResult?.videoGuid) {
      throw new Error("Failed to upload video file to Bunny.");
    }

    const videoGuid = uploadResult.videoGuid;
    bunnyguid?.push(videoGuid);

    // 3. Upload thumbnail
    let thumbnailUrl = null;
    if (thumbnail) {
      const destination = `thumbnails/${Date.now()}-${thumbnail.originalname}`;
      const result = await uploadToBunnyStorage(
        thumbnail.filename,
        destination
      );
      if (result?.error) {
        throw new Error("Failed to upload thumbnail.");
      }
      filestoragepath.push(destination);
      thumbnailUrl = getBunnyPublicUrl(destination);
    }

    // 4. Upload supporting files
    const fileUrls = [];
    for (const file of filearray) {
      const destPath = `files/${Date.now()}-${file.originalname}`;
      const upload = await uploadToBunnyStorage(file.filename, destPath);
      if (upload?.error) {
        throw new Error(`Failed to upload file: ${file.originalname}`);
      }
      filestoragepath.push(destPath);

      fileUrls.push({ url: getBunnyPublicUrl(destPath), ...upload });
    }

    // 5. Check module

    // 6. Get video info
    const videoInfo = await waitForVideoProcessing({ videoGuid, maxTries: 1 });

    let videoDuration = 0;
    if (videoInfo.success) {
      videoDuration = videoInfo?.data.length;
    }

    const lessonCount = await Lesson.count({
      where: { courseId, moduleId: module.id },
    });
    if (lessonCount === 0) {
      order = 1;
    } else if (order == null || order == 0) {
      order = lessonCount + 1;
    } else {
      const AfterLessons = await Lesson.findAll({
        where: {
          courseId,
          moduleId: module.id,
          order: { [Op.gte]: order },
        },
        order: [["order", "ASC"]],
      });

      for (let data of AfterLessons) {
        await Lesson.update(
          { order: data.order + 1 },
          { where: { id: data.id } }
        );
      }
    }

    // 7. Create lesson
    const lesson = await Lesson.create({
      title,
      description,
      content,
      order,
      moduleId,
      courseId,
      isPreview,
      videoUrl: ``,
      thumbnail: thumbnailUrl,
      fileUrls,
      duration: videoDuration,
      merchantId: merchant?.id,
      videoId: videoGuid,
      libaryId: merchant?.streamLibraryId || process.env.STREAM_LIB_ID,
    });

    if (!lesson) throw new Error("Failed to Create Lesson");

    const TotalLessonCount = await Lesson.count({
      where: { courseId, deleteFlag: false },
    });

    await Course.update(
      { totalLessons: TotalLessonCount },
      { where: { id: courseId } }
    );
    const TotalmoduleLessonCount = await Lesson.count({
      where: { courseId, moduleId, deleteFlag: false },
    });
    await Module.update(
      { totalLessons: TotalmoduleLessonCount },
      { where: { id: moduleId } }
    );
    lessonsid = lesson.id;
    // 8. Create file records
    for (let i in fileUrls) {
      let filecreate = await File.create({
        url: fileUrls[i].url,
        mimeType: filearray[i]?.contentType,
        lessonId: lesson.id,
        courseId,
        size: filearray[i]?.size,
      });
      if (!filecreate) throw new Error("Faild to create a File");
      filesid.push(filecreate.id);
    }
    // 9. Respond
    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.log(error);

    for (let videoStreamid of bunnyguid) {
      await deleteBunnyVideo(videoStreamid);
    }
    for (let filestorageid of filestoragepath) {
      await deleteBunnyStorageFile(filestorageid);
    }
    if (lessonsid) {
      await Lesson.destroy({ where: { id: lessonsid } });
    }
    for (let fileid of filesid) {
      await File.destroy({ where: { id: fileid } });
    }
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  } finally {
    await Promise.all(
      tempFilesToDelete.map(async (filename) => {
        try {
          await fs2.unlink(path.join("uploads", filename));
        } catch (err) {
          console.warn(` Failed to delete file ${filename}: ${err.message}`);
        }
      })
    );
  }
};
// export const BulkUpload = async (req, res) => {
//   const tempFilesToDelete = [];
//   const bunnyGuids = [];
//   const fileStoragePaths = [];
//   const lessonIds = [];
//   const fileIds = [];

//   try {
//     const {
//       moduleId,
//       courseId,
//       title = [],
//       description = [],
//       content = [],
//       isPreview = false,
//     } = req.body;

//     const videos = req.files?.videos || [];
//     const thumbnails = req.files?.thumbnail || [];

//     if (!videos.length) {
//       return res.status(400).json({ error: "At least one video is required." });
//     }

//     const module = await Module.findOne({ where: { id: moduleId, courseId } });
//     if (!module) {
//       return res
//         .status(404)
//         .json({ error: "Module not found for this course." });
//     }

//     // Track all uploaded temp files
//     [...videos, ...thumbnails].forEach((file) =>
//       tempFilesToDelete.push(file.filename)
//     );
//     Object.keys(req.files).forEach((key) => {
//       if (key.startsWith("file") || key === "files") {
//         req.files[key]?.forEach((file) =>
//           tempFilesToDelete.push(file.filename)
//         );
//       }
//     });
//     const lessonCount = await Lesson.count({
//       where: { courseId, moduleId: module.id },
//     });
//     for (let index = 0; index < videos.length; index++) {
//       const video = videos[index];
//       const uniqueTitle = `BulkLesson-${Date.now()}-${index}`;

//       const videoUploadResult = await UploadVideoLarge(
//         uniqueTitle,
//         video.filename
//       );
//       if (!videoUploadResult?.success || !videoUploadResult?.videoGuid) {
//         throw new Error(`Failed to upload video at index ${index}`);
//       }

//       const videoGuid = videoUploadResult.videoGuid;
//       bunnyGuids.push(videoGuid);

//       let thumbnailUrl = null;
//       const thumbnail = thumbnails[index];
//       if (thumbnail) {
//         const thumbDest = `thumbnails/${Date.now()}-${thumbnail.originalname}`;
//         const uploadResult = await uploadToBunnyStorage(
//           thumbnail.filename,
//           thumbDest
//         );
//         if (uploadResult?.error) throw new Error("Failed to upload thumbnail.");
//         fileStoragePaths.push(thumbDest);
//         thumbnailUrl = getBunnyPublicUrl(thumbDest);
//       }

//       const videoInfo = await waitForVideoProcessing(videoGuid);
//       if (!videoInfo) throw new Error("Failed to retrieve video info.");

//       const currentTitle = title[index] || `Lesson ${index + 1}`;
//       const currentDesc = description[index] || "";
//       const currentContent = content[index] || "";

//       const lesson = await Lesson.create({
//         title: currentTitle,
//         description: currentDesc,
//         content: currentContent,
//         order: lessonCount + index + 1,
//         moduleId,
//         courseId,
//         isPreview,
//         videoGuid,
//         videoUrl: `https://iframe.mediadelivery.net/play/460401/${videoGuid}`,
//         thumbnail: thumbnailUrl,
//         duration: videoInfo?.length || 0,
//         videoDuration: videoInfo?.length || 0,
//       });

//       if (!lesson) throw new Error("Failed to create lesson.");
//       lessonIds.push(lesson.id);

//       const dynamicField = `file${index + 1}`;
//       const attachedFiles = req.files?.[dynamicField] || [];

//       for (const file of attachedFiles) {
//         const fileDest = `files/${Date.now()}-${file.originalname}`;
//         const upload = await uploadToBunnyStorage(file.filename, fileDest);
//         if (upload?.error)
//           throw new Error(`Failed to upload ${file.originalname}`);
//         fileStoragePaths.push(fileDest);

//         const fileData = await File.create({
//           url: getBunnyPublicUrl(fileDest),
//           mimeType: upload?.contentType,
//           lessonId: lesson.id,
//           courseId,
//           size: upload?.contentLength,
//           bucket: "bunny storage",
//         });
//         if (!fileData) throw new Error("Failed to create file record.");
//         fileIds.push(fileData.id);
//       }

//       if (index === 0 && req.files?.files?.length > 0) {
//         for (const file of req.files.files) {
//           const sharedDest = `files/${Date.now()}-${file.originalname}`;
//           const upload = await uploadToBunnyStorage(file.filename, sharedDest);
//           if (upload?.error)
//             throw new Error(`Failed to upload ${file.originalname}`);
//           fileStoragePaths.push(sharedDest);

//           const fileData = await File.create({
//             url: getBunnyPublicUrl(sharedDest),
//             mimeType: upload?.contentType,
//             lessonId: lesson.id,
//             courseId,
//             size: upload?.contentLength,
//             bucket: "bunny storage",
//           });
//           if (!fileData)
//             throw new Error("Failed to create shared file record.");
//           fileIds.push(fileData.id);
//         }
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Bulk upload completed successfully.",
//     });
//   } catch (error) {
//     console.error("❌ BulkUpload error:", error.message);

//     await Promise.allSettled(bunnyGuids.map((id) => deleteBunnyVideo(id)));
//     await Promise.allSettled(
//       fileStoragePaths.map((path) => deleteBunnyStorageFile(path))
//     );
//     await Promise.allSettled(
//       lessonIds.map((id) => Lesson.destroy({ where: { id } }))
//     );
//     await Promise.allSettled(
//       fileIds.map((id) => File.destroy({ where: { id } }))
//     );

//     return res.status(500).json({ success: false, error: error.message });
//   } finally {
//     await Promise.allSettled(
//       tempFilesToDelete.map(async (filename) => {
//         try {
//           await fs2.unlink(path.join("uploads", filename));
//         } catch (err) {
//           console.warn(`⚠️ Failed to delete file ${filename}: ${err.message}`);
//         }
//       })
//     );
//   }
// };
export const BulkUpload = async (req, res, next) => {
  // const bunnyGuids = [];
  // const fileStoragePaths = [];
  const lessonIds = [];
  const fileIds = [];
  const tempFilesToDelete = [];

  try {
    const {
      moduleId,
      courseId,
      title = [],
      description = [],
      content = [],
      isPreview = false,
    } = req.body;

    const videos = req.files?.videos || [];
    const thumbnails = req.files?.thumbnail || [];
    let LessonsRecords = [];
    if (!videos.length) {
      throw new ApiError("At least one video is required.", 422);
    }

    const module = await Module.findOne({ where: { id: moduleId, courseId } });
    if (!module) {
      throw new ApiError("Module not found for this course.", 404);
    }

    [...videos, ...thumbnails].forEach((file) =>
      tempFilesToDelete.push(file.filename)
    );
    Object.keys(req.files).forEach((key) => {
      if (key.startsWith("file") || key === "files") {
        req.files[key]?.forEach((file) =>
          tempFilesToDelete.push(file.filename)
        );
      }
    });

    const lessonCount = await Lesson.count({
      where: { courseId, moduleId: module.id },
    });

    for (let index = 0; index < videos.length; index++) {
      let lessonobj = {
        lessonsFiles: [],
      };
      const video = videos[index];

      const thumbnail = thumbnails[index] || null;

      const currentTitle = title[index] || `Lesson ${index + 1}`;
      const currentDesc = description[index] || "";
      const currentContent = content[index] || "";

      const lesson = await Lesson.create({
        title: currentTitle,
        description: currentDesc,
        content: currentContent,
        order: lessonCount + index + 1,
        moduleId,
        courseId,
        isPreview,
        // videoGuid,
        // videoUrl: `https://iframe.mediadelivery.net/play/460401/${videoGuid}`,
        // thumbnail: thumbnailUrl,
        duration: null,
        videoDuration: null,
      });

      if (!lesson) throw new ApiError("Failed to create lesson.", 422);
      lessonIds.push(lesson.id);
      const dynamicField = `file${index + 1}`;

      const attachedFiles = req.files?.[dynamicField] || [];

      for (const file of attachedFiles) {
        const fileData = await File.create({
          url: "",
          mimeType: "",
          lessonId: lesson.id,
          courseId,
          size: "",
          bucket: "bunny storage",
        });

        if (!fileData) throw new ApiError("Failed to create file record.", 422);

        fileIds.push(fileData.id);
        lessonobj.lessonsFiles.push({
          id: fileData?.id,
          filepath: file.filename,
        });
      }

      lessonobj.thumbnail = thumbnail?.filename || null;
      lessonobj.lessonid = lesson.id;
      lessonobj.lessonpath = video.filename;
      lessonobj.moduleId = module?.id;
      lessonobj.courseId = courseId;
      LessonsRecords.push(lessonobj);
      // if (index === 0 && req.files?.files?.length > 0) {
      //   for (const file of req.files.files) {
      //     const sharedDest = `files/${Date.now()}-${file.originalname}`;
      //     const upload = await uploadToBunnyStorage(file.filename, sharedDest);
      //     if (upload?.error)
      //       throw new Error(`Failed to upload ${file.originalname}`);
      //     fileStoragePaths.push(sharedDest);

      //     const fileData = await File.create({
      //       url: getBunnyPublicUrl(sharedDest),
      //       mimeType: upload?.contentType,
      //       lessonId: lesson.id,
      //       courseId,
      //       size: upload?.contentLength,
      //       bucket: "bunny storage",
      //     });
      //     if (!fileData)
      //       throw new Error("Failed to create shared file record.");
      //     fileIds.push(fileData.id);
      //   }
      // }

      // await processVideo(lesson.id, videoGuid, bunnyGuids, fileStoragePaths);
    }
    BulkUploadWorker(LessonsRecords);

    return res.status(200).json({
      success: true,
      message: "Bulk uploading Starting...",
    });
  } catch (error) {
    console.error(" BulkUpload error:", error.message);

    await Promise.allSettled(
      lessonIds.map((id) => Lesson.destroy({ where: { id } }))
    );
    await Promise.allSettled(
      fileIds.map((id) => File.destroy({ where: { id } }))
    );
    await Promise.allSettled(
      tempFilesToDelete.map(async (filename) => {
        try {
          await fs2.unlink(path.join("uploads", filename));
        } catch (err) {
          console.warn(` Failed to delete file ${filename}: ${err.message}`);
        }
      })
    );
    return next(new ApiError(error?.message, error?.status));
    // return res.status(500).json({ success: false, error: error.message });
  }
};
// export const BulkUpload = async (req, res) => {
//   const tempFilesToDelete = [];
//   const bunnyGuids = [];
//   const fileStoragePaths = [];
//   const lessonIds = [];
//   const fileIds = [];

//   try {
//     const {
//       moduleId,
//       courseId,
//       title = [],
//       description = [],
//       content = [],
//       isPreview = false,
//     } = req.body;

//     const videos = req.files?.videos || [];
//     const thumbnails = req.files?.thumbnail || [];

//     if (!videos.length) {
//       return res.status(400).json({ error: "At least one video is required." });
//     }

//     const module = await Module.findOne({ where: { id: moduleId, courseId } });
//     if (!module) {
//       return res
//         .status(404)
//         .json({ error: "Module not found for this course." });
//     }

//     [...videos, ...thumbnails].forEach((file) =>
//       tempFilesToDelete.push(file.filename)
//     );
//     Object.keys(req.files).forEach((key) => {
//       if (key.startsWith("file") || key === "files") {
//         req.files[key]?.forEach((file) =>
//           tempFilesToDelete.push(file.filename)
//         );
//       }
//     });

//     const lessonCount = await Lesson.count({
//       where: { courseId, moduleId: module.id },
//     });

//     for (let index = 0; index < videos.length; index++) {
//       const video = videos[index];
//       const uniqueTitle = `BulkLesson-${Date.now()}-${index}`;

//       const videoUploadResult = await UploadVideoLarge(
//         uniqueTitle,
//         video.filename
//       );
//       if (!videoUploadResult?.success || !videoUploadResult?.videoGuid) {
//         throw new Error(`Failed to upload video at index ${index}`);
//       }

//       const videoGuid = videoUploadResult.videoGuid;
//       bunnyGuids.push(videoGuid);

//       let thumbnailUrl = null;
//       const thumbnail = thumbnails[index];
//       if (thumbnail) {
//         const thumbDest = `thumbnails/${Date.now()}-${thumbnail.originalname}`;
//         const uploadResult = await uploadToBunnyStorage(
//           thumbnail.filename,
//           thumbDest
//         );
//         if (uploadResult?.error) throw new Error("Failed to upload thumbnail.");
//         fileStoragePaths.push(thumbDest);
//         thumbnailUrl = getBunnyPublicUrl(thumbDest);
//       }

//       const currentTitle = title[index] || `Lesson ${index + 1}`;
//       const currentDesc = description[index] || "";
//       const currentContent = content[index] || "";

//       const lesson = await Lesson.create({
//         title: currentTitle,
//         description: currentDesc,
//         content: currentContent,
//         order: lessonCount + index + 1,
//         moduleId,
//         courseId,
//         isPreview,
//         videoGuid,
//         videoUrl: `https://iframe.mediadelivery.net/play/460401/${videoGuid}`,
//         thumbnail: thumbnailUrl,
//         duration: null,
//         videoDuration: null,
//         processingStatus: "pending",
//       });

//       if (!lesson) throw new Error("Failed to create lesson.");
//       lessonIds.push(lesson.id);

//       const dynamicField = `file${index + 1}`;
//       const attachedFiles = req.files?.[dynamicField] || [];

//       for (const file of attachedFiles) {
//         const fileDest = `files/${Date.now()}-${file.originalname}`;
//         const upload = await uploadToBunnyStorage(file.filename, fileDest);
//         if (upload?.error)
//           throw new Error(`Failed to upload ${file.originalname}`);
//         fileStoragePaths.push(fileDest);

//         const fileData = await File.create({
//           url: getBunnyPublicUrl(fileDest),
//           mimeType: upload?.contentType,
//           lessonId: lesson.id,
//           courseId,
//           size: upload?.contentLength,
//           bucket: "bunny storage",
//         });
//         if (!fileData) throw new Error("Failed to create file record.");
//         fileIds.push(fileData.id);
//       }

//       if (index === 0 && req.files?.files?.length > 0) {
//         for (const file of req.files.files) {
//           const sharedDest = `files/${Date.now()}-${file.originalname}`;
//           const upload = await uploadToBunnyStorage(file.filename, sharedDest);
//           if (upload?.error)
//             throw new Error(`Failed to upload ${file.originalname}`);
//           fileStoragePaths.push(sharedDest);

//           const fileData = await File.create({
//             url: getBunnyPublicUrl(sharedDest),
//             mimeType: upload?.contentType,
//             lessonId: lesson.id,
//             courseId,
//             size: upload?.contentLength,
//             bucket: "bunny storage",
//           });
//           if (!fileData)
//             throw new Error("Failed to create shared file record.");
//           fileIds.push(fileData.id);
//         }
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Bulk upload completed successfully.",
//     });
//   } catch (error) {
//     console.error("❌ BulkUpload error:", error.message);
//     await Promise.allSettled(bunnyGuids.map((id) => deleteBunnyVideo(id)));
//     await Promise.allSettled(
//       fileStoragePaths.map((path) => deleteBunnyStorageFile(path))
//     );
//     await Promise.allSettled(
//       lessonIds.map((id) => Lesson.destroy({ where: { id } }))
//     );
//     await Promise.allSettled(
//       fileIds.map((id) => File.destroy({ where: { id } }))
//     );

//     return res.status(500).json({ success: false, error: error.message });
//   } finally {
//     await Promise.allSettled(
//       tempFilesToDelete.map(async (filename) => {
//         try {
//           await fs2.unlink(path.join("uploads", filename));
//         } catch (err) {
//           console.warn(`⚠️ Failed to delete file ${filename}: ${err.message}`);
//         }
//       })
//     );
//   }
// };

// Bulk Upload lessons
// export const BulkUpload = async (req, res) => {
//   const tempFilesToDelete = [];
//   const bunnyGuids = [];
//   const fileStoragePaths = [];
//   const lessonIds = [];
//   const fileIds = [];

//   try {
//     const { moduleId, courseId } = req.body;

//     const videos = req.files?.videos || [];
//     const thumbnails = req.files?.thumbnail || [];

//     if (!videos.length) {
//       return res.status(400).json({ error: "Video is required." });
//     }

//     // Track all temporary files
//     [...videos, ...thumbnails].forEach((file) =>
//       tempFilesToDelete.push(file.filename)
//     );
//     Object.keys(req.files).forEach((key) => {
//       if (key.startsWith("file") || key === "files") {
//         req.files[key]?.forEach((file) =>
//           tempFilesToDelete.push(file.filename)
//         );
//       }
//     });

//     // Sequentially upload each video and related files
//     for (let index = 0; index < videos.length; index++) {
//       const video = videos[index];

//       // const videoGuid = await registerVideo(`lesson${index + 1}`);
//       // if (!videoGuid || typeof videoGuid !== "string") {
//       //   throw new Error("Failed to register video with Bunny.");
//       // }
//       // bunnyGuids.push(videoGuid);

//       const videoUploadResult = await UploadVideoLarge(
//         `Bulklesson${index + 1}`,
//         video.filename
//       );
//       if (!videoUploadResult?.success || !videoUploadResult?.videoGuid) {
//         throw new Error("Failed to upload video file to Bunny.");
//       }

//       const videoGuid = videoUploadResult.videoGuid;
//       bunnyGuids?.push(videoGuid);

//       // Upload thumbnail (if exists)
//       let thumbnailUrl = null;
//       const thumbnail = thumbnails[index];
//       if (thumbnail) {
//         const thumbDest = `thumbnails/${thumbnail.originalname}`;
//         const uploadResult = await uploadToBunnyStorage(
//           thumbnail.filename,
//           thumbDest
//         );
//         if (uploadResult?.error) throw new Error("Failed to upload thumbnail.");
//         fileStoragePaths.push(thumbDest);
//         thumbnailUrl = getBunnyPublicUrl(thumbDest);
//       }

//       // Get video info from Bunny
//       const videoInfo = await waitForVideoProcessing(videoGuid);
//       if (!videoInfo) throw new Error("Failed to retrieve video info.");

//       // Create Lesson entry in DB
//       const lesson = await Lesson.create({
//         title: title || `Lesson ${index + 1}`,
//         description,
//         content,
//         order: index + 1,
//         moduleId,
//         courseId,
//         isPreview,
//         videoGuid,
//         videoUrl: `https://iframe.mediadelivery.net/play/${460401}/${videoGuid}`,
//         thumbnail: thumbnailUrl,
//         duration: videoInfo?.length || 0,
//         videoDuration: videoInfo?.length || 0,
//       });

//       if (!lesson) throw new Error("Failed to create lesson.");
//       lessonIds.push(lesson.id);

//       // Upload dynamic files (e.g., file1, file2...)
//       const dynamicField = `file${index + 1}`;
//       const attachedFiles = req.files?.[dynamicField] || [];

//       for (const file of attachedFiles) {
//         const fileDest = `files/${file.originalname}`;
//         const upload = await uploadToBunnyStorage(file.filename, fileDest);
//         if (upload?.error)
//           throw new Error(`Failed to upload ${file.originalname}`);
//         fileStoragePaths.push(fileDest);

//         const fileData = await File.create({
//           url: getBunnyPublicUrl(fileDest),
//           mimeType: upload?.contentType,
//           lessonId: lesson.id,
//           courseId,
//           size: upload?.contentLength,
//           bucket: "bunny storage",
//         });
//         if (!fileData) throw new Error("Failed to create file record.");
//         fileIds.push(fileData.id);
//       }

//       // Shared files (under "files" field, only attached to first lesson)
//       if (index === 0 && req.files?.files?.length > 0) {
//         for (const file of req.files.files) {
//           const sharedDest = `files/${file.originalname}`;
//           const upload = await uploadToBunnyStorage(file.filename, sharedDest);
//           if (upload?.error)
//             throw new Error(`Failed to upload ${file.originalname}`);
//           fileStoragePaths.push(sharedDest);

//           const fileData = await File.create({
//             url: getBunnyPublicUrl(sharedDest),
//             mimeType: upload?.contentType,
//             lessonId: lesson.id,
//             courseId,
//             size: upload?.contentLength,
//             bucket: "bunny storage",
//           });
//           if (!fileData)
//             throw new Error("Failed to create shared file record.");
//           fileIds.push(fileData.id);
//         }
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Bulk upload completed successfully.",
//     });
//   } catch (error) {
//     console.error("❌ BulkUpload error:", error.message);

//     // Cleanup Bunny videos & files
//     await Promise.all(bunnyGuids.map((id) => deleteBunnyVideo(id)));
//     await Promise.all(
//       fileStoragePaths.map((path) => deleteBunnyStorageFile(path))
//     );

//     // Cleanup DB
//     await Promise.all(lessonIds.map((id) => Lesson.destroy({ where: { id } })));
//     await Promise.all(fileIds.map((id) => File.destroy({ where: { id } })));

//     return res.status(500).json({ success: false, error: error.message });
//   } finally {
//     // Cleanup temp files from disk
//     await Promise.all(
//       tempFilesToDelete.map(async (filename) => {
//         try {
//           await fs2.unlink(path.join("uploads", filename));
//         } catch (err) {
//           console.warn(`⚠️ Failed to delete file ${filename}: ${err.message}`);
//         }
//       })
//     );
//   }
// };

// get All Published lessons
export const getLessons = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;



   if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid Shopify session." });
    }

    const merchant = await Merchant.findOne({
      where: { shop: shopDomain },
    });

    if (!merchant) {
      return res
        .status(404)
        .json({ error: "Merchant not found for this shop." });
    }

    const merchantId = merchant.id;
    console.log(merchantId ,"merchentId");

    const { moduleId, courseId, search } = req.query;
    const where = {
      deleteFlag: false, // ✅ only include non-deleted lessons
      status: "published",
    };

    if (moduleId) where.moduleId = moduleId;
    if (courseId) where.courseId = courseId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const lessons = await Lesson.findAll({
  where: {
    merchantId,
    deleteFlag: false, // Add this if you want to filter out deleted lessons
  },
  order: [["order", "ASC"]],
});

    console.log("lesson get", lessons)

    // let hlsurl = generateSecureStreamUrl({
    //   libraryId: merchant?.LibaryId || "469294",
    //   videoGuid: lessons?.VideoId,
    //   securityKey:
    //     merchant?.StreamTokenkey || "78f9dac5-ba17-4d79-8f67-75e817a42faa",
    // });
    // console.log("hlsurl", hlsurl);

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: { lessons },
      // data: { ...lessons, videoUrl: hlsurl },
    });
  } catch (error) {
    console.error("getLessons error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single lesson
export const getLesson = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV === "development") {
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
      return res
        .status(404)
        .json({ error: "Merchant not found for this shop." });
    }

    const merchantId = merchant.id;

    // ✅ Only fetch if deleteFlag = false
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

    const coursedata = await Course.findOne({
      where: {
        id: lesson.courseId,
        merchantId: merchantId,
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

    let hlsurl = generateSecureStreamUrl({
      libraryId: merchant?.streamLibraryId || process.env.STREAM_LIB_ID,
      videoGuid: lesson?.videoId,
      securityKey:
        merchant?.streamSecureTokenApiKey ||
        // process.env.STREAM_SECURE_TOKEN_KEY,
        process.env.STREAM_SECURE_TOKEN_KEY
    });

    let token = jwt.sign(
      {
        url: hlsurl,
      },
      process.env.JWT_SECRET,
      { expiresIn: "90m" }
    );
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
};

// Update lesson
export const updateLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      duration,
      isPreview,
      status,
      moduleId,
      courseId,
    } = req.body;

    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    // Handle uploaded files (video + file)
    const video = req.files?.video?.[0];
    const file = req.files?.file?.[0];

    let videoUrl = lesson.videoUrl;
    let fileUrl = lesson.fileUrl;

    if (video) {
      videoUrl = `/videos/${video.filename}`;
    }

    if (file) {
      fileUrl = `/files/${file.filename}`;
    }

    await lesson.update({
      title,
      description,
      content,
      duration,
      videoUrl,
      videoDuration: lesson.videoDuration || 0, // You can dynamically calculate if needed
      isPreview,
      status,
      moduleId,
      courseId,
      fileUrl,
    });

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("Update lesson error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: [
        {
          model: File,
          as: "files",
        },
      ],
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const currentTime = new Date();

    // Soft delete associated files
    for (const file of lesson.files) {
      await file.update({
        deleteFlag: true,
        deletedAt: currentTime,
      });

      // Optional: remove file from storage
      // await deleteFromStorage(file.key);
    }

    // Soft delete the lesson
    await lesson.update({
      deleteFlag: true,
      deletedAt: currentTime,
    });

    const TotalLessonCount = await Lesson.count({
      where: { courseId: lesson?.courseId, deleteFlag: false },
    });

    await Course.update(
      { totalLessons: TotalLessonCount },
      { where: { id: lesson.courseId } }
    );
    res.status(200).json({
      success: true,
      message: "Lesson and associated files soft deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload lesson video
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a video file",
      });
    }

    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    const { url, key } = await uploadToStorage(req.file, "videos");

    await lesson.update({
      videoUrl: url,
      videoDuration: req.body.duration || 0,
    });

    res.status(200).json({
      success: true,
      data: {
        videoUrl: url,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload lesson file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a file",
      });
    }

    const lesson = await Lesson.findByPk(req.params.id);
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
      lessonId: lesson.id,
      courseId: lesson.courseId,
      isDownloadable: true,
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
};

// Reorder lessons
export const reorderLessons = async (req, res) => {
  try {
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({
        success: false,
        error: "lessonIds must be an array",
      });
    }

    const updates = lessonIds.map((id, index) =>
      Lesson.update({ order: index + 1 }, { where: { id } })
    );

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get lesson statistics
export const getLessonStats = async (req, res) => {
  try {
    const lessonId = req.params.id;

    const [totalFiles, totalProgress, averageProgress] = await Promise.all([
      File.count({ where: { lessonId } }),
      Progress.count({ where: { lessonId } }),
      Progress.findAll({
        where: { lessonId },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("progress")), "averageProgress"],
        ],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFiles,
        totalProgress,
        averageProgress:
          averageProgress[0].getDataValue("averageProgress") || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Bulk upload lessons
// Download file to temporary directory
// export const downloadFile = async (url, folder = "uploads") => {
//   try {
//     // Ensure the folder exists
//     if (!fs.existsSync(folder)) {
//       fs.mkdirSync(folder, { recursive: true });
//     }

//     // Extract extension and generate unique filename
//     const ext = path.extname(url.split("?")[0]) || ".mp4";
//     const filename = `${Date.now()}-${uuidv4()}${ext}`;
//     const filepath = path.join(folder, filename);

//     // Stream download using axios
//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//     });

//     const writer = fs.createWriteStream(filepath);

//     return new Promise((resolve, reject) => {
//       response.data.pipe(writer);
//       writer.on("finish", () => resolve({ filepath, filename }));
//       writer.on("error", reject);
//     });
//   } catch (error) {
//     console.error("❌ Download error:", error.message);
//     throw error;
//   }
// };
export const downloadFile = async (url, folder = "uploads") => {
  try {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const ext = path.extname(url.split("?")[0]) || ".mp4";
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const filepath = path.join(folder, filename);

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filepath);
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", () => resolve({ filepath, filename }));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("❌ Error downloading file:", error.message);
    throw error;
  }
};
// Bulk upload lessons from CSV
export const bulkUploadLessons = async (req, res) => {
  try {
    const { courseId, moduleId } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "CSV file is required." });
    }

    if (!courseId || !moduleId) {
      return res.status(400).json({
        success: false,
        error: "Both courseId and moduleId are required.",
      });
    }

    const csvPath = req.file.path;
    const rows = await csvParser().fromFile(csvPath);
    const createdLessons = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = row.title?.trim();
      const description = row.description || "";
      const order = parseInt(row.order) || i + 1;

      if (!title || !row.videoUrl) {
        console.warn(`Skipping row ${i + 1}: Missing title or videoUrl`);
        continue;
      }

      // 1. Download & upload video to Bunny
      const { filepath: videoPath, filename: videoFile } = await downloadFile(
        row.videoUrl,
        "uploads/videos"
      );
      const videoGuid = await registerVideo(title);

      if (!videoGuid) {
        fs.unlinkSync(videoPath);
        console.warn(`❌ Failed to register video for lesson: ${title}`);
        continue;
      }

      const uploadRes = await UploadVideo(videoGuid, videoFile);
      fs.unlinkSync(videoPath);

      if (uploadRes?.response?.status !== 200 && uploadRes?.status !== 200) {
        console.warn(`❌ Failed to upload video for: ${title}`);
        continue;
      }

      const videoInfo = await getVideoInfo(videoGuid);
      if (!videoInfo) {
        console.warn(`❌ Failed to retrieve video info for: ${title}`);
        continue;
      }

      const videoUrl = `https://iframe.mediadelivery.net/play/${videoInfo.videoLibraryId}/${videoGuid}`;
      const videoDuration = videoInfo.length || 0;

      // 2. Download & upload thumbnail
      let thumbnailUrl = null;
      if (row.thumbnailUrl) {
        const { filepath: thumbPath, filename: thumbFile } = await downloadFile(
          row.thumbnailUrl,
          "uploads/files"
        );
        const thumbDest = `thumbnails/${thumbFile}`;
        const thumbUpload = await uploadToBunnyStorage(thumbFile, thumbDest);
        fs.unlinkSync(thumbPath);

        if (thumbUpload) {
          thumbnailUrl = getBunnyPublicUrl(thumbDest);
        }
      }

      // 3. Create Lesson
      const lesson = await Lesson.create({
        title,
        description,
        order,
        courseId,
        moduleId,
        videoUrl,
        videoGuid,
        thumbnailUrl,
        isPreview: false,
        duration: videoDuration,
        videoDuration,
      });

      if (!lesson) {
        console.warn(`❌ Failed to create lesson for: ${title}`);
        continue;
      }

      // 4. Handle file URLs (attachments)
      const fileUrls =
        row.fileUrls
          ?.split(",")
          .map((url) => url.trim())
          .filter(Boolean) || [];

      for (const fileUrl of fileUrls) {
        const { filepath, filename } = await downloadFile(
          fileUrl,
          "uploads/files"
        );
        const destPath = `files/${filename}`;
        const upload = await uploadToBunnyStorage(filename, destPath);
        fs.unlinkSync(filepath);

        if (!upload) {
          console.warn(`❌ Failed to upload attachment: ${filename}`);
          continue;
        }

        await File.create({
          url: getBunnyPublicUrl(destPath),
          mimeType: upload?.contentType,
          lessonId: lesson.id,
          courseId,
          size: upload?.contentLength,
          bucket: "bunny storage",
        });
      }

      createdLessons.push(lesson);
    }

    fs.unlinkSync(csvPath);

    return res.status(201).json({
      success: true,
      message: `${createdLessons.length} lessons uploaded successfully.`,
      lessons: createdLessons,
    });
  } catch (err) {
    console.error("❌ Bulk Upload Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// export const bulkUploadLessons = async (req, res) => {
//   try {
//     const { courseId, moduleId } = req.body;

//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, error: "CSV file is required." });
//     }

//     if (!courseId || !moduleId) {
//       return res.status(400).json({
//         success: false,
//         error: "Both courseId and moduleId are required.",
//       });
//     }

//     const csvPath = req.file.path;
//     const rows = await csvParser().fromFile(csvPath);

//     const createdLessons = [];
//     for (let i = 0; i < rows.length; i++) {
//       let title = rows[i]?.title || "";
//       let description = rows[i]?.description || "";
//       let order = rows[i]?.order || i + 1;

//       let data = await downloadFile(rows[i].videoUrl, "uploads/videos");

//       const videoGuid = await registerVideo(rows[i].title);
//       console.log("videoguid", videoGuid);
//       console.log("data", data);

//       if (!videoGuid) {
//         console.warn(`Failed to register Bunny video for row ${i + 1}`);
//         return res
//           .status(422)
//           .json({ success: false, error: "Failed to register Bunny video " });
//       }

//       //   // 3. Upload video to Bunny
//       const uploadResponse = await UploadVideo(videoGuid, data.filename);
//       fs.unlinkSync(data.filepath); // remove local temp

//       if (
//         uploadResponse?.response?.status !== 200 &&
//         uploadResponse?.status !== 200
//       ) {
//         return res
//           .status(422)
//           .json({ success: false, error: "Error While Uplaod lesson Video" });
//       }

//       const videoInfo = await getVideoInfo(videoGuid);
//       if (!videoInfo) {
//         return res
//           .status(422)
//           .json({ success: false, error: "Error While Get video info" });
//       }

//       const videoDuration = videoInfo.length || 0;
//       const videoUrl = `https://iframe.mediadelivery.net/play/${videoInfo.videoLibraryId}/${videoGuid}`;

//       let thumbnailUrl = null;
//       if (rows[i].thumbnailUrl) {
//         const { filepath: thumbPath, filename: thumbName } = await downloadFile(
//           rows[i].thumbnailUrl,
//           "uploads/files"
//         );
//         const thumbDest = `thumbnails/${thumbName}`;
//         const thumbUpload = await uploadToBunnyStorage(thumbName, thumbDest);
//         if (!thumbUpload) {
//           return res
//             .status(422)
//             .json({ success: false, error: "Error While Uplaod thumbnail" });
//         }
//         thumbnailUrl = getBunnyPublicUrl(thumbDest);
//         fs.unlinkSync(thumbPath);
//       }
//       // 6. Create lesson
//       const lesson = await Lesson.create({
//         title,
//         description,
//         order,
//         courseId,
//         moduleId,
//         videoUrl,
//         videoGuid,
//         thumbnailUrl,
//         isPreview: false,
//         duration: videoDuration,
//         videoDuration: videoDuration,
//       });

//       if (!lesson) {
//         return res
//           .status(422)
//           .json({ success: false, error: "Error While Uplaod lesson" });
//       }

//       if (rows[i]?.fileUrls) {
//         let fileurls = rows[i]?.fileUrls?.split(",");

//         for (let j = 0; j < fileurls.length; j++) {
//           const { filepath, filename } = await downloadFile(
//             fileurls[j],
//             "uploads/files"
//           );

//           const destPath = `files/${filename}`;
//           const upload = await uploadToBunnyStorage(filename, destPath);
//           const publicUrl = getBunnyPublicUrl(destPath);

//           let iscreated = await File.create({
//             url: publicUrl,
//             mimeType: upload?.contentType,
//             lessonId: lesson.id,
//             courseId,
//             size: upload?.contentLength,
//             bucket: "bunny storage",
//           });

//           if (!iscreated) {
//             return res
//               .status(422)
//               .json({ success: false, error: "Error While Uplaod File" });
//           }

//           fs.unlinkSync(filepath);
//         }
//       }

//       createdLessons.push(lesson);
//     }
//     fs.unlinkSync(csvPath);

//     return res.status(201).json({
//       success: true,
//       message: `${createdLessons.length} lessons uploaded successfully.`,
//       lessons: createdLessons,
//     });
//   } catch (err) {
//     console.error("❌ Bulk Upload Error:", err);
//     return res.status(500).json({ success: false, error: err });
//   }
// };
export const exportLessons = async (req, res) => {
  try {
    const lessons = await Lesson.findAll();
    const csvWriter = createObjectCsvWriter({
      path: path.join(__dirname, "../exports/lessons.csv"),
      header: [
        { id: "title", title: "Title" },
        { id: "content", title: "Content" },
        { id: "order", title: "Order" },
        { id: "moduleId", title: "Module ID" },
      ],
    });
    const records = lessons.map((l) => ({
      title: l.title,
      content: l.content,
      order: l.order,
      moduleId: l.moduleId,
    }));
    await csvWriter.writeRecords(records);
    res.download(path.join(__dirname, "../exports/lessons.csv"));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importLessons = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Please upload a CSV file" });
    }
    const fileContent = fs.readFileSync(req.file.path, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    for (const record of records) {
      await Lesson.create({
        title: record.title,
        content: record.content,
        order: record.order,
        moduleId: record.moduleId,
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Lessons imported successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download The lesson Content

export const DownloadLessonContent = async (req, res) => {
  try {
    const data = await Lesson.findByPk(req.params.id, {
      attributes: ["title", "order"],

      include: [
        {
          model: File,
          as: "files",
          attributes: ["name", "mimeType", "url"],
          separate: true, // Ensures ordering works properly on nested includes
          order: [["createdAt", "ASC"]],
        },
      ],
      separate: true, // Optional but recommended if you want proper ordering
      order: [["order", "ASC"]],
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Lesson not found",
      });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
