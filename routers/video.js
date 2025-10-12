import express from "express";
import isAuthenticated from "../middleware/isPermitted.js";
import {
  UploadVideo,
  updateVideo,
  deleteVideo,
  toLikeVideo,
  toDisLike,
  viewVideo
  
} from "../controllers/user.js";

const router = express.Router();

router.post("/upload", isAuthenticated, UploadVideo);
router.put("/:videoId", isAuthenticated, updateVideo);
router.delete("/:videoId", isAuthenticated, deleteVideo);
router.put("/like/:videoId", isAuthenticated, toLikeVideo);
router.put("/dislike/:videoId", isAuthenticated, toDisLike);
router.put("/view/:videoId", isAuthenticated, viewVideo);
export default router;
