import mongoose from 'mongoose'

const videoSchema=new mongoose.Schema({
  userId:{type:String,required:true},
  videoUrl:{type:String,required:true},
  thumbnailUrl:{type:String,required:true},
  videoId:{type:String,required:true},
  thumbnailId:{type:String,required:true},
  title:{type:String,required:true},
  description:{type:String,required:true},
  category:{type:String,required:true},
  tags:[{type:String }],
  likes:{type:Number,default:0},
  dislikes:{type:Number,default:0},
  views:{type:Number,default:0},
  likedBy:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  disLikedBy:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewedBy:[{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

},{timestamps:true})

const Videos = mongoose.models.Videos || mongoose.model("Videos", videoSchema);
export default Videos;