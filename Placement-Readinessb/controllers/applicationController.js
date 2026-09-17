const StudentApplication = require("../models/StudentApplication");

exports.getApplications = async (req, res) => {
  try {
    const list = await StudentApplication.find({}).sort({ createdAt: -1 });
    return res.status(200).json(list);
  } catch (error) {
    console.warn("⚠️ Applications DB query fallback:", error.message);
    return res.status(200).json([]);
  }
};

exports.createApplication = async (req, res) => {
  try {
    const body = req.body;
    const studentId = body.studentId;
    const registerNumber = body.registerNumber;
    const companyId = body.companyId;

    // Check if application already exists for student and company
    let existing = null;
    if (studentId && companyId) {
      existing = await StudentApplication.findOne({ studentId, companyId });
    }
    if (!existing && registerNumber && companyId) {
      existing = await StudentApplication.findOne({ registerNumber, companyId });
    }

    if (existing) {
      const updated = await StudentApplication.findOneAndUpdate(
        { id: existing.id },
        { ...body, status: body.status || existing.status },
        { new: true }
      );
      return res.status(200).json(updated);
    }

    const id = body.id || `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const app = await StudentApplication.create({
      ...body,
      id
    });
    return res.status(201).json(app);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const app = await StudentApplication.findOneAndUpdate({ id }, { status }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });
    return res.status(200).json(app);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
