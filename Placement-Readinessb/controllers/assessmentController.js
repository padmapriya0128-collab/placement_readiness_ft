const Assessment = require("../models/Assessment");

exports.getAssessments = async (req, res) => {
  try {
    const list = await Assessment.find({}).sort({ createdAt: -1 });
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const body = req.body;
    const id = body.id || `assess_${Date.now()}`;
    const assessment = await Assessment.create({
      ...body,
      id
    });
    return res.status(201).json(assessment);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const id = req.params.id;
    await Assessment.deleteOne({ id });
    return res.status(200).json({ success: true, message: "Assessment deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssessmentScores = async (req, res) => {
  try {
    const id = req.params.id;
    const assess = await Assessment.findOne({ id });
    if (!assess) return res.status(404).json({ success: false, message: "Assessment not found" });
    return res.status(200).json(assess.scores || []);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveAssessmentScores = async (req, res) => {
  try {
    const id = req.params.id;
    const { scores } = req.body;
    const assess = await Assessment.findOne({ id });
    if (!assess) return res.status(404).json({ success: false, message: "Assessment not found" });

    assess.scores = scores || [];
    const presents = assess.scores.filter(s => s.status === 'Present');
    const total = presents.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    assess.averageScore = presents.length > 0 ? Number((total / presents.length).toFixed(1)) : 0;

    await assess.save();
    return res.status(200).json({ success: true, assessment: assess });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
