import express from "express";
import { toComment, getAllComment ,editComment,deleteComment} from "../controllers/user.js";
import isAuthenticated from "../middleware/isPermitted.js";
const router = express.Router();

router.post("/new-comment/:videoId",isAuthenticated, toComment);
router.get("/:videoId", getAllComment);
router.put("/edit-comment/:commentId",isAuthenticated, editComment);
router.delete("/delete-comment/:commentId",isAuthenticated, deleteComment);
export default router;
