const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, default: "" },
  jobRole: { type: String, default: "" },
  salaryPackage: { type: String, default: "" },
  cgpaCutoff: { type: Number, default: 0 },
  allowedDepartments: { type: [String], default: [] },
  year: { type: String, default: "2026" },
  requiredSkills: { type: [String], default: [] },
  requiredCertifications: { type: [String], default: [] },
  internshipRequired: { type: String, default: "No" },
  requiredProjects: { type: Number, default: 0 },
  maxActiveArrears: { type: Number, default: 0 },
  eligibleGender: { type: String, default: "All" },
  applicationDeadline: { type: String, default: "" },
  selectionProcess: { type: String, default: "" },
  description: { type: String, default: "" },
  googleFormLink: { type: String, default: "" },
  additionalInstructions: { type: String, default: "" },
  status: { type: String, default: "Active" },
  educationalQualification: { type: String, default: "" },
  vacancies: { type: String, default: "" },
  employmentType: { type: String, default: "Full-Time" },
  workMode: { type: String, default: "Onsite" },
  recruitmentDate: { type: String, default: "" },
  circularRefNo: { type: String, default: "" },
  circularDate: { type: String, default: "" },
  driveVenue: { type: String, default: "" },
  bond: { type: String, default: "" },
  positionOverview: { type: String, default: "" },
  tenthCutoff: { type: Number, default: 0 },
  twelfthCutoff: { type: Number, default: 0 },
  minAptitudeScore: { type: Number, default: 0 },
  manuallyIncludedStudentIds: { type: [String], default: [] },
  customFields: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model("Company", companySchema);
