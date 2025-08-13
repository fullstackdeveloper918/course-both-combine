import express from "express";
import { getFiles, getFile, uploadFile, updateFile, deleteFile } from "../controllers/fileController.js";

const router = express.Router();

router.get("/", getFiles);
router.get("/:id", getFile);
router.post("/", uploadFile);
router.put("/:id", updateFile);
router.delete("/:id", deleteFile);

export default router; 