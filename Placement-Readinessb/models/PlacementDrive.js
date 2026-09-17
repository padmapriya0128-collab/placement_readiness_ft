const mongoose = require("mongoose");

const placementDriveSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyId: { type: String, default: "" },
  companyName: { type: String, required: true },
  jobRole: { type: String, default: "" },
  salaryPackage: { type: String, default: "" },
  location: { type: String, default: "" },
  applicationDeadline: { type: String, default: "" },
  description: { type: String, default: "" },
  registrationFormUrl: { type: String, default: "" },
  pdfDataUrl: { type: String, default: "" },
  eligibilityCriteria: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: "Published" },
  publishedAt: { type: String, default: () => new Date().toISOString() },
  publishedBy: { type: String, default: "Placement Officer" },
  totalStudentsCount: { type: Number, default: 0 },
  eligibleStudentsCount: { type: Number, default: 0 },
  emailSentCount: { type: Number, default: 0 },
  emailFailedCount: { type: Number, default: 0 },
  emailPendingCount: { type: Number, default: 0 },
  deliveryStatus: { type: String, default: "Delivered" },
  eligibleStudentIds: { type: [String], default: [] },
  studentsList: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model("PlacementDrive", placementDriveSchema);
