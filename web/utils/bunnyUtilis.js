import axios from "axios";
import fs from "fs";
import path from "path";
import { Upload } from "tus-js-client";
import crypto from "crypto";
import { error, log } from "console";

const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
const ACCESS_KEY = process.env.BUNNY_STORAGE_KEY;
// https://mycoursecdn3.b-cdn.net/
const REGION_HOST = process.env.REGION_HOST;

const StreamApiKEY = process.env.STREAM_API_KEY;
const StreamSecureTokenApi = process.env.STREAM_SECURE_TOKEN_KEY;
const LibId = process.env.STREAM_LIB_ID;
const StreamCDNhost = "vz-3b1984a4-21d.b-cdn.net";
export const registerVideo = async (title) => {
  try {
    const createResponse = await axios.post(
      `https://video.bunnycdn.com/library/${LibId}/videos`,
      {
        title: "title",
      },
      {
        headers: {
          AccessKey: StreamApiKEY,
          "Content-Type": "application/json",
        },
      }
    );
    // console.log(createResponse);

    return createResponse.data.guid;
  } catch (error) {
    // console.log(error);
    return error;
  }
};

// const getLatestVideoByTitle = async ({ cdn, LibraryId, title, ACCESS_KEY }) => {
//   const response = await axios.get(
//     `https://video.bunnycdn.com/library/${LibraryId}/videos?search=${encodeURIComponent(
//       title
//     )}`,
//     {
//       headers: {
//         AccessKey: ACCESS_KEY,
//       },
//     }
//   );
//   const videos = response.data?.items?.filter((v) => v.title === title) || [];
//   return videos.sort(
//     (a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded)
//   )[0];
// };
const getLatestVideoByTitle = async ({ LibraryId, title, AccessKey }) => {
  try {
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${LibraryId}/videos?search=${encodeURIComponent(
        title
      )}`,
      {
        headers: {
          AccessKey: AccessKey,
        },
      }
    );

    const videos = response.data?.items?.filter((v) => v.title === title) || [];

    if (videos.length === 0) return null;

    const latest = videos.sort(
      (a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded)
    )[0];

    return latest;
  } catch (error) {
    console.error(" Failed to get latest video by title:", error.message);
    return null;
  }
};
// export const waitForVideoProcessing = async ({
//   videoGuid,
//   LibraryId = LibId,
//   AccessKey = StreamApiKEY,
//   maxTries = 10,
// }) => {
//   for (let i = 0; i < maxTries; i++) {
//     const res = await axios.get(
//       `https://video.bunnycdn.com/library/${LibraryId}/videos/${videoGuid}`,
//       {
//         headers: { AccessKey: AccessKey },
//       }
//     );
//     const video = res.data;
//     if (video.status === 4 && video.length > 0) return video;
//     await new Promise((res) => setTimeout(res, 3000));
//   }
//   throw new Error("Video processing timeout.");
// };

export const waitForVideoProcessing = async ({
  videoGuid,
  LibraryId = LibId,
  AccessKey = StreamApiKEY,
  maxTries = 10,
}) => {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await axios.get(
        `https://video.bunnycdn.com/library/${LibraryId}/videos/${videoGuid}`,
        {
          headers: { AccessKey },
        }
      );

      const video = res.data;
      // console.log("video", video);

      if (video?.length > 0 && video?.encodeProgress === 100) {
        return { success: true, data: video };
      }
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed to fetch video info.`);
    }

    // Wait before next try
    await new Promise((res) => setTimeout(res, 3000));
  }

  // Timed out
  return { success: false };
};

export const UploadVideoLarge = async ({
  title,
  filePath,
  collectionid,
  AccessKey = StreamApiKEY,
  LibraryId = LibId,
}) => {
  try {
    const fullPath = path.resolve("./uploads", filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(` File not found: ${fullPath}`);
    }

    const fileStats = fs.statSync(fullPath);
    const fileStream = fs.createReadStream(fullPath);

    // STEP 1: Create the video record
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${LibraryId}/videos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AccessKey: AccessKey,
        },
        body: JSON.stringify({
          title: title,
          collectionId: collectionid,
        }),
      }
    );

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create video: ${errorText}`);
    }

    const videoData = await createRes.json();
    const videoId = videoData.guid;

    if (!videoId) {
      throw new Error(" Missing video GUID from BunnyCDN response.");
    }

    console.log(`🎬 Created video with ID: ${videoId}`);

    // STEP 2: Upload the video via PUT
    const uploadUrl = `https://video.bunnycdn.com/library/${LibraryId}/videos/${videoId}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: AccessKey,
        "Content-Type": "application/octet-stream",
        "Content-Length": fileStats.size.toString(),
      },
      body: fileStream,
      duplex: "half", // ✅ REQUIRED when body is a stream
    });
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(` Upload failed ${errorText}`);
    }

    console.log(` Upload complete for video ID: ${videoId}`);

    return {
      success: true,
      videoGuid: videoId,
      videoUrl: `https://video.bunnycdn.com/play/${LibraryId}/${videoId}`,
    };
  } catch (err) {
    console.error(" Upload failed:", err.message);
    throw err;
  }
};

// export const UploadVideoLarge = async (
//   title,
//   filePath,
//   collectionid = "6bf7cff5-ce98-4884-b759-f726aed799a0"
// ) => {
//   return new Promise((resolve, reject) => {
//     const fullPath = path.resolve("./uploads", filePath);
//     if (!fs.existsSync(fullPath)) {
//       return reject(new Error(`❌ File not found: ${fullPath}`));
//     }

//     const fileStats = fs.statSync(fullPath);
//     const readStream = fs.createReadStream(fullPath);

//     const upload = new Upload(readStream, {
//       endpoint: "https://video.bunnycdn.com/tusupload",
//       retryDelays: [0, 5000, 10000, 15000, 30000, 60000],
//       uploadSize: fileStats.size,
//       metadata: {
//         filename: path.basename(fullPath),
//         title: title,
//       },
//       headers: {
//         AccessKey: "0075277f-f8a4-4a8e-80a4f54e3815-ad14-44b7", // ✅ your API key
//         LibraryId: "467875", // ✅ library ID as header (case-sensitive!)
//       },
//       onError: (error) => {
//         console.error("❌ TUS upload failed:", error);
//         reject(error);
//       },
//       onSuccess: async () => {
//         try {
//           const video = await getLatestVideoByTitle(title);
//           if (!video) {
//             return reject(
//               new Error("✅ Upload finished but could not retrieve video info")
//             );
//           }
//           console.log("✅ TUS upload succeeded - videoGuid:", video.guid);
//           resolve({ success: true, videoGuid: video.guid });
//         } catch (err) {
//           reject(err);
//         }
//       },
//     });

//     upload.start();
//   });
// };

export const UploadVideo = async (videoId, filepath) => {
  try {
    const fullPath = `./uploads/${filepath}`;

    // Check if file exists before uploading
    if (!fs.existsSync(fullPath)) {
      //   throw new Error(`File not found: ${fullPath}`);
      console.log("File not Exits");
    }
    console.log("file exist");

    const fileStream = fs.createReadStream(fullPath);

    // console.log("Uploading file:", fullPath);

    const uploadResponse = await axios.put(
      `https://video.bunnycdn.com/library/${LibId}/videos/${videoId}`,
      fileStream,
      {
        headers: {
          AccessKey: StreamApiKEY,
          "Content-Type": "application/octet-stream",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    return uploadResponse;
  } catch (error) {
    return error;
  }
};

// Creating a collection of the  Course
export const createCollection = async ({ LibraryId, name, apiKey }) => {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${LibraryId}/collections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessKey: apiKey,
      },
      body: JSON.stringify({ name }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create collection: ${errorText}`);
  }

  const data = await res.json();
  console.log(" Collection Created Successfully");
  return data;
};

// Update the collection Name When the course will update
export const updateCollectionName = async ({
  LibraryId,
  collectionId,
  newName,
  apiKey,
}) => {
  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${LibraryId}/collections/${collectionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AccessKey: apiKey,
        },
        body: JSON.stringify({ name: newName }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();

      return {
        success: false,
        error: errorText || "Failed to update collection name",
      };
    }

    const data = await res.json();
    console.log("✅ Collection updated:");

    return { success: true, data: data };
  } catch (error) {
    console.log("❌ Collection update failed:", error);

    return { success: false, error: error };
  }
};
// Upload the file to Bunny Storage
export async function uploadToBunnyStorage(localFilePath, destinationPath) {
  try {
    const fullPath = path.resolve(`./uploads/${localFilePath}`);
    const fileStream = fs.createReadStream(fullPath);
    const url = `https://${REGION_HOST}/${STORAGE_ZONE_NAME}/${destinationPath}`;

    const response = await axios.put(url, fileStream, {
      headers: {
        AccessKey: ACCESS_KEY,
        "Content-Type": "application/octet-stream",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // let data = await getFileMetadata(destinationPath);

    return { success: true, data: response };
  } catch (err) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export const getVideoInfo = async (videoGuid) => {
  try {
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${LibId}/videos/${videoGuid}`,
      {
        headers: {
          AccessKey: StreamApiKEY,
        },
        timeout: 5000, // optional: fail fast if Bunny is slow
      }
    );

    if (!response.data || typeof response.data !== "object") {
      throw new Error("Invalid video info response");
    }

    return response.data;
  } catch (err) {
    console.error("❌ Failed to fetch video info:", err.message);
    return null;
  }
};

// export const getVideoInfo = async (videoGuid) => {
//   try {
//     const response = await axios.get(
//       `https://video.bunnycdn.com/library/460401/videos/${videoGuid}`,
//       {
//         headers: {
//           AccessKey: "39880fe5-0322-4c57-b7942ab26fcf-daa1-42d7", // your Bunny API key
//         },
//       }
//     );

//     return response.data;
//   } catch (err) {
//     console.log(err);

//     console.error("❌ Failed to fetch video info:", err.message);
//     return null;
//   }
// };

async function getFileMetadata(FILE_PATH) {
  try {
    const response = await axios.get(
      `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/${FILE_PATH}`,
      {
        headers: {
          AccessKey: ACCESS_KEY,
        },
      }
    );
    const {
      "content-type": contentType,
      "content-length": contentLength,
      "last-modified": lastModified,
      etag,
      server,
      date,
      connection,
      "accept-ranges": acceptRanges,
    } = response.headers;

    const metadata = {
      contentType,
      contentLength: Number(contentLength),
      lastModified,
      etag,
      server,
      date,
      connection,
      acceptRanges,
    };
    return { success: true, data: metadata };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export const deleteBunnyVideo = async (videoGuid) => {
  try {
    const response = await axios.delete(
      `https://video.bunnycdn.com/library/${LibId}/videos/${videoGuid}`,
      {
        headers: {
          AccessKey: StreamApiKEY,
        },
      }
    );

    if (response.status === 200) {
      console.log(`Video ${videoGuid} deleted from Bunny Stream.`);
      return true;
    } else {
      console.warn(` Failed to delete video ${videoGuid}.`, response.status);
      return false;
    }
  } catch (error) {
    console.error(` Error deleting Bunny video ${videoGuid}:`, error.message);
    return false;
  }
};

// deleted file from Bunny Storage
export const deleteBunnyStorageFile = async (relativePath) => {
  try {
    const url = `https://${REGION_HOST}/${STORAGE_ZONE_NAME}/${relativePath}`;

    const response = await axios.delete(url, {
      headers: {
        AccessKey: ACCESS_KEY,
      },
    });

    if (response.status === 200) {
      return true;
    } else {
      console.warn(
        ` Failed to delete file from the Bunny Storage ${relativePath} - Status: ${response.status}`
      );
      return false;
    }
  } catch (error) {
    console.error(` Error deleting  from Bunny Storage:::::`, error?.message);
    return false;
  }
};

// Deleted the  bunny stream collection

export const deleteStreamCollection = async ({
  LibraryId,
  collectionId,
  apiKey,
}) => {
  try {
    const url = `https://video.bunnycdn.com/library/${LibraryId}/collections/${collectionId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        AccessKey: apiKey,
      },
    });

    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.warn(
        `⚠️ Failed to delete collection ${collectionId}: ${errorText}`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `❌ Error while deleting collection ${collectionId}:`,
      error.message
    );
    return false;
  }
};

// export function generateSecureStreamUrl({
//   libraryId,
//   videoGuid,
//   securityKey,
//   expiresInSeconds = 5400, // 1 hour 30 minutes
// }) {

//   console.log({
//     libraryId: libraryId,
//     videoGuid: videoGuid,
//     securityKey: securityKey,
//   });

//   const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
//   const path = `/${libraryId}/${videoGuid}/play.m3u8`;

//   const hash = crypto
//     .createHash("sha256")
//     .update(securityKey + path + expires)
//     .digest("hex");

//   const token = `${hash}_${expires}`;
//   console.log("token",`${process.env.STREAM_CDN_URL}${path}?token=${token}`);

//   return `https://${process.env.STREAM_CDN_URL}${path}?token=${token}`;
// }
export function generateSecureStreamUrl({
  libraryId,
  videoGuid,
  securityKey,
  expiresInSeconds = 5400, // 1 hour 30 minutes
}) {
  console.log({
    libraryId: libraryId,
    videoGuid: videoGuid,
    securityKey: securityKey,
  });

  let baseurl = `https://${process.env.STREAM_CDN_URL}/${videoGuid}/playlist.m3u8`;

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const path = `${videoGuid}/playlist.m3u8${expires}`;

  const hash = crypto
    .createHmac("sha256", securityKey)
    .update(path)
    .digest("hex");

  // const token = `${hash}_${expires}`;
  // console.log("token",`${process.env.STREAM_CDN_URL}${path}?token=${token}`);

  return `${baseurl}?token=${hash}&expires=${expires}`;
}

// export function generateSecureStreamUrl({
//   libraryId,
//   videoGuid,
//   securityKey,
//   expiresInSeconds = 5400, // 1 hour 30 minutes
// }) {

//   console.log("seckey",securityKey);
//   console.log("videoid",videoGuid);
//   console.log("libid",libraryId);

//   // https://vz-3b1984a4-21d.b-cdn.net/687c880c-1837-4e6f-bba5-b3ef59ff85a8/playlist.m3u8

//   // const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
//   // const path = `/${libraryId}/${videoGuid}/play.m3u8`;

//   // const hash = crypto
//   //   .createHash("sha256")
//   //   .update(securityKey + path + expires)
//   //   .digest("hex");

//   // const token = `${hash}_${expires}`;
//   // const cdnUrl = process.env.STREAM_CDN_URL?.replace(/^https?:\/\//, "") || "stream.bunnycdn.com";

//     const cdnUrl = process.env.STREAM_CDN_URL|| "stream.bunnycdn.com";

//   // const fullUrl = `https://${cdnUrl}${path}?token=${token}`;

//   const fullUrl = `https://${cdnUrl}/${videoGuid}/playlist.m3u8`;

//   console.log("🔐 Secure Bunny Stream URL:", fullUrl);

//   return fullUrl;
// }
