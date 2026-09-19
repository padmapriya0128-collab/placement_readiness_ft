const express = require("express");
const router = express.Router();
const multer = require("multer");
const studentController = require("../controllers/studentController");
const analyticsController = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token) {
      if (token.startsWith("Bearer ")) token = token.split(" ")[1];
      const secret = process.env.JWT_SECRET || "placement_readiness_secret_key";
      req.user = jwt.verify(token, secret);
    }
  } catch (err) {}
  next();
};

const upload = multer({ storage: multer.memoryStorage() });

// Import & Excel Processing Routes
router.post("/import/preview", optionalAuth, upload.single("file"), studentController.importPreview);
router.post("/import/confirm", optionalAuth, studentController.importConfirm);
router.get("/import/history", optionalAuth, studentController.getImportHistory);

// Bulk Operation Routes
router.put("/bulk-update", optionalAuth, studentController.bulkUpdateStudents);
router.delete("/bulk-delete", optionalAuth, studentController.bulkDeleteStudents);
router.post("/bulk", optionalAuth, studentController.bulkUploadStudents);

// Standard Student CRUD Routes
router.get("/", optionalAuth, studentController.getAllStudents);
router.post("/", optionalAuth, studentController.createStudent);
router.get("/profile/:registerNumber", optionalAuth, studentController.getProfileByRegisterNumber);
router.get("/:id", optionalAuth, studentController.getStudentById);
router.put("/:id", optionalAuth, studentController.updateStudent);
router.delete("/:id", optionalAuth, studentController.deleteStudent);

// Profile & Analytics
router.get("/user/profile", studentController.getProfile);
router.get("/user/placement-score", studentController.getPlacementScore);
router.get("/user/analyze", analyticsController.analyzeStudent);

module.exports = router;