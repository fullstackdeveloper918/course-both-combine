import {
  uploadToBunnyStorage,
  UploadVideoLarge,
} from "../utils/bunnyUtilis.js";
import {
  Lesson,
  Module,
  Course,
  File,
  Progress,
  Merchant,
} from "../models/associations.js";
import { getBunnyPublicUrl } from "../controllers/lessonController.js";
import fs from "fs/promises";
import path from "path";

// export const BulkUploadWorker = async (data) => {
//   try {
//     for (let index = 0; index < data?.length; index++) {
//       const record = data[index];
//       const tempFilesToDelete = [];

//       try {
//         // Track temp files to clean up later
//         if (record.lessonpath) tempFilesToDelete.push(record.lessonpath);
//         if (record.thumbnail) tempFilesToDelete.push(record.thumbnail);
//         for (const f of record.lessonsFiles || []) {
//           if (f.filepath) tempFilesToDelete.push(f.filepath);
//         }

//         // Get lesson & course
//         const lessonData = await Lesson.findOne({
//           where: { id: record.lessonid, courseId: record.courseId },
//         });

//         const courseData = await Course.findOne({
//           where: { id: record.courseId },
//         });

//         if (!lessonData || !courseData) {
//           console.warn(` Skipping index ${index}: Missing lesson or course.`);
//           continue;
//         }

//         const uniqueTitle = `${lessonData.title}-${Date.now()}-${index}`;

//         // Upload video to Bunny
//         const videoUploadResult = await UploadVideoLarge({
//           title: uniqueTitle,
//           filePath: record.lessonpath,
//           collectionid: courseData?.collectionId,
//         });

//         if (!videoUploadResult?.success || !videoUploadResult?.videoGuid) {
//           console.error(` Failed to upload video at index ${index}`);
//           continue;
//         }

//         const videoGuid = videoUploadResult.videoGuid;

//         // Upload thumbnail if exists
//         let thumbnailUrl = null;
//         if (record?.thumbnail) {
//           const thumbDest = `thumbnails/${Date.now()}-${index}`;
//           const uploadResult = await uploadToBunnyStorage(
//             record.thumbnail,
//             thumbDest
//           );
//           if (uploadResult?.error) {
//             console.warn(` Thumbnail upload failed at index ${index}`);
//           } else {
//             thumbnailUrl = getBunnyPublicUrl(thumbDest);
//           }
//         }

//         // Update lesson with video details
//         await Lesson.update(
//           {
//             VideoId: videoGuid,
//             thumbnail: thumbnailUrl,
//           },
//           {
//             where: { id: lessonData.id },
//           }
//         );

//         // Upload lesson files
//         for (const file of record.lessonsFiles || []) {
//           const fileDest = `files/${Date.now()}-${index}`;
//           const upload = await uploadToBunnyStorage(file.filepath, fileDest);

//           if (upload?.error) {
//             console.warn(` File upload failed: ${file.filepath}`);
//             continue;
//           }

//           await File.update(
//             {
//               url: getBunnyPublicUrl(fileDest),
//               mimeType: upload.contentType,
//               size: upload.contentLength,
//               bucket: "bunny storage",
//             },
//             {
//               where: {
//                 id: file.id,
//                 lessonId: lessonData.id,
//               },
//             }
//           );
//         }
//       } catch (err) {
//         console.error(` Error processing index ${index}: ${err.message}`);
//       } finally {
//         // Cleanup temporary local files
//         for (const filePath of new Set(tempFilesToDelete)) {
//           try {
//             await fs.unlink(filePath);
//             console.log(`🧹 Deleted temp file: ${filePath}`);
//           } catch (cleanupErr) {
//             console.warn(
//               `⚠️ Failed to delete temp file ${filePath}: ${cleanupErr.message}`
//             );
//           }
//         }
//       }
//     }

//     console.log("✅ BulkUploadWorker completed successfully.");
//   } catch (error) {
//     console.error(`🔥 Fatal error in BulkUploadWorker: ${error.message}`);
//   }
// };

export const BulkUploadWorker = async (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("BulkUploadWorker received empty or invalid data");
    return;
  }

  try {
    for (let index = 0; index < data.length; index++) {
      const record = data[index];
      const tempFilesToDelete = [];

      try {
        if (record.lessonpath) tempFilesToDelete.push(record.lessonpath);
        if (record.thumbnail) tempFilesToDelete.push(record.thumbnail);
        for (const f of record.lessonsFiles || []) {
          if (f.filepath) tempFilesToDelete.push(f.filepath);
        }

        const lessonData = await Lesson.findOne({
          where: { id: record.lessonid, courseId: record.courseId },
        });
        const courseData = await Course.findOne({
          where: { id: record.courseId },
        });

        if (!lessonData || !courseData) {
          console.warn(` Skipping index ${index}: lesson or course not found.`);
          continue;
        }

        const uniqueTitle = `${lessonData.title}-${Date.now()}-${index}`;

        // 🔁 Upload video with retry
        const videoUploadResult = await withRetry(() =>
          UploadVideoLarge({
            title: uniqueTitle,
            filePath: record.lessonpath,
            collectionid: courseData.Colletionid,
          })
        );

        if (!videoUploadResult?.success || !videoUploadResult?.videoGuid) {
          console.error(`❌ Bunny video upload failed at index ${index}`);
          continue;
        }

        const videoGuid = videoUploadResult.videoGuid;

        // 🔁 Upload thumbnail with retry
        let thumbnailUrl = null;
        if (record.thumbnail) {
          const thumbDest = `thumbnails/${Date.now()}-${index}`;
          const thumbUpload = await withRetry(() =>
            uploadToBunnyStorage(record.thumbnail, thumbDest)
          );
          if (!thumbUpload?.error) {
            thumbnailUrl = getBunnyPublicUrl(thumbDest);
          } else {
            console.warn(`⚠️ Thumbnail upload failed at index ${index}`);
          }
        }

        // 🔁 Update lesson DB
        await withRetry(() =>
          Lesson.update(
            {
              VideoId: videoGuid,
              thumbnail: thumbnailUrl,
              status: "processing",
            },
            { where: { id: lessonData.id } }
          )
        );

        // 🔁 Upload files and update DB
        for (const file of record.lessonsFiles || []) {
          const fileDest = `files/${Date.now()}-${index}`;
          const upload = await withRetry(() =>
            uploadToBunnyStorage(file.filepath, fileDest)
          );

          if (upload?.error) {
            console.warn(`⚠️ Lesson file upload failed: ${file.filepath}`);
            continue;
          }

          await withRetry(() =>
            File.update(
              {
                url: getBunnyPublicUrl(fileDest),
                mimeType: upload.contentType,
                size: upload.contentLength,
                bucket: "bunny storage",
              },
              {
                where: {
                  id: file.id,
                  lessonId: lessonData.id,
                },
              }
            )
          );
        }
      } catch (err) {
        console.error(`❌ Error processing index ${index}: ${err.message}`);
      } finally {
        for (const filePath of new Set(tempFilesToDelete)) {
          try {
            await fs.unlink(path.join("uploads", filePath));

            // await fs.unlink(filePath);
            console.log(`🧹 Deleted temp file: ${filePath}`);
          } catch (cleanupErr) {
            console.warn(
              ` Cleanup failed: ${filePath} - ${cleanupErr.message}`
            );
          }
        }
      }
    }

    console.log("✅ BulkUploadWorker finished.");
  } catch (fatalError) {
    console.error(`🔥 Fatal error in BulkUploadWorker: ${fatalError.message}`);
  }
};
const withRetry = async (fn, retries = 2, delayMs = 1000) => {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      console.warn(
        `🔁 Retry ${attempt}/${retries} after error: ${err.message}`
      );
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};

// nskm aluh cgsq gkfp
