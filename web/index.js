// @ts-check
import express from "express";
import dotenv from "dotenv";
import { join } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import serveStatic from "serve-static";
import fetch from "node-fetch";

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
import { where } from "sequelize";
import Course from "./models/Course.js";
import { waitForVideoProcessing } from "./utils/bunnyUtilis.js";
import  cors from "cors";

// Load environment variables
dotenv.config();

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

// Initialize Express app

const app = express();
app.use(cors())
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

app.post("/api/products/create", async (req, res) => {
  try {
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
  console.log(req.body, "req.body");
  res.status(200).send({ message: "Webhook received" });
});
app.post("/api/webhooks/customers/update", async (req, res) => {
  console.log(req.body, "req.body");
  res.status(200).send({ message: "Webhook received" });
});

app.post("/api/products/update", async (req, res) => {
  try {
    console.log("product update", req.body);
    res.status(200).send({ message: "Webhook received" });
  } catch (error) {
    console.log(error, "error");
    res.status(500).send({ message: "Internal server error" });
  }
});
// Bunny Streams WebHook
app.post("/api/BunnyStreamsWebhook", async (req, res) => {
  const { VideoLibraryId, VideoGuid, Status } = req.body;

  try {
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
          .send({ message: "Lesson not found, webhook received" });
      }

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
// sequelize.sync({ alter: true });
app.use(errorHandler);
