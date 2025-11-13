import mongoose from "mongoose";

const mongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("database Connected 👍");
  } catch (error) {
    console.error("mongoDB connection failed", error.message);
  }
};
export default mongoDB;