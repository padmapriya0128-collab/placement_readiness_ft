const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  fileType: { type: String, default: "csv" },
  uploadDate: { type: String, default: () => new Date().toISOString().replace('T', ' ').slice(0, 16) },
  recordCount: { type: Number, default: 0 },
  missingValues: { type: Number, default: 0 },
  dataQualityScore: { type: Number, default: 95 },
  dataPreview: { type: mongoose.Schema.Types.Mixed, default: [] },
  uploadedBy: { type: String, trim: true, index: true, default: "" }
}, {
  timestamps: true
});

module.exports = mongoose.model("Dataset", datasetSchema);
