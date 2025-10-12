import express from "express";
const router = express.Router();
import isAuthenticated from "../middleware/isPermitted.js";
import {
  signin,
  login,
  toSubscribe,
  toUnsubscribe,
} from "../controllers/user.js";
router.post("/signin", signin);
router.post("/login", login);
router.put("/subscribe/:channelId", isAuthenticated, toSubscribe);
router.put("/unsubscribe/:channelId", isAuthenticated, toUnsubscribe);
router.put("/unsubscribe/:channelId", isAuthenticated, toUnsubscribe);
export default router;
