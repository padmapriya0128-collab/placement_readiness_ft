const express = require("express");

const router = express.Router();

const facultyController = require("../controllers/facultyController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const upload = require("../middleware/uploadMiddleware");

// Faculty Profile
router.get(
    "/profile",
    authMiddleware,
    roleMiddleware("Faculty"),
    facultyController.getProfile
);

// Get All Students
router.get(
    "/students",
    authMiddleware,
    roleMiddleware("Faculty"),
    facultyController.getStudents
);

// Upload Dataset
router.post(
    "/upload-dataset",
    authMiddleware,
    roleMiddleware("Faculty"),
    upload.single("file"),
    facultyController.uploadDataset
);

module.exports = router;