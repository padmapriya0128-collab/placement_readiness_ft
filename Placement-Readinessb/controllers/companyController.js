const Company = require("../models/Company");

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 });
    return res.status(200).json(companies);
  } catch (error) {
    console.warn("⚠️ Companies DB query fallback:", error.message);
    return res.status(200).json([]);
  }
};

exports.addCompany = async (req, res) => {
  try {
    const body = req.body;
    const companyId = body.id || `co_${Date.now()}`;
    const company = await Company.create({
      ...body,
      id: companyId
    });
    return res.status(201).json(company);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const id = req.params.id;
    const company = await Company.findOneAndUpdate({ id }, req.body, { new: true });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    return res.status(200).json(company);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const id = req.params.id;
    await Company.deleteOne({ id });
    return res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
