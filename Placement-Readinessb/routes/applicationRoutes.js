const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

router.get("/", applicationController.getApplications);
router.post("/", applicationController.createApplication);
router.put("/:id", applicationController.updateApplicationStatus);

module.exports = router;
