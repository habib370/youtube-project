import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true ,ref:"User"},
    videoId: { type: String, required: true },
    commentText: { type: String, required: true },
  },
  { timestamps: true }
);

const Comments =
  mongoose.models.Comments || mongoose.model("Comments", commentSchema);
export default Comments;
