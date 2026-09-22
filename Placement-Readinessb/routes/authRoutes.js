const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/student-login", authController.studentLogin);
router.post("/faculty-login", authController.facultyLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/send-verification-otp", authController.sendVerificationOTP);
router.post("/verify-login-otp", authController.verifyLoginOTP);
router.get("/me", authController.me);
router.post("/logout", authController.logout);

module.exports = router;