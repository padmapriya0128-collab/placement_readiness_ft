const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");

router.get("/", assessmentController.getAssessments);
router.post("/", assessmentController.createAssessment);
router.delete("/:id", assessmentController.deleteAssessment);
router.get("/:id/scores", assessmentController.getAssessmentScores);
router.post("/:id/scores", assessmentController.saveAssessmentScores);

module.exports = router;
