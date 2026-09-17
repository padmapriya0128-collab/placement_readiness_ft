const mongoose = require("mongoose");

const importHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  uploadDate: { type: String, default: () => new Date().toISOString().replace('T', ' ').slice(0, 16) },
  uploadedBy: { type: String, default: "Faculty" },
  totalRows: { type: Number, default: 0 },
  successfulRows: { type: Number, default: 0 },
  updatedRows: { type: Number, default: 0 },
  skippedRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  status: { type: String, default: "Completed" },
  details: { type: mongoose.Schema.Types.Mixed, default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model("ImportHistory", importHistorySchema);
