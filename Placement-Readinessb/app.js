const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const companyRoutes = require("./routes/companyRoutes");
const placementDriveRoutes = require("./routes/placementDriveRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const datasetRoutes = require("./routes/datasetRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/placement-drives", placementDriveRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/applications", applicationRoutes);

app.use("/uploads", express.static("uploads"));

// Health / Test Routes
app.get(["/", "/api", "/api/"], (req, res) => {
  res.json({
    success: true,
    message: "Placement Readiness Backend API is Active & Connected to MongoDB Atlas",
    endpoints: {
      auth: "/api/auth",
      students: "/api/students",
      faculty: "/api/faculty",
      companies: "/api/companies",
      placementDrives: "/api/placement-drives",
      assessments: "/api/assessments",
      datasets: "/api/datasets",
      applications: "/api/applications",
      health: "/api/health"
    },
    nodemailerConfigured: !!(process.env.SMTP_USER || process.env.GMAIL_USER)
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    emailService: (process.env.SMTP_USER || process.env.GMAIL_USER) ? "Nodemailer SMTP Active" : "Nodemailer Simulated Active"
  });
});

// Privacy Policy and Terms of Service endpoints for backend domain coverage
app.get(["/privacy", "/privacy-policy"], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Privacy Policy - Placement Readiness Analyzer</title></head>
    <body style="font-family:sans-serif; padding:40px; background:#0f172a; color:#e2e8f0; max-width:800px; margin:0 auto;">
      <h1>Privacy Policy - Placement Readiness Analyzer</h1>
      <p>Effective Date: September 9, 2026</p>
      <p><strong>Google API Disclosure:</strong> Placement Readiness Analyzer's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" style="color:#60a5fa;">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
      <p>Official Contact Email: <a href="mailto:padmapriya0128@gmail.com" style="color:#60a5fa;">padmapriya0128@gmail.com</a></p>
      <p>Institution: Adithya Institute of Technology</p>
      <p>Client ID: 42082053527-gne4po151pucs66hqtima9ldavhi1nfp.apps.googleusercontent.com</p>
    </body>
    </html>
  `);
});

app.get(["/terms", "/terms-of-service"], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Terms of Service - Placement Readiness Analyzer</title></head>
    <body style="font-family:sans-serif; padding:40px; background:#0f172a; color:#e2e8f0; max-width:800px; margin:0 auto;">
      <h1>Terms of Service - Placement Readiness Analyzer</h1>
      <p>Effective Date: September 9, 2026</p>
      <p>Official Contact Email: <a href="mailto:padmapriya0128@gmail.com" style="color:#60a5fa;">padmapriya0128@gmail.com</a></p>
      <p>Institution: Adithya Institute of Technology</p>
      <p>Client ID: 42082053527-gne4po151pucs66hqtima9ldavhi1nfp.apps.googleusercontent.com</p>
    </body>
    </html>
  `);
});

module.exports = app;