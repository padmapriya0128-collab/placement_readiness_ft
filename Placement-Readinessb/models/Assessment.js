const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subject: { type: String, default: "General" },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  maxMarks: { type: Number, default: 100 },
  averageScore: { type: Number, default: 0 },
  createdBy: { type: String, default: "Faculty" },
  scores: [{
    studentId: { type: String },
    studentName: { type: String },
    registerNumber: { type: String },
    marksObtained: { type: Number, default: 0 },
    status: { type: String, default: "Present" }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Assessment", assessmentSchema);
