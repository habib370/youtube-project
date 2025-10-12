import express from "express";
import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoDB from "./config/mongo.js";
import UserRoutes from "./routers/user.js";
import VideoRoutes from "./routers/video.js";
import CommentRoute from "./routers/comment.js";
import fileUpload from "express-fileupload";
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = ["http://localhost:5173"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use("/user", UserRoutes);
app.use("/video", VideoRoutes);
app.use("/comment", CommentRoute);
const PORT = process.env.PORT || 7000;
mongoDB();
app.listen(PORT, () => {
  console.log(`server is running on port:${PORT}`);
});
