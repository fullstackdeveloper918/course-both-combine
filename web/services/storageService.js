import AWS from "aws-sdk";
// const aws = require("aws-sdk");
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { storage as storageConfig } from "../config/config.js";
import fs from "fs";

// Configure AWS
AWS.config.update({
  accessKeyId: storageConfig.s3.accessKeyId,
  secretAccessKey: storageConfig.s3.secretAccessKey,
  endpoint: storageConfig.s3.endpoint,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const s3 = new AWS.S3();

// Upload file to storage
export async function uploadToStorage(file, folder) {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    if (storageConfig.provider === "local") {
      // Save file to local uploads directory
      const uploadsDir = path.join(process.cwd(), "uploads", folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      return {
        url: `/uploads/${folder}/${fileName}`,
        key: `${folder}/${fileName}`,
      };
    }

    // Default: S3
    const params = {
      Bucket: storageConfig.s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: key,
    };
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
}

// Delete file from storage
export async function deleteFromStorage(key) {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
}

// Get signed URL for file download
export async function getSignedUrl(key, fileName) {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
      Expires: 3600, // URL expires in 1 hour
    };

    return await s3.getSignedUrlPromise("getObject", params);
  } catch (error) {
    throw new Error(`Error generating signed URL: ${error.message}`);
  }
}

// Get file metadata
export async function getFileMetadata(key) {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
      Key: key,
    };

    const metadata = await s3.headObject(params).promise();

    return {
      contentType: metadata.ContentType,
      contentLength: metadata.ContentLength,
      lastModified: metadata.LastModified,
    };
  } catch (error) {
    throw new Error(`Error getting file metadata: ${error.message}`);
  }
}

// List files in a folder
export async function listFiles(folder, prefix = "") {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
      Prefix: `${folder}/${prefix}`,
    };

    const result = await s3.listObjectsV2(params).promise();

    return result.Contents.map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    }));
  } catch (error) {
    throw new Error(`Error listing files: ${error.message}`);
  }
}

// Copy file to a new location
export async function copyFile(sourceKey, destinationKey) {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
      CopySource: `${storageConfig.s3.bucket}/${sourceKey}`,
      Key: destinationKey,
      ACL: "public-read",
    };

    await s3.copyObject(params).promise();

    return {
      url: `${storageConfig.s3.endpoint}/${storageConfig.s3.bucket}/${destinationKey}`,
      key: destinationKey,
    };
  } catch (error) {
    throw new Error(`Error copying file: ${error.message}`);
  }
}

// Move file to a new location
export async function moveFile(sourceKey, destinationKey) {
  try {
    await copyFile(sourceKey, destinationKey);
    await deleteFromStorage(sourceKey);
  } catch (error) {
    throw new Error(`Error moving file: ${error.message}`);
  }
}

// Get storage usage statistics
export async function getStorageStats() {
  try {
    const params = {
      Bucket: storageConfig.s3.bucket,
    };

    const result = await s3.listObjectsV2(params).promise();

    const stats = {
      totalFiles: result.Contents.length,
      totalSize: result.Contents.reduce((acc, item) => acc + item.Size, 0),
      folders: {},
    };

    // Group files by folder
    result.Contents.forEach((item) => {
      const folder = item.Key.split("/")[0];
      if (!stats.folders[folder]) {
        stats.folders[folder] = {
          count: 0,
          size: 0,
        };
      }
      stats.folders[folder].count++;
      stats.folders[folder].size += item.Size;
    });

    return stats;
  } catch (error) {
    throw new Error(`Error getting storage stats: ${error.message}`);
  }
}
