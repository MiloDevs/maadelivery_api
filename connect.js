const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    if (mongoose.connections[0].readyState) {
        console.log("Already connected.");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection error", error);
    }
};

module.exports = connectDB;