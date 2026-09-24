const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendLoginVerificationEmail, sendForgotPasswordEmail } = require("../services/emailService");

// In-memory OTP cache for multi-step verification across requests
// Key: `verify_${email}` or `reset_${email}`
// Value: { otp, expires, attempts, token, role, user }
const otpCache = new Map();

// Helper to generate secure random 6-digit OTP string
function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

// 0. User Registration Endpoint with Single Placement Officer Restriction
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, department, role } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const pass = (password || "").trim();
    const name = (fullName || "").trim();
    const dept = (department || "AI&DS").trim();
    const requestedRole = (role || "Faculty").trim();

    if (!name || !cleanEmail || !pass) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Email, and Password are required for registration."
      });
    }

    if (pass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    // 1. STRICT SINGLE PLACEMENT OFFICER RESTRICTION (Requirement 1)
    const isOfficerRequest = requestedRole === "Placement Officer" || requestedRole === "Placement Faculty" || cleanEmail.includes("placement");
    if (isOfficerRequest) {
      // Find if ANY active Placement Officer account exists in MongoDB
      const existingOfficer = await Faculty.findOne({
        $or: [
          { role: "Placement Officer" },
          { role: "Placement Faculty" },
          { email: "placement@adithyatech.edu.in" }
        ]
      });

      if (existingOfficer && existingOfficer.email.toLowerCase() !== cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "STRICT RESTRICTION: Only ONE email address is permitted to hold the Placement Officer role in the system. Secondary Placement Officer registration is blocked."
        });
      }
    }

    // 2. Check duplicate registration
    const existingUser = await Faculty.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address is already registered. Please sign in instead."
      });
    }

    // 3. Register user with emailVerified: false (Req 2: OTP required on first verification)
    const finalRole = (requestedRole === "Placement Officer" || cleanEmail === "placement@adithyatech.edu.in") ? "Placement Faculty" : requestedRole;

    const newFaculty = new Faculty({
      fullName: name,
      name: name,
      email: cleanEmail,
      password: pass,
      department: dept,
      role: finalRole,
      emailVerified: false
    });

    await newFaculty.save();

    const secret = process.env.JWT_SECRET || "secret_key";
    const token = jwt.sign({ id: newFaculty._id, role: newFaculty.role, email: newFaculty.email }, secret, { expiresIn: "7d" });
    const userPayload = {
      id: newFaculty.id || newFaculty._id.toString(),
      name: newFaculty.fullName || newFaculty.name,
      email: newFaculty.email,
      department: newFaculty.department,
      role: newFaculty.role,
      avatarUrl: ""
    };

    const generatedOtp = generateSecureOTP();
    otpCache.set(`verify_${cleanEmail}`, {
      otp: generatedOtp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      token,
      role: newFaculty.role,
      user: userPayload
    });

    // Send Login OTP via Centralized Resend Service
    await sendLoginVerificationEmail({
      to: cleanEmail,
      otp: generatedOtp,
      userName: name
    });

    return res.status(201).json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      role: newFaculty.role,
      message: `Registration successful! A 6-digit verification code has been sent to ${cleanEmail}.`
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Unified Login Endpoint
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password, role } = req.body;
    const input = (usernameOrEmail || "").trim();
    const pass = password || "";
    const roleSelected = role || "Faculty";

    if (!input) {
      return res.status(400).json({ success: false, message: "Email or username is required." });
    }
    if (!pass) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    const secret = process.env.JWT_SECRET || "secret_key";

    if (roleSelected === "Faculty" || roleSelected === "Placement Faculty" || roleSelected === "Placement Officer") {
      // Find faculty in DB
      let faculty = await Faculty.findOne({
        $or: [
          { email: input.toLowerCase() },
          { facultyId: input },
          { username: input.toLowerCase() }
        ]
      });

      if (!faculty) {
        return res.status(401).json({
          success: false,
          message: "Incorrect role or credentials."
        });
      }

      // 1. Password Verification (Requirement 2)
      const isMatch = await faculty.comparePassword(pass);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please try again."
        });
      }

      // 2. Strict Role Match Verification (Requirement 1 & 4)
      const isOfficerRole = roleSelected === "Placement Officer" || roleSelected === "Placement Faculty";
      const isUserOfficer = faculty.role === "Placement Faculty" || faculty.role === "Placement Officer" || faculty.email === "placement@adithyatech.edu.in";
      
      if (isOfficerRole && !isUserOfficer) {
        return res.status(401).json({
          success: false,
          message: "Account is not authorized for Placement Officer role."
        });
      }

      if (roleSelected === "Faculty" && isUserOfficer) {
        // Faculty login selected for Placement Officer account
      }

      const token = jwt.sign({ id: faculty._id, role: faculty.role, email: faculty.email }, secret, { expiresIn: "7d" });
      const userPayload = {
        id: faculty.id || faculty._id.toString(),
        name: faculty.fullName || faculty.name,
        email: faculty.email,
        department: faculty.department,
        role: faculty.role,
        avatarUrl: ""
      };

      // 3. Email Verification OTP Flow on Every Login
      const generatedOtp = generateSecureOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpCache.set(`verify_${faculty.email.toLowerCase()}`, {
        otp: generatedOtp,
        expires: expiresAt,
        attempts: 0,
        token,
        role: faculty.role,
        user: userPayload
      });

      // Send Login OTP via Centralized Resend Service
      await sendLoginVerificationEmail({
        to: faculty.email,
        otp: generatedOtp,
        userName: faculty.fullName || faculty.name
      });

      return res.status(200).json({
        success: true,
        requireOtp: true,
        email: faculty.email,
        role: faculty.role,
        message: `A 6-digit verification code has been dispatched to ${faculty.email}.`
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Incorrect role or credentials."
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Student Login wrapper
exports.studentLogin = async (req, res) => {
  return res.status(401).json({ success: false, message: "Incorrect role or credentials." });
};

// 3. Faculty Login wrapper
exports.facultyLogin = async (req, res) => {
  req.body.role = req.body.role || "Faculty";
  return exports.login(req, res);
};

// 4. Send / Resend OTP Verification Code
exports.sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const faculty = await Faculty.findOne({ email: cleanEmail });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "No faculty account registered with this email." });
    }

    const secret = process.env.JWT_SECRET || "secret_key";
    const token = jwt.sign({ id: faculty._id, role: faculty.role, email: faculty.email }, secret, { expiresIn: "7d" });
    const userPayload = {
      id: faculty.id || faculty._id.toString(),
      name: faculty.fullName || faculty.name,
      email: faculty.email,
      department: faculty.department,
      role: faculty.role,
      avatarUrl: ""
    };

    const generatedOtp = generateSecureOTP();
    otpCache.set(`verify_${cleanEmail}`, {
      otp: generatedOtp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      token,
      role: faculty.role,
      user: userPayload
    });

    // Send Resent OTP via Centralized Resend Service
    await sendLoginVerificationEmail({
      to: cleanEmail,
      otp: generatedOtp,
      userName: faculty.fullName || faculty.name
    });

    return res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${cleanEmail}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Verify Login OTP Code (Single-use, Marks emailVerified: true in DB)
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and verification code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const cached = otpCache.get(`verify_${cleanEmail}`);

    if (!cached) {
      return res.status(400).json({
        success: false,
        message: "No active verification session. Please request a new verification code."
      });
    }

    if (Date.now() > cached.expires) {
      otpCache.delete(`verify_${cleanEmail}`);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please click Resend OTP."
      });
    }

    if (cached.attempts >= 5) {
      otpCache.delete(`verify_${cleanEmail}`);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Verification session invalidated. Please log in again."
      });
    }

    if (cached.otp !== cleanOtp) {
      cached.attempts = (cached.attempts || 0) + 1;
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check the 6-digit code sent to your email."
      });
    }

    // SUCCESS — Delete OTP from cache immediately to ensure SINGLE-USE
    otpCache.delete(`verify_${cleanEmail}`);

    // Set emailVerified: true in MongoDB database!
    await Faculty.updateOne({ email: cleanEmail }, { $set: { emailVerified: true } });

    const secret = process.env.JWT_SECRET || "secret_key";
    let token = cached.token;
    let user = cached.user;
    let role = cached.role || "Faculty";

    if (!user) {
      const faculty = await Faculty.findOne({ email: cleanEmail });
      if (faculty) {
        token = jwt.sign({ id: faculty._id, role: faculty.role, email: faculty.email }, secret, { expiresIn: "7d" });
        role = faculty.role;
        user = {
          id: faculty.id || faculty._id.toString(),
          name: faculty.fullName || faculty.name,
          email: faculty.email,
          department: faculty.department,
          role: faculty.role,
          avatarUrl: ""
        };
      }
    }

    return res.status(200).json({
      success: true,
      token,
      role,
      user,
      message: "Identity verified successfully!"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Forgot Password Request
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, message: "Email or phone number is required." });
    }

    const input = emailOrPhone.trim().toLowerCase();
    const faculty = await Faculty.findOne({ $or: [{ email: input }, { phone: input }] });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "No account registered with this email." });
    }

    const generatedOtp = generateSecureOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpCache.set(`reset_${input}`, { otp: generatedOtp, expires: expiresAt, attempts: 0 });

    faculty.resetOtp = generatedOtp;
    faculty.resetOtpExpires = expiresAt;
    await faculty.save();

    if (input.includes("@")) {
      await sendForgotPasswordEmail({
        to: input,
        otp: generatedOtp,
        userName: faculty.fullName || faculty.name
      });
    }

    return res.status(200).json({
      success: true,
      message: `A secure 6-digit OTP code has been dispatched to ${emailOrPhone}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Reset Password with OTP Verification
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields (email, OTP, new password)." });
    }

    const input = emailOrPhone.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const cached = otpCache.get(`reset_${input}`);
    let isValid = false;

    if (cached && cached.otp === cleanOtp && Date.now() < cached.expires) {
      isValid = true;
    }

    let faculty = await Faculty.findOne({ $or: [{ email: input }, { phone: input }] });
    if (faculty && (faculty.resetOtp === cleanOtp || isValid)) {
      faculty.password = newPassword;
      faculty.resetOtp = undefined;
      faculty.resetOtpExpires = undefined;
      await faculty.save();
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired 6-digit OTP code." });
    }

    otpCache.delete(`reset_${input}`);

    return res.status(200).json({
      success: true,
      message: "Your account password has been reset successfully! You can now log in with your new password."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. GET Current Session User (/api/auth/me)
exports.me = async (req, res) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied: No session token provided." });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const secret = process.env.JWT_SECRET || "secret_key";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired session token." });
    }

    if (decoded.role === "Faculty" || decoded.role === "Placement Faculty") {
      const faculty = await Faculty.findById(decoded.id);
      if (!faculty) {
        return res.status(401).json({ success: false, message: "User account no longer exists." });
      }
      return res.json({
        success: true,
        user: {
          id: faculty.id || faculty._id.toString(),
          name: faculty.fullName || faculty.name,
          email: faculty.email,
          department: faculty.department,
          role: faculty.role,
          avatarUrl: ""
        },
        role: faculty.role
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid role." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Logout Endpoint (/api/auth/logout)
exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully."
  });
};