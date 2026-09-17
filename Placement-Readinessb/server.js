require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");
const seedDatabase = require("./seed");

const PORT = process.env.PORT || 5000;

console.log("PORT =", PORT);
console.log("MONGODB_URI =", process.env.MONGODB_URI ? "Loaded ✅" : "Missing ❌");
console.log("JWT_SECRET =", process.env.JWT_SECRET ? "Loaded ✅" : "Missing ❌");

async function startServer() {
  try {
    const connected = await connectDB();
    if (connected) {
      await seedDatabase().catch((err) => console.error("Seeding error:", err));
    }
  } catch (err) {
    console.error("Database connection warning:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();