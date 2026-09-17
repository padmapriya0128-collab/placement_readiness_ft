const express = require("express");
const router = express.Router();
const multer = require("multer");
const studentController = require("../controllers/studentController");
const analyticsController = require("../controllers/analyticsController");

const upload = multer({ storage: multer.memoryStorage() });

// Import & Excel Processing Routes
router.post("/import/preview", upload.single("file"), studentController.importPreview);
router.post("/import/confirm", studentController.importConfirm);
router.get("/import/history", studentController.getImportHistory);

// Bulk Operation Routes
router.put("/bulk-update", studentController.bulkUpdateStudents);
router.delete("/bulk-delete", studentController.bulkDeleteStudents);
router.post("/bulk", studentController.bulkUploadStudents);

// Standard Student CRUD Routes
router.get("/", studentController.getAllStudents);
router.post("/", studentController.createStudent);
router.get("/profile/:registerNumber", studentController.getProfileByRegisterNumber);
router.get("/:id", studentController.getStudentById);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

// Profile & Analytics
router.get("/user/profile", studentController.getProfile);
router.get("/user/placement-score", studentController.getPlacementScore);
router.get("/user/analyze", analyticsController.analyzeStudent);

module.exports = router;