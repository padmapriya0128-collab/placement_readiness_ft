const mongoose = require("mongoose");

const studentApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  registerNumber: { type: String, required: true },
  studentName: { type: String, default: "" },
  department: { type: String, default: "" },
  year: { type: String, default: "" },
  passingYear: { type: String, default: "" },
  cgpa: { type: Number, default: 0 },
  companyId: { type: String, required: true },
  companyName: { type: String, default: "" },
  jobRole: { type: String, default: "" },
  salaryPackage: { type: String, default: "" },
  appliedAt: { type: String, default: () => new Date().toISOString() },
  appliedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, default: "Applied" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  degree: { type: String, default: "B.E / B.Tech" },
  resumeUrl: { type: String, default: "" },
  skillsSubmitted: [{ type: String }],
  certificationsSubmitted: [{ type: String }],
  customAnswers: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

module.exports = mongoose.model("StudentApplication", studentApplicationSchema);
