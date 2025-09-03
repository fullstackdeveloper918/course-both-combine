import dotenv from "dotenv";
dotenv.config();

export const app = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  env: process.env.NODE_ENV || "development",
};
// export const database = {
//   logging: process.env.DB_LOGGING === "true",
//   host: process.env.DB_HOST || "localhost",
//   port: process.env.DB_PORT || 3306,
//   name: process.env.DB_NAME,
//   user: process.env.DB_USER,
// /  password: process.env.DB_PASSWORD,
// };
export const database = {
  //logging: process.env.DB_LOGGING === "true",
  host: "srv1331.hstgr.io",
  port: 3306,
  name: "u448961291_course_platf",
  user: "u448961291_course_platf",
  password: "Course@platfor123",
};
// console.log("");

// export const database = {
//   logging: process.env.DB_LOGGING === "true",
//   username: "u448961291_course_platfor",
//   password: "Course@platfor123",
//   database: "u448961291_course_platfor",
//   host: "srv1331.hstgr.io",
//   port: 3306,
//   dialect: "mysql",
// };

export const shopify = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  apiVersion: process.env.SHOPIFY_API_VERSION || "2024-01",
  shopName: process.env.SHOPIFY_SHOP_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  vendor: process.env.SHOPIFY_VENDOR || "Course Platform",
  merchantId: process.env.SHOPIFY_MERCHANT_ID,
};

export const storage = {
  provider:
    process.env.STORAGE_PROVIDER ||
    (process.env.NODE_ENV === "development" ? "local" : "s3"),
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET,
    endpoint: process.env.S3_ENDPOINT,
  },
  b2: {
    accountId: process.env.B2_ACCOUNT_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucketId: process.env.B2_BUCKET_ID,
    bucketName: process.env.B2_BUCKET_NAME,
  },
  bunny: {
    storageZone: process.env.BUNNY_STORAGE_ZONE,
    apiKey: process.env.BUNNY_API_KEY,
    region: process.env.BUNNY_REGION || "de",
  },
};

export const limits = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 100, // 100MB
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 1024 * 1024 * 500, // 500MB
  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 50,
};

export const jwt = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
};
