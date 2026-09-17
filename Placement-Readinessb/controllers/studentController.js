const Student = require("../models/Student");
const ImportHistory = require("../models/ImportHistory");
const XLSX = require("xlsx");

// Helper to normalize column names for fuzzy comparison
function normalizeKey(str) {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const FIELD_ALIASES = {
  registerNumber: [
    "registernumber", "registerno", "regno", "register_no", "reg.no",
    "reg.no.", "regno.", "register no", "reg no", "admissionnumber",
    "studentid", "rollnumber", "rollno", "roll no", "urn", "usn", "registrationnumber"
  ],
  fullName: [
    "studentname", "name", "fullname", "student_name", "full_name",
    "candidatename", "nameofthestudent", "nameofstudent", "student"
  ],
  cgpa: [
    "cgpa", "c.g.p.a", "c.g.p.a.", "gpa", "overallcgpa", "cumulativegpa",
    "gradepoint", "cgpascore", "cgpa/10", "semcgpa", "ugcgpa", "aggregatecgpa"
  ],
  department: [
    "department", "dept", "branch", "departmentname", "deptname", "stream", "specialization", "degree"
  ],
  year: [
    "year", "academicyear", "studyyear", "yearofstudy", "batch", "classyear"
  ],
  section: [
    "section", "classsection", "sec"
  ],
  email: [
    "email", "emailid", "studentemail", "mailid", "mail"
  ],
  phone: [
    "phone", "mobile", "mobilenumber", "contactnumber", "phonenumber", "contact"
  ],
  attendance: [
    "attendance", "attendancepercentage", "attendance%", "attendancescore"
  ],
  skills: [
    "skills", "technicalskills", "skillset", "coreskills", "programminglanguages"
  ],
  projects: [
    "projects", "projectcount", "numberofprojects", "academicprojects"
  ],
  certifications: [
    "certifications", "certificationcount", "certificates", "courses"
  ],
  internships: [
    "internships", "internshipcount", "internshipexperience", "industrialtraining"
  ],
  placementStatus: [
    "placementstatus", "status", "placement", "eligibility"
  ]
};

// Detect System Field for a given raw Excel column header
function detectSystemField(header) {
  const norm = normalizeKey(header);
  if (!norm) return "ignore";

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(norm)) {
      return field;
    }
  }

  // Substring fallback checks
  if (norm.includes("reg") && (norm.includes("no") || norm.includes("num") || norm.includes("id"))) return "registerNumber";
  if (norm.includes("student") && norm.includes("name")) return "fullName";
  if (norm === "name") return "fullName";
  if (norm.includes("cgpa")) return "cgpa";
  if (norm.includes("dept") || norm.includes("branch")) return "department";
  if (norm.includes("year")) return "year";
  if (norm.includes("sec")) return "section";
  if (norm.includes("mail")) return "email";
  if (norm.includes("mobile") || norm.includes("phone")) return "phone";
  if (norm.includes("attend")) return "attendance";
  if (norm.includes("skill")) return "skills";
  if (norm.includes("project")) return "projects";
  if (norm.includes("certif")) return "certifications";
  if (norm.includes("intern")) return "internships";
  if (norm.includes("status")) return "placementStatus";

  return "ignore";
}

// Readiness score algorithm
function calculateReadinessScore(student) {
  let score = 0;
  const cgpa = Number(student.cgpa) || 0;
  if (cgpa >= 9) score += 30;
  else if (cgpa >= 8) score += 25;
  else if (cgpa >= 7) score += 20;
  else if (cgpa >= 6) score += 12;
  else score += 5;

  const skillCount = Array.isArray(student.skills) ? student.skills.length : 0;
  if (skillCount >= 6) score += 20;
  else if (skillCount >= 4) score += 15;
  else if (skillCount >= 2) score += 10;
  else score += 3;

  const projCount = typeof student.projects === 'number' ? student.projects : (Array.isArray(student.projects) ? student.projects.length : 0);
  if (projCount >= 3) score += 15;
  else if (projCount >= 2) score += 12;
  else if (projCount >= 1) score += 8;

  const internCount = typeof student.internships === 'number' ? student.internships : (Array.isArray(student.internships) ? student.internships.length : 0);
  if (internCount >= 2) score += 15;
  else if (internCount >= 1) score += 12;

  const certCount = typeof student.certifications === 'number' ? student.certifications : (Array.isArray(student.certifications) ? student.certifications.length : 0);
  if (certCount >= 2) score += 10;
  else if (certCount >= 1) score += 7;

  const resScore = student.resumeScore || 75;
  score += Math.round(resScore * 0.1);

  return Math.min(score, 100);
}

function getStudentInsights(student) {
  const score = calculateReadinessScore(student);
  const strengths = [];
  const weaknesses = [];
  const skillGap = [];
  const recommendations = [];

  if ((Number(student.cgpa) || 0) >= 8.5) {
    strengths.push('High Academic Excellence (CGPA)');
  } else if ((Number(student.cgpa) || 0) < 7.0 && (Number(student.cgpa) || 0) > 0) {
    weaknesses.push('Low Academic Standing (CGPA below 7.0)');
    recommendations.push('Improve CGPA in upcoming semesters or clear any standing backlogs');
  }

  const skillCount = Array.isArray(student.skills) ? student.skills.length : 0;
  if (skillCount >= 5) {
    strengths.push('Broad Technical Skillset');
  } else {
    weaknesses.push('Limited Core Technical Skills');
    skillGap.push('Core coding syntax / Framework knowledge');
    recommendations.push('Acquire at least 2 key industry-demand skills like Python, SQL, or React');
  }

  return {
    strengths: strengths.length ? strengths : ['Collaborative Teamwork', 'Eagerness to learn'],
    weaknesses: weaknesses.length ? weaknesses : ['Lack of Mock Interview Practice'],
    skillGap: skillGap.length ? skillGap : ['Advanced Database Design'],
    recommendations: recommendations.length ? recommendations : ['Perform structural resume review']
  };
}

// -------------------------------------------------------------
// 1. GET ALL STUDENTS & PROFILE QUERY
// -------------------------------------------------------------
exports.getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.uploadedBy) {
      filter.uploadedBy = req.query.uploadedBy.trim();
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(students);
  } catch (error) {
    console.warn("⚠️ Students DB query fallback:", error.message);
    return res.status(200).json([]);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const query = req.params.id;
    const student = await Student.findOne({
      $or: [
        { id: query },
        { registerNumber: query },
        { username: query }
      ]
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfileByRegisterNumber = async (req, res) => {
  try {
    const reg = req.params.registerNumber;
    const student = await Student.findOne({
      $or: [
        { registerNumber: new RegExp(`^${reg}$`, 'i') },
        { username: new RegExp(`^${reg}$`, 'i') },
        { id: reg }
      ]
    });
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 2. CREATE & UPDATE SINGLE STUDENT
// -------------------------------------------------------------
exports.createStudent = async (req, res) => {
  try {
    const body = req.body;
    if (!body.registerNumber || !body.registerNumber.trim()) {
      return res.status(400).json({ success: false, message: "Register Number is required." });
    }
    if (!body.fullName && !body.name) {
      return res.status(400).json({ success: false, message: "Student Name is required." });
    }

    const regNum = body.registerNumber.trim().toUpperCase();
    const name = (body.fullName || body.name || "").trim();

    const existing = await Student.findOne({ registerNumber: regNum });
    if (existing) {
      return res.status(400).json({ success: false, message: `Student with Register Number ${regNum} already exists.` });
    }

    const score = calculateReadinessScore(body);
    const insights = getStudentInsights(body);

    const newStudent = await Student.create({
      ...body,
      id: `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}`,
      registerNumber: regNum,
      username: regNum.toLowerCase(),
      fullName: name,
      name: name,
      readinessScore: score,
      score: score,
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      skillGap: insights.skillGap,
      recommendations: insights.recommendations
    });

    return res.status(201).json(newStudent);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const id = req.params.id;
    let student = await Student.findOne({
      $or: [{ id: id }, { registerNumber: id }]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    Object.assign(student, req.body);
    if (req.body.name || req.body.fullName) {
      const nameVal = req.body.fullName || req.body.name;
      student.name = nameVal;
      student.fullName = nameVal;
    }

    student.readinessScore = calculateReadinessScore(student);
    student.score = student.readinessScore;
    const insights = getStudentInsights(student);
    student.strengths = insights.strengths;
    student.weaknesses = insights.weaknesses;
    student.skillGap = insights.skillGap;
    student.recommendations = insights.recommendations;

    await student.save();
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Student.deleteOne({
      $or: [{ id: id }, { registerNumber: id }]
    });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 3. EXCEL/CSV IMPORT PREVIEW & COLUMN MAPPING API
// -------------------------------------------------------------
exports.importPreview = async (req, res) => {
  try {
    let rows = [];
    let rawHeaders = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else if (req.body.rows && Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      return res.status(400).json({ success: false, message: "No data rows or Excel file provided." });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file contains no data rows." });
    }

    rawHeaders = Object.keys(rows[0] || {});

    // Auto-detect column mapping
    const detectedMapping = {};
    rawHeaders.forEach(header => {
      detectedMapping[header] = detectSystemField(header);
    });

    // Extract all existing register numbers from DB for duplicate checking
    const existingDbStudents = await Student.find({}, { registerNumber: 1 });
    const dbRegSet = new Set(existingDbStudents.map(s => (s.registerNumber || "").trim().toUpperCase()));

    const seenRegInFile = new Set();
    const validationErrors = [];
    let validCount = 0;
    let duplicateCount = 0;

    const defaultDept = req.body.defaultDepartment || (req.query && req.query.defaultDepartment) || "AI&DS";

    const previewData = rows.map((row, idx) => {
      const rowNum = idx + 1;
      const parsedRow = {};

      // Map values according to detectedMapping
      rawHeaders.forEach(header => {
        const sysField = detectedMapping[header];
        if (sysField && sysField !== "ignore") {
          parsedRow[sysField] = row[header];
        }
      });

      if (!parsedRow.department || !String(parsedRow.department).trim()) {
        parsedRow.department = defaultDept;
      }

      // Extract key values
      const reg = String(parsedRow.registerNumber || "").trim().toUpperCase();
      const name = String(parsedRow.fullName || "").trim();
      const rawCgpa = parsedRow.cgpa;

      let isRowValid = true;

      if (!reg) {
        validationErrors.push({ row: rowNum, field: "Register Number", value: "Empty", problem: "Register Number is required" });
        isRowValid = false;
      }

      if (!name) {
        validationErrors.push({ row: rowNum, field: "Student Name", value: "Empty", problem: "Student Name is required" });
        isRowValid = false;
      }

      const email = String(parsedRow.email || "").trim();
      if (!email || !email.includes("@")) {
        validationErrors.push({ row: rowNum, field: "Gmail / Email", value: email || "Missing", problem: "Need Gmail / Enter Mail: Valid student email address is required" });
        isRowValid = false;
      }

      if (rawCgpa !== undefined && rawCgpa !== null && rawCgpa !== "") {
        const numCgpa = parseFloat(String(rawCgpa).replace(/[^0-9.]/g, ""));
        if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
          validationErrors.push({ row: rowNum, field: "CGPA", value: String(rawCgpa), problem: "CGPA must be a number between 0 and 10" });
          isRowValid = false;
        }
      }

      if (reg) {
        if (seenRegInFile.has(reg)) {
          duplicateCount++;
          validationErrors.push({ row: rowNum, field: "Register Number", value: reg, problem: `Duplicate Register Number "${reg}" in uploaded file` });
        } else {
          seenRegInFile.add(reg);
        }
      }

      const isExistingInDb = reg ? dbRegSet.has(reg) : false;

      if (isRowValid) validCount++;

      return {
        rowNum,
        rawRow: row,
        mappedData: parsedRow,
        registerNumber: reg,
        fullName: name,
        isExistingInDb,
        isValid: isRowValid
      };
    });

    return res.status(200).json({
      success: true,
      totalRows: rows.length,
      validRowsCount: validCount,
      errorRowsCount: rows.length - validCount,
      duplicateCount,
      detectedHeaders: rawHeaders,
      columnMapping: detectedMapping,
      validationErrors,
      previewRows: previewData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 4. CONFIRM IMPORT API (WRITE TO MONGODB ATLAS)
// -------------------------------------------------------------
exports.importConfirm = async (req, res) => {
  try {
    const { rows, columnMapping, defaultDepartment, duplicateMode, fileName, uploadedBy } = req.body;
    const mode = duplicateMode || "update"; // "update", "skip", "new"
    const fallbackDept = defaultDepartment || "AI&DS";

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No data rows provided for import." });
    }

    let successfulRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    const processedLogs = [];

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      const rawRow = item.rawRow || item;

      // Extract values according to columnMapping if provided, else directly
      const mapped = {};
      if (columnMapping) {
        Object.keys(columnMapping).forEach(rawHeader => {
          const sysField = columnMapping[rawHeader];
          if (sysField && sysField !== "ignore") {
            mapped[sysField] = rawRow[rawHeader] !== undefined ? rawRow[rawHeader] : item[sysField];
          }
        });
      } else {
        Object.assign(mapped, rawRow);
      }

      const regNum = String(mapped.registerNumber || item.registerNumber || "").trim().toUpperCase();
      const name = String(mapped.fullName || mapped.name || item.fullName || item.name || "").trim();

      if (!regNum || !name) {
        failedRows++;
        processedLogs.push({ row: i + 1, registerNumber: regNum, status: "Failed", reason: "Missing Register Number or Name" });
        continue;
      }

      // Parse CGPA
      let cgpa = 0;
      if (mapped.cgpa !== undefined && mapped.cgpa !== null && mapped.cgpa !== "") {
        const parsed = parseFloat(String(mapped.cgpa).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) cgpa = Number(Math.min(10, Math.max(0, parsed)).toFixed(2));
      }

      // Parse Attendance
      let attendance = 85;
      if (mapped.attendance !== undefined && mapped.attendance !== null && mapped.attendance !== "") {
        const parsed = parseFloat(String(mapped.attendance).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) attendance = Math.min(100, Math.max(0, parsed));
      }

      // Parse arrays
      const parseArray = (val) => {
        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
        if (typeof val === 'string' && val.trim()) {
          return val.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
        }
        return [];
      };

      const skills = parseArray(mapped.skills);
      const certifications = parseArray(mapped.certifications);
      const internships = parseArray(mapped.internships);
      const projects = parseArray(mapped.projects);

      const studentDoc = {
        registerNumber: regNum,
        fullName: name,
        name: name,
        username: regNum.toLowerCase(),
        department: String(mapped.department || fallbackDept).trim(),
        year: mapped.year || "IV",
        section: String(mapped.section || "A").trim(),
        email: String(mapped.email || "").trim(),
        phone: String(mapped.phone || "").trim(),
        cgpa: cgpa,
        attendance: attendance,
        skills: skills,
        certifications: certifications,
        internships: internships,
        projects: projects,
        placementStatus: String(mapped.placementStatus || "Eligible").trim(),
        uploadedBy: String(uploadedBy || req.user?.email || "Faculty").trim()
      };

      studentDoc.readinessScore = calculateReadinessScore(studentDoc);
      studentDoc.score = studentDoc.readinessScore;

      const insights = getStudentInsights(studentDoc);
      studentDoc.strengths = insights.strengths;
      studentDoc.weaknesses = insights.weaknesses;
      studentDoc.skillGap = insights.skillGap;
      studentDoc.recommendations = insights.recommendations;

      let existing = await Student.findOne({ registerNumber: regNum });

      if (existing) {
        if (mode === "skip") {
          skippedRows++;
          processedLogs.push({ row: i + 1, registerNumber: regNum, name, status: "Skipped", reason: "Student already exists" });
          continue;
        } else {
          // Mode === "update" or "new" -> update existing record preserving intact fields
          Object.assign(existing, studentDoc);
          await existing.save();
          updatedRows++;
          successfulRows++;
          processedLogs.push({ row: i + 1, registerNumber: regNum, name, status: "Updated" });
        }
      } else {
        studentDoc.id = `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}`;
        await Student.create(studentDoc);
        successfulRows++;
        processedLogs.push({ row: i + 1, registerNumber: regNum, name, status: "Inserted" });
      }
    }

    // Save to ImportHistory collection in MongoDB Atlas
    const historyId = `imp_${Date.now()}`;
    const historyRecord = await ImportHistory.create({
      id: historyId,
      fileName: fileName || "uploaded_students.xlsx",
      uploadedBy: uploadedBy || "Faculty",
      totalRows: rows.length,
      successfulRows,
      updatedRows,
      skippedRows,
      failedRows,
      status: "Completed",
      details: processedLogs
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalRows: rows.length,
        successfulRows,
        updatedRows,
        skippedRows,
        failedRows
      },
      historyRecord
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 5. IMPORT HISTORY LIST API
// -------------------------------------------------------------
exports.getImportHistory = async (req, res) => {
  try {
    const history = await ImportHistory.find({}).sort({ createdAt: -1 });
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 6. BULK UPDATE & BULK DELETE APIS
// -------------------------------------------------------------
exports.bulkUpdateStudents = async (req, res) => {
  try {
    const { studentIds, updates } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No student IDs provided." });
    }
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ success: false, message: "No update fields provided." });
    }

    const students = await Student.find({
      $or: [{ id: { $in: studentIds } }, { registerNumber: { $in: studentIds } }]
    });

    let updatedCount = 0;
    for (const student of students) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null && updates[key] !== "") {
          student[key] = updates[key];
        }
      });

      student.readinessScore = calculateReadinessScore(student);
      student.score = student.readinessScore;
      const insights = getStudentInsights(student);
      student.strengths = insights.strengths;
      student.weaknesses = insights.weaknesses;
      student.skillGap = insights.skillGap;
      student.recommendations = insights.recommendations;

      await student.save();
      updatedCount++;
    }

    return res.status(200).json({ success: true, updatedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkDeleteStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No student IDs provided." });
    }

    const result = await Student.deleteMany({
      $or: [{ id: { $in: studentIds } }, { registerNumber: { $in: studentIds } }]
    });

    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy Bulk Upload Endpoint (Maintained for backward compatibility)
exports.bulkUploadStudents = async (req, res) => {
  req.body.duplicateMode = "update";
  return exports.importConfirm(req, res);
};

// Logged-in Profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    return res.status(200).json({ success: true, student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Placement Score
exports.getPlacementScore = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    return res.status(200).json({
      success: true,
      placement: {
        readinessScore: student.readinessScore || 0,
        placementStatus: student.placementStatus || "Eligible",
        strengths: student.strengths || [],
        weaknesses: student.weaknesses || [],
        recommendations: student.recommendations || [],
        cgpa: student.cgpa,
        skills: student.skills
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};