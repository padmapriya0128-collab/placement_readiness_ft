const PlacementDrive = require("../models/PlacementDrive");
const { sendPlacementDriveEmail, sendTestEmail } = require("../utils/nodemailerEmail");

exports.getPlacementDrives = async (req, res) => {
  try {
    const drives = await PlacementDrive.find({}).sort({ createdAt: -1 });
    return res.status(200).json(drives);
  } catch (error) {
    console.warn("⚠️ PlacementDrives DB query fallback:", error.message);
    return res.status(200).json([]);
  }
};

exports.publishPlacementDrive = async (req, res) => {
  try {
    const { companyId, registrationFormUrl, pdfDataUrl, publisherName, company, eligibleStudents, allStudents } = req.body;

    const students = eligibleStudents || [];
    let sentCount = 0;
    let failedCount = 0;
    const deliveryLogs = [];

    // Dispatch real emails to each eligible student using Nodemailer
    for (const student of students) {
      let status = "Sent";
      let errorReason = null;

      try {
        const mailResult = await sendPlacementDriveEmail({
          student,
          company,
          registrationFormUrl,
          pdfDataUrl
        });

        if (mailResult.success) {
          sentCount++;
        } else {
          status = "Failed";
          errorReason = mailResult.error || "Failed via Nodemailer";
          failedCount++;
        }
      } catch (err) {
        status = "Failed";
        errorReason = err.message || "Email error";
        failedCount++;
      }

      deliveryLogs.push({
        studentId: student.id || student.registerNumber,
        name: student.name || student.fullName,
        registerNumber: student.registerNumber,
        email: student.email,
        department: student.department,
        cgpa: student.cgpa,
        emailStatus: status,
        sentAt: new Date().toISOString(),
        errorMessage: errorReason
      });
    }

    const overallDeliveryStatus = failedCount === 0 ? "Delivered" : sentCount > 0 ? "Partial Failure" : "Failed";
    const driveId = `drive_${Date.now()}`;

    const drivePayload = {
      id: driveId,
      companyId: companyId || (company && company.id) || "",
      companyName: (company && company.name) || "Company Drive",
      jobRole: (company && company.jobRole) || "",
      salaryPackage: (company && company.salaryPackage) || "",
      location: (company && company.location) || "",
      applicationDeadline: (company && company.applicationDeadline) || "",
      description: (company && company.description) || "",
      registrationFormUrl: registrationFormUrl || "",
      pdfDataUrl: pdfDataUrl || "",
      eligibilityCriteria: {
        allowedDepartments: company?.allowedDepartments,
        cgpaCutoff: company?.cgpaCutoff,
        maxActiveArrears: company?.maxActiveArrears,
        year: company?.year,
        requiredSkills: company?.requiredSkills
      },
      status: "Published",
      publishedAt: new Date().toISOString(),
      publishedBy: publisherName || "Placement Officer",
      totalStudentsCount: allStudents?.length || 0,
      eligibleStudentsCount: students.length,
      emailSentCount: sentCount,
      emailFailedCount: failedCount,
      emailPendingCount: 0,
      deliveryStatus: overallDeliveryStatus,
      eligibleStudentIds: students.map(s => s.id || s.registerNumber),
      studentsList: deliveryLogs
    };

    let newDrive;
    try {
      newDrive = await PlacementDrive.create(drivePayload);
    } catch (dbErr) {
      console.warn("⚠️ Database save fallback:", dbErr.message);
      newDrive = drivePayload;
    }

    return res.status(201).json({
      success: true,
      drive: newDrive,
      message: `Placement drive published successfully! Nodemailer dispatched ${sentCount} emails (${failedCount} failed).`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePlacementDrive = async (req, res) => {
  try {
    const id = req.params.id;
    await PlacementDrive.deleteOne({ id });
    return res.status(200).json({ success: true, message: "Drive deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.testNodemailerEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Target email address required" });
    }
    const result = await sendTestEmail(email);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.testSendGridEmail = exports.testNodemailerEmail;

