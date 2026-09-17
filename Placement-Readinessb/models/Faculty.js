const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const facultySchema = new mongoose.Schema({
  id: { type: String },
  fullName: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  facultyId: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  department: { type: String, default: "AI&DS", trim: true },
  phone: { type: String, default: "" },
  role: { type: String, default: "Faculty" }, // "Faculty" or "Placement Faculty"
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

facultySchema.pre("save", async function(next) {
  if (!this.name) this.name = this.fullName;
  if (!this.fullName) this.fullName = this.name;
  if (!this.id) this.id = `fac_${Date.now()}`;
  if (this.isModified("password") && !this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

facultySchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
    return enteredPassword === this.password;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Faculty", facultySchema);