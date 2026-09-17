const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  id: { type: String },
  fullName: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  registerNumber: { type: String, required: true, unique: true, trim: true },
  username: { type: String, trim: true },
  password: { type: String, default: "123456" },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  department: { type: String, trim: true, default: "AI&DS" },
  year: { type: mongoose.Schema.Types.Mixed, default: "IV" },
  section: { type: String, trim: true, default: "A" },
  cgpa: { type: Number, default: 0 },
  attendance: { type: Number, default: 85 },
  tenthPercentage: { type: mongoose.Schema.Types.Mixed, default: "" },
  twelfthPercentage: { type: mongoose.Schema.Types.Mixed, default: "" },
  activeArrears: { type: Number, default: 0 },
  historyArrears: { type: Number, default: 0 },
  skills: { type: [String], default: [] },
  certifications: { type: mongoose.Schema.Types.Mixed, default: [] },
  internships: { type: mongoose.Schema.Types.Mixed, default: [] },
  projects: { type: mongoose.Schema.Types.Mixed, default: [] },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  skillGap: { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
  readinessScore: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  placementStatus: { type: String, default: "Eligible" },
  aptitudeScore: { type: Number, default: 75 },
  logicalScore: { type: Number, default: 80 },
  quantScore: { type: Number, default: 75 },
  verbalScore: { type: Number, default: 80 },
  codingScore: { type: Number, default: 70 },
  aptitudeHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  avatarUrl: { type: String, default: "" },
  resumeScore: { type: Number, default: 75 },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  uploadedBy: { type: String, trim: true, index: true, default: "" }
}, {
  timestamps: true
});

studentSchema.pre("save", function(next) {
  if (!this.name && this.fullName) this.name = this.fullName;
  if (!this.fullName && this.name) this.fullName = this.name;
  if (!this.username) this.username = (this.registerNumber || "").toLowerCase();
  if (!this.id && this.registerNumber) this.id = `std_${this.registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;
  if (this.readinessScore && !this.score) this.score = this.readinessScore;
  if (this.score && !this.readinessScore) this.readinessScore = this.score;
  next();
});

module.exports = mongoose.model("Student", studentSchema);