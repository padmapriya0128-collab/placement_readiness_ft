const express = require("express");
const router = express.Router();
const placementDriveController = require("../controllers/placementDriveController");

router.get("/", placementDriveController.getPlacementDrives);
router.post("/publish", placementDriveController.publishPlacementDrive);
router.post("/test-email", placementDriveController.testSendGridEmail);
router.delete("/:id", placementDriveController.deletePlacementDrive);

module.exports = router;
