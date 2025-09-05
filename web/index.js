// @ts-check
import express from "express";
import dotenv from "dotenv";
import { join } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import serveStatic from "serve-static";
// import fetch from "node-fetch";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import sequelize from "./config/database.js";

//  Manually import models
import "./models/Course.js";
import "./models/Module.js";
import "./models/Lesson.js";
import "./models/File.js";
import "./models/User.js";
import "./models/Progress.js";
import "./models/CourseAccess.js";
import "./models/associations.js"; // if you're defining associations separately
import Merchant from "./models/Merchant.js";

import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import { errorHandler } from "./utils/ApiUtilis.js";
import { DownloadCourseContent } from "./controllers/courseController.js";
import Lesson from "./models/Lesson.js";
// import { where } from "sequelize";
import Course from "./models/Course.js";
import {
  createCollection,
  deleteBunnyStorageFile,
  deleteBunnyVideo,
  deleteStreamCollection,
  updateCollectionName,
  waitForVideoProcessing,
} from "./utils/bunnyUtilis.js";
import cors from "cors";
import slug from "slug";
import Module from "./models/Module.js";
import File from "./models/File.js";

// Load environment variables
dotenv.config();

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

// Initialize Express app

const app = express();
app.use(cors());
// app.use(cors({
//   origin: "*",
//   methods: "*",
//   allowedHeaders: "*"
// }));
app.use(express.urlencoded({ extended: true, limit: "800mb" }));
// app.use(express.static("./uploads"));
// parse application/json
app.use(express.json({ limit: "800mb" }));
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const StreamApiKEY = process.env.STREAM_API_KEY;
const StreamSecureTokenApi = process.env.STREAM_SECURE_TOKEN_KEY;
const LibId = process.env.STREAM_LIB_ID;
// Serve static files based on environment
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

// Shopify Authentication
app.get(shopify.config.auth.path, shopify.auth.begin());

// Helper to register all Shopify webhooks for a shop
async function registerAllWebhooks(shop, accessToken) {
  const topics = [
    "orders/create",
    "orders/cancelled",
    "customers/create",
    "customers/update",
    "products/create",
    "products/update",
    "products/delete",
  ];
  const baseUrl = process.env.APP_BASE_URL;

  for (const topic of topics) {
    const address = `${baseUrl}/api/${topic.replace("/", "/")}`;

    try {
      const response = await fetch(
        `https://${shop}/admin/api/2023-10/webhooks.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address,
              format: "json",
            },
          }),
        }
      );
      const data = await response.json();
      console.log("Webhook Data", data);

      if (!response.ok) {
        console.error(`Failed to register webhook for ${topic}:`, data);
      }
    } catch (err) {
      console.error(`Error registering webhook for ${topic}:::`, err.message);
    }
  }
}

app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  (req, res, next) => {
    (async () => {
      try {
        const session = res.locals.shopify.session;
        const shopDomain = session.shop;
        let merchant = await Merchant.findOne({
          where: { shopifyDomain: shopDomain },
        });
        let isNew = false;
        if (!merchant) {
          merchant = await Merchant.create({
            shopifyDomain: shopDomain,
            shop: shopDomain,
            shopifyAccessToken: session.accessToken,
            email: session.email || null,
            name: session.shop || null,
          });
          isNew = true;
        } else if (merchant.get("shopifyAccessToken") !== session.accessToken) {
          // Update access token if it changed
          await merchant.update({ shopifyAccessToken: session.accessToken });
          isNew = true;
        }
        // Register webhooks if new merchant or access token changed
        if (isNew && process.env.APP_BASE_URL) {
          await registerAllWebhooks(shopDomain, session.accessToken);
        }
      } catch (err) {
        console.error("Error creating merchant on install:", err.message);
      }
      shopify.redirectToShopifyOrAppRoot()(req, res, next);
    })();
  }
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Convert HTML to plain text
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").trim();
};

app.post("/api/products/create", async (req, res) => {
  try {
    console.log("product create webhook received");

    const { id, title, vendor, status, variants, images } = req.body;

    if (!id || !status || !title || !status || !vendor) return;

    if (!variants?.length) {
      console.warn("No variants found");
      return res.status(200).send({ message: "No variants found" });
    }

    // Check if the product is already created
    const existingProduct = await Course.findOne({
      where: { shopifyProductId: id },
    });
    if (existingProduct) {
      // console.warn("Product already created");
      return res.status(200).send({ message: "product already created" });
    }
    // get the product description
    const description = stripHtml(req.body.body_html); // ✅ plain text description

    // find the merchant

    const merchant = await Merchant.findOne({
      where: { shopifyDomain: `${vendor}.myshopify.com` },
    });

    if (!merchant) {
      console.warn("No merchant found ");
      return res.status(200).send({ message: "No merchant found" });
    }

    // get the product price

    let price = variants[0].price;
    // get the product image
    let thumbnail;
    if (images?.length) {
      thumbnail = images[0].src;
    } else {
      thumbnail = process.env.DEFAULT_THUMBNAIL;
    }

    let merchantdetails = merchant.dataValues;
    // Creating a Collection
    let collectionId = await createCollection({
      LibraryId: merchantdetails?.StreamLibraryId || LibId,
      apiKey: merchantdetails?.StreamApiKEY || StreamApiKEY,
      name: slug(title),
    });
    let bunny_collection_id = collectionId?.guid;

    // create the course
    const course = await Course.create({
      title,
      description,
      thumbnail,
      shopifyProductId: id,
      shopifyHandle: req.body?.handle || "",
      price,
      status: req.body?.status,
      merchantId: merchantdetails.id,
      collectionid: bunny_collection_id,
    });

    console.log("Successfully created course");

    res.status(200).send({ message: "Webhook received" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).send({ message: "Internal server error" });
  }
});
app.post("/api/webhooks/orders/create", async (req, res) => {
  console.log(req.body, "req.body");
  res.status(200).send({ message: "Webhook received" });
});
app.post("/api/webhooks/orders/cancelled", async (req, res) => {
  console.log(req.body, "req.body");
  res.status(200).send({ message: "Webhook received" });
});
app.post("/api/webhooks/customers/create", async (req, res) => {
  // console.log(req.body, "product create data");
  res.status(200).send({ message: "Webhook received" });
});
app.post("/api/webhooks/customers/update", async (req, res) => {
  // console.log(req.body, "req.body");
  res.status(200).send({ message: "Webhook received" });
});

// update the product webhook
app.post("/api/products/update", async (req, res) => {
  try {
    console.log("product update webhook received");

    const { id, title, vendor, status, variants, images } = req.body;

    if (!id || !status || !title || !status || !vendor) return;

    if (!variants?.length) {
      console.warn("No variants  found");
      return res.status(200).send({ message: "No variants found" });
    }

    // // find the merchant

    const merchant = await Merchant.findOne({
      where: { shopifyDomain: `${vendor}.myshopify.com` },
    });

    if (!merchant) {
      console.warn("No merchant found ");
      return res.status(200).send({ message: "No merchant found" });
    }
    let merchantdetails = merchant.dataValues;

    // first get the metafields
    const metafields = await getProductMetafields(
      merchantdetails.shopifyDomain,
      merchantdetails.shopifyAccessToken,
      id
    );
    let sync_updated_at_value = metafields?.find(
      (metafield) => metafield.key === "sync_updated_at"
    )?.value;

    sync_updated_at_value = sync_updated_at_value
      ? new Date(sync_updated_at_value)
      : null;
    // // find the course
    const course = await Course.findOne({
      where: { shopifyProductId: id },
    });

    if (!course) {
      console.warn("No course found ");
      return res.status(200).send({ message: "No course found" });
    }

    let db_sync_updated_at_value = course.dataValues.sync_updated_at
      ? new Date(course.dataValues.sync_updated_at)
      : null;

    console.log("shopify update at", sync_updated_at_value);
    console.log("db updated at", db_sync_updated_at_value);

    if (sync_updated_at_value && db_sync_updated_at_value) {
      if (
        sync_updated_at_value?.getTime() === db_sync_updated_at_value?.getTime()
      ) {
        console.warn("No update found ");
        return res.status(200).send({ message: "No update found" });
      }
    }

    // // get the product description
    const description = stripHtml(req.body.body_html); // ✅ plain text description
    // // get the product price
    let price = variants[0].price;
    // // get the product image
    let thumbnail;
    // let thumbnailprovider;
    if (images?.length) {
      thumbnail = images[0].src;
      // if (
      //   thumbnail.startsWith(`https://${process.env.BUNNY_STORAGE_ZONE_NAME}`)
      // ) {
      //   thumbnailprovider = "bunny";
      // } else {
      //   thumbnailprovider = "shopify";
      // }
    } else {
      thumbnail = course.dataValues?.thumbnail;
      // thumbnailprovider = course.dataValues?.thumbnailprovider;
    }
    let previustitle = course.dataValues?.title;

    await course.update({
      title,
      description,
      thumbnail,
      // thumbnailprovider,
      shopifyHandle: req.body?.handle || "",
      price,
      status: req.body?.status,
    });

    if (previustitle !== title) {
      // Update the bunny collection name
      let collectionUpdateResponse = await updateCollectionName({
        LibraryId: merchantdetails?.StreamLibraryId || LibId,
        collectionId: course.dataValues.collectionid,
        newName: slug(title),
        apiKey: merchantdetails?.StreamApiKEY || StreamApiKEY,
      });

      if (!collectionUpdateResponse.success) {
        console.warn(
          `❌ Failed to update collection name ${collectionUpdateResponse?.error}`
        );
      }
    }
    res.status(200).send({ message: "Webhook received" });
  } catch (error) {
    console.log(error, "error....");
    res.status(500).send({ message: "Internal server error" });
  }
});

// delete the product webhook
// TODO:
app.post("/api/products/delete", async (req, res) => {
  try {
    console.log("delete product webhook received");

    const { id } = req.body;

    console.log("id...", id);
    const course = await Course.findOne({
      where: { shopifyProductId: id },
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

    if (!course) {
      return res.status(200).send({ message: "No course found" });
    }
    let merchantdetails = await Merchant.findOne({
      where: { id: course.merchantId },
    });
    if (!merchantdetails) {
      console.log("Merchant not found for this course.");
      return res
        .status(200)
        .send({ message: "merchant not found for this course" });
    }
    console.log("merchantdetails", merchantdetails.id);

    // Delete module, lesson files, thumbnails, and videos
    for (const module of course.modules || []) {
      for (const lesson of module.lessons || []) {
        for (const file of lesson.files || []) {
          if (file.destinationPath) {
            await deleteBunnyStorageFile(file.destinationPath);
          }
          await file.destroy();
        }

        if (lesson.thumbnailDestinationPath) {
          await deleteBunnyStorageFile(lesson.thumbnailDestinationPath);
        }

        if (lesson.videoId) {
          await deleteBunnyVideo(lesson.videoId);
        }
        await lesson.destroy();
      }
      await module.destroy();
    }

    // Delete course thumbnail and collection
    if (course.thumbnailDestinationPath) {
      await deleteBunnyStorageFile(course.thumbnailDestinationPath);
    }

    if (course.collectionid) {
      try {
        await deleteStreamCollection({
          LibraryId: merchantdetails.StreamLibraryId || LibId,
          collectionId: course.collectionid,
          apiKey: merchantdetails.StreamApiKEY || StreamApiKEY,
        });
        console.log("collection deleted successfully");
      } catch (error) {
        console.warn("Failed to delete course collection:", error.message);
      }
    }
    // let courseid = course.id;

    // Delete the course record from DB
    await course.destroy();

    console.log("product deleted successfully");

    res.status(200).send({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error Deleting product" });
  }
});

// method for get the product metafields
async function getProductMetafields(shopDomain, accessToken, productId) {
  const res = await fetch(
    `https://${shopDomain}/admin/api/2023-10/products/${productId}/metafields.json`,
    {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  return data.metafields; // array of metafields
}
// Bunny Streams WebHook
app.post("/api/BunnyStreamsWebhook", async (req, res) => {
  const { VideoLibraryId, VideoGuid, Status } = req.body;

  try {
    console.log("runninng...", VideoGuid);
    console.log("status", Status);

    if (Status === 3 || Status === 4) {
      const lesson = await Lesson.findOne({
        where: { videoId: VideoGuid },
        include: [
          {
            model: Merchant,
            as: "merchant", // ✅ make sure this matches your association alias
          },
        ],
      });

      if (!lesson) {
        return res
          .status(200)
          .json({ message: "Lesson not found, webhook received" });
      }

      console.log("lesson found....");

      // console.log("lesson data...", lesson?.merchant);

      const streamApiKey =
        lesson?.merchant?.streamApiKey || process.env.STREAM_API_KEY;

      const videoinfo = await waitForVideoProcessing({
        videoGuid: VideoGuid,
        LibraryId: VideoLibraryId,
        AccessKey: streamApiKey,
        maxTries: 1,
      });

      if (!videoinfo?.success) {
        return res
          .status(200)
          .send({ message: "Video info missing, webhook received" });
      }
      console.log("Updated the status....");

      await lesson.update({
        processingStatus: "completed",
        duration: videoinfo?.data?.length || 0,
      });
    } else if (Status === 5) {
      await Lesson.update(
        { processingStatus: "failed" },
        { where: { videoId: VideoGuid } } // ✅ fix case (you used `VideoId`)
      );
    }

    return res.status(200).send({ message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Error handling Bunny Stream webhook:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
});

app.use("/api/frontend/courses", courseRoutes);
app.use("/api/frontend/progress", progressRoutes);

// app.get("/api/downloadCourseContent/:id", DownloadCourseContent);
// Middleware

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }

  res.status(status).send({ success: status === 200, error });
});

// Serve frontend
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/progress", progressRoutes);

// Utility to get shop domain with dev fallback
function getShopDomain(req, res) {
  if (process.env.NODE_ENV === "development") {
    return process.env.DEV_SHOP_DOMAIN || "test-shop.myshopify.com";
  }
  const session = res.locals.shopify?.session || req.session;
  return session && session.shop ? session.shop : null;
}

(async () => {
  try {
    await sequelize.sync({ alter: false }); // or { force: true } for dev
    console.log("✅ All models were synchronized successfully.");
    app.listen(PORT, () => {
      console.log(`🚀 Server listening at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to synchronize the database:", error);
    process.exit(1);
  }
})();
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});
app.use(errorHandler);
