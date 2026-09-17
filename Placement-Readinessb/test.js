const mongoose = require("mongoose");

const uri = "mongodb://aneeshaarumugam_db_user:POHDhzdPUwKEJ6Rc@ac-p6fpom8-shard-00-00.4u8xk23.mongodb.net:27017,ac-p6fpom8-shard-00-01.4u8xk23.mongodb.net:27017,ac-p6fpom8-shard-00-02.4u8xk23.mongodb.net:27017/placement_db?ssl=true&replicaSet=atlas-1w08dw-shard-0&authSource=admin&appName=Cluster0";

console.log("Connecting to direct replica set URI...");

mongoose.connect(uri)
  .then((conn) => {
    console.log("✅ Connected Successfully to Database:", conn.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  });