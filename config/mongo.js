import mongoose from "mongoose";

const mongoDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://habibSh01:ZzcZhr2KHWQmjtWN@cluster0.wwm7qdq.mongodb.net/myDataBase",
      {
        serverApi: {
          version: "1",
          strict: true,
          deprecationErrors: true,
        },
        timeoutMS: 1
      }
    );
    console.log("database Connected 👍");
  } catch (error) {
    console.error("mongoDB connection failed", error.message);
  }
};
export default mongoDB;