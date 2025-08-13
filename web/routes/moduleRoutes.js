import express from "express";
import {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  //   exportModules,
  //   importModules,
  CreateModulesFromcsv,
  DownloadModuleContent,
} from "../controllers/moduleController.js";
import { csvupload } from "../middleware/MulterMiddelware.js";

const router = express.Router();

router.get("/", getModules);
router.get("/:id", getModule);
router.post("/", createModule);
router.put("/:id", updateModule);
router.delete("/:id", deleteModule);
// router.get("/bulkupload", exportModules);
router.post("/bulkupload", csvupload, CreateModulesFromcsv);
router.get("/DownloadModuleContent/:id", DownloadModuleContent);

export default router;
