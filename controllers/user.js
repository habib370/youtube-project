import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import User from "../Models/user.js";
import Videos from "../Models/video.js";
import Comments from "../Models/comment.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const signin = async (req, res) => {
  const { channelName, email, phone, password } = req.body;
  if (!channelName || !email || !phone || !password) {
    return res.json({ ok: false, message: "entities required" });
  }
  try {
    const CheckUser = await User.findOne({ email });
    if (CheckUser) {
      return res.json({ ok: false, message: "user exists with same email" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const uploadedImage = await cloudinary.uploader.upload(
      req.files.logo.tempFilePath
    );

    const newUser = new User({
      channelName: channelName,
      email: email,
      phone: phone,
      password: hashedPassword,
      logoUrl: uploadedImage.secure_url,
      logoId: uploadedImage.public_id,
    });
    const user = await newUser.save();
    res.status(200).json({
      ok: true,
      newUser: user,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ ok: false, message: `from signin:${error.message}` });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ ok: false, message: "entities required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ ok: false, message: "incorrect email or password" });
    }
    if (user.isLoggedIn) {
      return res.json({ ok: false, message: "already logged in" });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.json({ ok: false, message: "incorrect password" });
    }
    user.isLoggedIn = true;
    await user.save();
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        password: user.password,
        phone: user.phone,
        logoUrl: user.logoUrl,
        logoId: user.logoId,
        isLoggedIn: user.isLoggedIn,
        subscribers: user.subscribers,
        subscribedChannels: user.subscribedChannels,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 86400 * 1000 * 7,
    });
    res.json({ ok: true, message: "logged in successfully", token: token });
  } catch (error) {
    res.json({ ok: false, message: `from login:${error.message}` });
  }
};

export const UploadVideo = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.json({ ok: false, message: "no token found" });
  }
  const user = await jwt.verify(token, process.env.JWT_SECRET);
  if (!user.isLoggedIn) {
    return res.json({ ok: false, message: "not logged in " });
  }
  try {
    const { title, description, category, tags } = req.body;
    const { video, thumbnail } = req.files;
    if (!title || !description || !category || !tags || !video || !thumbnail) {
      return res.json({ ok: false, message: "entities required" });
    }
    const uploadedImage = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath
    );
    const uploadedVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
      }
    );
    console.log(uploadedImage);
    const newVideo = new Videos({
      userId: user._id,
      videoUrl: uploadedVideo.secure_url,
      videoId: uploadedVideo.public_id,
      thumbnailUrl: uploadedImage.secure_url,
      thumbnailId: uploadedImage.public_id,
      title: title,
      description: description,
      category: category,
      tags: tags.split(",").map((tag) => tag.trim()),
    });
    await newVideo.save();
    console.log(newVideo);
    res.json({ ok: true, message: "video uploaded successfully" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from uploadVideo:${error.message}` });
  }
};

export const updateVideo = async (req, res) => {
  const { title, description, category, tags } = req.body;

  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not provided" });
    }
    const verifyUser = jwt.verify(token, process.env.JWT_SECRET);
    const video = await Videos.findById(req.params.videoId);

    if (verifyUser._id == video.userId) {
      if (req.files) {
        await cloudinary.uploader.destroy(video.thumbnailId);
        const updatedThumbnail = await cloudinary.uploader.upload(
          req.files.thumbnail.tempFilePath
        );
        console.log(updatedThumbnail);
        const updatedData = {
          thumbnailUrl: updatedThumbnail.secure_url,
          thumbnailId: updatedThumbnail.public_id,
          title: title,
          description: description,
          category: category,
          tags: tags.split(",").map((tag) => tag.trim()),
        };
        const updatedVideoDetails = await Videos.findByIdAndUpdate(
          req.params.videoId,
          updatedData,
          { new: true }
        );
        return res.json({
          ok: true,
          message: "changes updated",
          updatedVideo: updatedVideoDetails,
        });
      } else {
        const updatedData = {
          title: title,
          description: description,
          category: category,
          tags: tags.split(",").map((tag) => tag.trim()),
        };
        const updatedVideoDetails = await Videos.findByIdAndUpdate(
          req.params.videoId,
          updatedData,
          { new: true }
        );
        return res.json({
          ok: true,
          message: "changes updated",
          updatedVideo: updatedVideoDetails,
        });
      }
    } else {
      return res.json({ ok: false, message: "not permitted to change" });
    }
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from updateVideo:${error.message}` });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const verifiedUser = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const video = await Videos.findById(req.params.videoId);

    if (video.userId == verifiedUser._id) {
      await cloudinary.uploader.destroy(video.thumbnailId);
      await cloudinary.uploader.destroy(video.videoId, {
        resource_type: "video",
      });
      const deletedResponse = await Videos.findByIdAndDelete(
        req.params.videoId
      );
      return res.json({
        ok: true,
        message: "deleted successfully",
        deletedResponse: deletedResponse,
      });
    } else {
      return res.json({ ok: false, message: "not permitted to change" });
    }
  } catch (error) {
    res.json({ ok: false, message: `from deleteVideo:${error.message}` });
  }
};

export const toLikeVideo = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not provided" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user) {
      return res.json({ ok: false, message: "user not found" });
    }
    const video = await Videos.findById(req.params.videoId);
    const alreadyLiked = video.likedBy.includes(user._id);
    if (alreadyLiked) {
      return res.json({ ok: false, message: "already liked" });
    }
    video.likedBy.push(user._id);
    video.likes += 1;
    if (video.disLikedBy.includes(user._id)) {
      video.disLikedBy = video.disLikedBy.filter(
        (id) => id.toString() !== user._id.toString()
      );
      video.dislikes = video.dislikes - 1;
    }
    await video.save();
    res.json({ ok: true, message: "liked!" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from toLikeVideo:${error.message}` });
  }
};

export const toDisLike = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const video = await Videos.findById(req.params.videoId);

    const isDisLiked = await video.disLikedBy.includes(user._id);
    if (isDisLiked) {
      return res.json({ ok: false, message: "already disliked" });
    }
    video.disLikedBy.push(user._id);
    video.dislikes += 1;
    if (video.likedBy.includes(user._id)) {
      video.likedBy = video.likedBy.filter(
        (id) => id.toString() !== user._id.toString()
      );
      video.likes = video.likes - 1;
    }

    await video.save();
    res.json({ ok: true, message: "disliked" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from toDisLike ${error.message}` });
  }
};

export const toSubscribe = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userDetails = await User.findById(user._id);
    const channel = await User.findById(req.params.channelId);

    if (channel.subscribedBy.includes(user._id)) {
      return res.json({ ok: false, message: "already subscribed" });
    }
    channel.subscribers = channel.subscribers + 1;
    channel.subscribedBy.push(user._id);
    await channel.save();
    userDetails.subscribedChannels.push(channel._id);
    userDetails.save();
    res.json({ ok: true, message: "subscribed" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from toSubscribe:${error.message}` });
  }
};

export const toUnsubscribe = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userDetails = await User.findById(user._id);
    const channel = await User.findById(req.params.channelId);
    if (channel.subscribedBy.includes(user._id)) {
      channel.subscribedBy = channel.subscribedBy.filter(
        (id) => id.toString() !== user._id.toString()
      );
      channel.subscribers = channel.subscribers - 1;
      userDetails.subscribedChannels = userDetails.subscribedChannels.filter(
        (id) => id.toString() !== channel._id.toString()
      );
    }
    await userDetails.save();
    await channel.save();
    res.json({ ok: true, message: "unsubscribed" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from toUnsubscribe:${error.message}` });
  }
};

export const viewVideo = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const video = await Videos.findById(req.params.videoId);

    if (!video.viewedBy.includes(user._id)) {
      video.views += 1;
      video.viewedBy.push(user._id);
      await video.save();
      return res.json({ ok: true, message: "video viewed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from viewVideo:${error.message}` });
  }
};

export const toComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const video = await Videos.findById(req.params.videoId);
    const newComment = new Comments({
      userId: user._id,
      videoId: video._id,
      commentText: req.body.commentText,
    });
    await newComment.save();
    res.json({ ok: true, comment: newComment });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from toComment:${error.message}` });
  }
};

export const getAllComment = async (req, res) => {
  try {
    const allComments = await Comments.find({
      videoId: req.params.videoId,
    }).populate("userId", "channelName logoUrl");
    res.json({ ok: true, comments: allComments });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from getAllComment:${error.message}` });
  }
};

export const editComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const comment = await Comments.findById(req.params.commentId);
  
    if (user._id.toString() !== comment.userId.toString()) {
      return res.json({ ok: false, message: "user id not matched" });
    }
    const thatComment = await Comments.findById(req.params.commentId);
    thatComment.commentText = req.body.editedComment;
    await thatComment.save();
    res.json({ ok: true, message: "edited", editedComment: thatComment });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, message: `from editComment:${error.message}` });
  }
};
export const deleteComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.json({ ok: false, message: "token not found" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const comment = await Comments.findById(req.params.commentId);
    if (user._id.toString() !== comment.userId.toString()) {
      return res.json({ ok: false, message: "user id not matched" });
    }
    const deletedComment = await Comments.findByIdAndDelete(
      req.params.commentId
    );

    res.json({
      ok: true,
      message: "comment deleted",
      deletedComment: deletedComment,
    });
  } catch (error) {
    console.log(error);
    res.json({ ok: "false", message: `from deleteComment:${error.message}` });
  }
};
