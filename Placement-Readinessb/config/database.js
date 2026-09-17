const mongoose = require("mongoose");

let isMemoryServerStarted = false;

const startInMemoryServer = async () => {
  if (isMemoryServerStarted) return true;
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    console.log("🔄 Starting in-memory MongoDB server fallback...");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      try { await mongoose.disconnect(); } catch (e) {}
    }
    
    const conn = await mongoose.connect(mongoUri);
    isMemoryServerStarted = true;
    console.log("✅ In-Memory MongoDB Connected Successfully");
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);

    // Seed database with default records
    try {
      const seedDatabase = require("../seed");
      await seedDatabase();
    } catch (sErr) {
      console.error("Seeding error on in-memory DB:", sErr.message);
    }

    return true;
  } catch (memErr) {
    console.warn("⚠️ In-memory MongoDB fallback failed:", memErr.message || memErr);
    return false;
  }
};

const connectDB = async () => {
  // 1. Try connecting to MongoDB Atlas URI if provided
  if (process.env.MONGODB_URI) {
    try {
      console.log("📡 Connecting to MongoDB Atlas...");
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500,
      });

      console.log("✅ MongoDB Connected Successfully");
      console.log(`📂 Database: ${conn.connection.name}`);
      console.log(`🌐 Host: ${conn.connection.host}`);

      mongoose.connection.on("error", async (err) => {
        console.error("⚠️ Mongoose connection error:", err.message);
        if (!isMemoryServerStarted && mongoose.connection.readyState !== 1) {
          console.log("🔄 Fallback: Switching Mongoose to in-memory database...");
          await startInMemoryServer();
        }
      });

      return true;
    } catch (error) {
      console.error("❌ MongoDB Atlas Connection Failed:", error.message || error);
    }
  }

  // 2. Fallback to MongoMemoryServer for local/offline dev
  return await startInMemoryServer();
};

module.exports = connectDB;