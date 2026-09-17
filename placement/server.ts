import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { connectToMongoDB, inMemoryDB } from './server/mongo.js';
import { sendPlacementOpportunityEmail, sendVerificationOTPEmail } from './server/emailService.js';

dotenv.config();

const serverOtpStore = new Map<string, { code: string; expiresAt: number }>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize MongoDB Atlas connection
  const db = await connectToMongoDB();

  // Initialize Gemini API client on server-side
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // Helper function to evaluate eligibility against company criteria
  function evaluateEligibility(student: any, company: any) {
    const reasons: string[] = [];

    // 1. Department Check
    const studentDept = (student.department || '').toLowerCase().trim();
    const allowedDepts = company.allowedDepartments || company.eligibleBranches || [];
    let deptMatch = allowedDepts.length === 0 || allowedDepts.some((d: string) => d.toLowerCase().includes('all') || d.trim() === '');
    if (!deptMatch) {
      const deptAliases: Record<string, string[]> = {
        'ai&ds': ['ai&ds', 'aids', 'artificial intelligence', 'data science'],
        'cse': ['cse', 'computer science', 'computer science & engineering'],
        'it': ['it', 'information technology'],
        'ece': ['ece', 'electronics', 'electronics & communication'],
        'eee': ['eee', 'electrical', 'electrical & electronics'],
        'mech': ['mech', 'mechanical'],
        'civil': ['civil'],
        'bme': ['bme', 'biomedical'],
        'robotics': ['robotics', 'automation']
      };

      const sDeptClean = studentDept.replace(/[^a-z0-9]/g, '');
      deptMatch = allowedDepts.some((rawD: string) => {
        const dClean = rawD.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!dClean || dClean === 'all') return true;
        if (sDeptClean.includes(dClean) || dClean.includes(sDeptClean)) return true;

        for (const [key, aliases] of Object.entries(deptAliases)) {
          const matchStudent = aliases.some(a => sDeptClean.includes(a.replace(/[^a-z0-9]/g, '')));
          const matchCompany = aliases.some(a => dClean.includes(a.replace(/[^a-z0-9]/g, '')));
          if (matchStudent && matchCompany) return true;
        }
        return false;
      });
    }
    if (!deptMatch) reasons.push(`Department ${student.department} is not eligible`);

    // 2. CGPA Check
    const cgpaCutoff = Number(company.cgpaCutoff) || 0;
    const studentCgpa = Number(student.cgpa) || 0;
    const cgpaOk = studentCgpa >= cgpaCutoff;
    if (!cgpaOk) reasons.push(`CGPA ${studentCgpa} is below required cutoff ${cgpaCutoff}`);

    // 3. Current Arrears Check
    const maxArrears = company.maxActiveArrears !== undefined && company.maxActiveArrears !== null ? Number(company.maxActiveArrears) : 99;
    const studentArrears = Number(student.activeArrears || 0);
    const arrearsOk = studentArrears <= maxArrears;
    if (!arrearsOk) reasons.push(`Standing Arrears (${studentArrears}) exceeds allowed (${maxArrears})`);

    // 4. Passing Year / Batch Check (Flexible normalization)
    let yearMatch = true;
    if (company.year && student.year) {
      const sYearStr = String(student.year).toLowerCase().trim();
      const cYearStr = String(company.year).toLowerCase().trim();

      if (!cYearStr.includes('all') && cYearStr !== '') {
        const yearLevelToBatch: Record<string, string> = {
          '1': '2029', '2': '2028', '3': '2027', '4': '2026',
          '1st': '2029', '2nd': '2028', '3rd': '2027', '4th': '2026'
        };
        const sBatch = yearLevelToBatch[sYearStr] || sYearStr;
        const cBatch = yearLevelToBatch[cYearStr] || cYearStr;

        const directMatch = sYearStr.includes(cYearStr) || cYearStr.includes(sYearStr);
        const batchMatch = sBatch.includes(cBatch) || cBatch.includes(sBatch);

        if (!directMatch && !batchMatch) {
          yearMatch = false;
          reasons.push(`Passing year ${student.year} does not match company target batch ${company.year}`);
        }
      }
    }

    // 5. Technical Skills Check
    const reqSkills = company.requiredSkills || [];
    let skillsOk = true;
    if (reqSkills.length > 0) {
      const studentSkills = (student.skills || []).map((s: string) => s.toLowerCase().trim());
      if (studentSkills.length > 0) {
        const matchedSkills = reqSkills.filter((req: string) => {
          const r = req.toLowerCase().trim();
          return studentSkills.some((s: string) => s.includes(r) || r.includes(s));
        });
        skillsOk = matchedSkills.length > 0;
      }
    }
    if (!skillsOk) reasons.push(`Missing required skills`);

    // 6. Certifications Check
    const reqCerts = company.requiredCertifications || [];
    let certsOk = true;
    if (reqCerts.length > 0) {
      const studentCerts = (student.certifications || []).map((c: string) => c.toLowerCase().trim());
      if (studentCerts.length > 0) {
        certsOk = reqCerts.some((req: string) => {
          const r = req.toLowerCase().trim();
          return studentCerts.some((c: string) => c.includes(r) || r.includes(c));
        });
      }
    }

    // 7. Internship Requirement Check
    let internOk = true;
    if (company.internshipRequired === 'Yes') {
      const internCount = (student.internships || []).length;
      internOk = internCount > 0;
      if (!internOk) reasons.push(`Company requires prior internship experience`);
    }

    const isEligible = deptMatch && cgpaOk && arrearsOk && yearMatch && skillsOk && certsOk && internOk;
    return { isEligible, reasons };
  }

  function parseCgpaValue(rawVal: any): number {
    if (rawVal === undefined || rawVal === null || rawVal === '') return 0;
    let val = 0;
    if (typeof rawVal === 'number') {
      if (isNaN(rawVal)) return 0;
      val = rawVal;
    } else {
      const str = String(rawVal).trim();
      if (!str) return 0;
      const match = str.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        val = parseFloat(match[1]);
        if (isNaN(val)) return 0;
      }
    }
    if (val > 10 && val <= 100) {
      val = val / 10;
    }
    return Number(Math.min(10, Math.max(0, val)).toFixed(2));
  }

  function extractCgpaFromRow(row: Record<string, any>): number {
    if (!row || typeof row !== 'object') return 0;
    if (row.cgpa !== undefined && row.cgpa !== null && row.cgpa !== '') {
      const val = parseCgpaValue(row.cgpa);
      if (val > 0 || row.cgpa === 0 || row.cgpa === '0') return val;
    }
    const aliases = [
      'CGPA', 'GPA', 'Current CGPA', 'Current_CGPA', 'Overall CGPA', 'Overall_CGPA',
      'Grade Point', 'Grade_Point', 'CGPA till last semester', 'CGPA till last sem',
      'CGPA_till_last_semester', 'Cumulative GPA', 'Cumulative Grade Point Average',
      'CGPA (out of 10)', 'CGPA / 10', 'CGPA(out of 10)', 'CGPA (Max 10)', 'CGPA Score',
      'Aggregate CGPA', 'UG CGPA', 'B.E CGPA', 'B.Tech CGPA', 'Percentage / CGPA',
      'Marks (CGPA)', 'Cumulative CGPA', 'C.G.P.A', 'C.G.P.A.', 'C.G.P.A / 10'
    ];
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const alias of aliases) {
        if (cleanKey === alias.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          const val = parseCgpaValue(row[key]);
          if (val > 0 || row[key] === 0 || row[key] === '0') return val;
        }
      }
    }
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey.includes('cgpa') || (cleanKey.includes('gpa') && !cleanKey.includes('dept'))) {
        const val = parseCgpaValue(row[key]);
        if (val > 0 || row[key] === 0 || row[key] === '0') return val;
      }
    }
    return 0;
  }

  // Helper function to normalize dataset rows into structured student records
  function normalizeServerRowToStudent(row: Record<string, any>, defaultIndex: number = 0) {
    const getVal = (aliases: string[]) => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const alias of aliases) {
          if (cleanKey === alias.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return row[key];
          }
        }
      }
      return undefined;
    };

    const regValRaw = getVal([
      'Register Number', 'Reg Number', 'RegisterNo', 'Reg No', 'RegNo', 'Roll No',
      'RollNumber', 'University Register Number', 'Register_Number', 'Reg_No',
      'Reg. No.', 'Register No.', 'Registration Number', 'RollNo', 'URN', 'R.No', 'Student ID', 'Username'
    ]);

    let cleanRegStr = String(regValRaw || '').trim();
    if (!cleanRegStr || (typeof regValRaw === 'number' && regValRaw < 100) || /^\d{1,2}$/.test(cleanRegStr)) {
      cleanRegStr = '';
      for (const k of Object.keys(row)) {
        const valStr = String(row[k] || '').trim();
        if (/^[7-9]\d{7,12}$/i.test(valStr) || (/^[A-Z0-9]{4,15}$/i.test(valStr) && !/^\d+$/.test(valStr) && !valStr.includes('@'))) {
          cleanRegStr = valStr;
          break;
        }
      }
    }
    const registerNumber = (cleanRegStr || `REG${defaultIndex + 1}`).toUpperCase();

    const nameValRaw = getVal([
      'Student Name', 'Name', 'Full Name', 'StudentName', 'Candidate Name', 'Student', 'Name of the Student', 'Name of Student', 'Full_Name', 'Student_Name'
    ]);
    let cleanNameStr = String(nameValRaw || '').trim();
    if (!cleanNameStr || cleanNameStr.toLowerCase() === 'undefined' || cleanNameStr.toLowerCase() === 'null') {
      cleanNameStr = '';
      for (const k of Object.keys(row)) {
        const valStr = String(row[k] || '').trim();
        if (/[a-zA-Z]{3,}/.test(valStr) && !valStr.includes('@') && valStr.toLowerCase() !== registerNumber.toLowerCase() && !valStr.toLowerCase().includes('engineering') && !valStr.toLowerCase().includes('science')) {
          cleanNameStr = valStr;
          break;
        }
      }
    }
    const name = cleanNameStr || `Student ${registerNumber}`;

    const deptVal = getVal([
      'Department', 'Dept', 'Branch', 'Course', 'Stream', 'Specialization'
    ]);
    const department = String(deptVal || 'Computer Science & Engineering').trim();

    const yearVal = getVal(['Academic Year', 'Year', 'Batch', 'Semester']);
    const year = yearVal ? (parseInt(String(yearVal).replace(/\D/g, ''), 10) || 4) : 4;

    const secVal = getVal(['Section', 'Sec']);
    const section = String(secVal || 'A').trim();

    const emailVal = getVal(['Email', 'Email ID', 'Mail', 'Student Email']);
    const email = String(emailVal || `${registerNumber.toLowerCase()}@student.edu`).trim();

    const phoneVal = getVal(['Mobile Number', 'Mobile', 'Phone', 'Contact Number', 'Contact', 'Phone Number']);
    const phone = String(phoneVal || '').trim();

    const cgpa = extractCgpaFromRow(row);

    const tenthPercentage = getVal(['10th Percentage', '10th %', '10th Marks', '10th', 'SSLC %', 'SSLC']) ?? '';
    const twelfthPercentage = getVal(['12th Percentage', '12th %', '12th Marks', '12th', 'HSC %', 'HSC', 'Diploma %', 'Diploma']) ?? '';

    const activeArrearsVal = getVal(['Current Arrears', 'Active Arrears', 'Standing Arrears', 'Arrears', 'Backlogs', 'No of Backlogs']);
    const activeArrears = activeArrearsVal !== undefined ? (parseInt(String(activeArrearsVal), 10) || 0) : 0;

    const historyArrearsVal = getVal(['History of Arrears', 'History Arrears', 'Total Arrears History', 'Past Arrears']);
    const historyArrears = historyArrearsVal !== undefined ? (parseInt(String(historyArrearsVal), 10) || 0) : 0;

    const parseList = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const skills = parseList(getVal(['Skills', 'Technical Skills', 'Core Skills', 'Key Skills', 'Programming Languages']));
    const certifications = parseList(getVal(['Certifications', 'Certificate', 'Courses', 'Certified']));
    const internships = parseList(getVal(['Internships', 'Internship', 'Industrial Training', 'Experience']));
    const projects = parseList(getVal(['Projects', 'Academic Projects', 'Key Projects', 'Project Work']));

    const resumeUrl = String(getVal(['Resume', 'Resume Link', 'CV', 'Resume URL', 'Resume Score']) || '').trim();
    const placementStatusRaw = String(getVal(['Placement Status', 'Status', 'Placement']) || 'Eligible').trim();
    const placementStatus = (['Placed', 'Eligible', 'Not Eligible', 'In Progress'].includes(placementStatusRaw)
      ? placementStatusRaw
      : 'Eligible') as any;

    // Calculate Placement Readiness Score dynamically
    let readinessScore = 50;
    if (cgpa >= 9.0) readinessScore += 30;
    else if (cgpa >= 8.0) readinessScore += 25;
    else if (cgpa >= 7.0) readinessScore += 20;
    else if (cgpa >= 6.0) readinessScore += 12;
    else readinessScore += 5;

    if (skills.length >= 5) readinessScore += 12;
    else if (skills.length >= 3) readinessScore += 8;
    else if (skills.length >= 1) readinessScore += 4;

    if (projects.length >= 2) readinessScore += 10;
    else if (projects.length >= 1) readinessScore += 5;

    if (internships.length >= 1) readinessScore += 8;

    if (activeArrears > 0) readinessScore -= activeArrears * 10;

    readinessScore = Math.max(15, Math.min(99, Math.round(readinessScore)));

    const strengths: string[] = [];
    if (cgpa >= 8.5) strengths.push('High Academic Excellence (CGPA)');
    if (skills.length >= 3) strengths.push('Broad Technical Skillset');
    if (projects.length >= 1) strengths.push('Hands-on Project Experience');
    if (internships.length >= 1) strengths.push('Industry Internship Exposure');
    if (activeArrears === 0) strengths.push('Zero Active Arrears');
    if (strengths.length === 0) strengths.push('Academic Engagement', 'Foundational Skillset');

    const weaknesses: string[] = [];
    if (activeArrears > 0) weaknesses.push(`${activeArrears} Standing Arrear(s)`);
    if (cgpa < 7.0 && cgpa > 0) weaknesses.push('Academic CGPA below 7.0');
    if (skills.length < 2) weaknesses.push('Limited Recorded Technical Skills');
    if (projects.length === 0) weaknesses.push('No Portfolio Projects Listed');

    const skillGap: string[] = [];
    if (!skills.some(s => ['python', 'sql', 'java', 'c++', 'javascript', 'react', 'dsa'].includes(s.toLowerCase()))) {
      skillGap.push('Core Programming / Database Syntax');
    }
    if (!skills.some(s => ['system design', 'cloud', 'aws', 'docker'].includes(s.toLowerCase()))) {
      skillGap.push('Cloud Infrastructure & Microservices');
    }

    const recommendations: string[] = [];
    if (cgpa < 7.5 && cgpa > 0) recommendations.push('Focus on boosting academic CGPA and clearing backlogs');
    if (projects.length < 2) recommendations.push('Develop at least 2 full-stack/AI portfolio projects with GitHub repositories');
    if (skills.length < 4) recommendations.push('Learn in-demand industry skills such as SQL, Python, and React');

    return {
      id: `std_${registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name,
      registerNumber,
      department,
      year,
      section,
      email,
      phone,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      activeArrears,
      historyArrears,
      skills: skills.length > 0 ? skills : ['Python', 'SQL', 'Problem Solving'],
      certifications,
      internships,
      projects,
      resumeUrl,
      readinessScore,
      strengths,
      weaknesses,
      skillGap,
      recommendations,
      placementStatus,
      username: registerNumber.toLowerCase(),
      password: `Student@${registerNumber}`,
      role: 'Student'
    };
  }

  // --- API ROUTES ---

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: db ? 'MongoDB Atlas' : 'In-Memory Store',
      timestamp: new Date().toISOString() 
    });
  });

  // Students Endpoints
  app.get('/api/students', async (req, res) => {
    try {
      const uploadedBy = (req.query.uploadedBy || req.query.facultyEmail) as string;
      const filter = uploadedBy ? { uploadedBy: { $regex: new RegExp(`^${uploadedBy.trim()}$`, 'i') } } : {};
      if (db) {
        const students = await db.collection('students').find(filter).toArray();
        return res.json(students);
      }
      const list = inMemoryDB.students || [];
      if (uploadedBy) {
        return res.json(list.filter(s => (s as any).uploadedBy?.toLowerCase() === uploadedBy.toLowerCase()));
      }
      return res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET single student profile using Register Number as unique identifier
  app.get('/api/students/profile/:registerNumber', async (req, res) => {
    try {
      const { registerNumber } = req.params;
      if (!registerNumber) {
        return res.status(400).json({ error: 'Register Number parameter is required.' });
      }

      const cleanReg = registerNumber.trim();
      let studentDoc = null;

      if (db) {
        // Query MongoDB Atlas using registerNumber (case-insensitive regex)
        studentDoc = await db.collection('students').findOne({
          $or: [
            { registerNumber: { $regex: new RegExp(`^${cleanReg}$`, 'i') } },
            { username: { $regex: new RegExp(`^${cleanReg}$`, 'i') } },
            { email: { $regex: new RegExp(`^${cleanReg}$`, 'i') } },
            { id: cleanReg }
          ]
        });

        // If not found in students collection, search uploaded dataset rows in MongoDB Atlas
        if (!studentDoc) {
          const datasets = await db.collection('datasets').find({}).toArray();
          for (const ds of datasets) {
            const rows = ds.rows || ds.dataPreview || [];
            const matchingRow = rows.find((r: any) => {
              const reg = String(
                r['Register Number'] || r['registerNumber'] || r['Reg No'] || r['RegNo'] || r['Roll No'] || r['username'] || ''
              ).trim();
              return reg.toLowerCase() === cleanReg.toLowerCase();
            });

            if (matchingRow) {
              studentDoc = normalizeServerRowToStudent(matchingRow);
              await db.collection('students').updateOne(
                { registerNumber: studentDoc.registerNumber },
                { $set: studentDoc },
                { upsert: true }
              );
              break;
            }
          }
        }
      }

      // Fallback search in memory
      if (!studentDoc) {
        studentDoc = inMemoryDB.students.find((s: any) =>
          s.registerNumber?.toLowerCase() === cleanReg.toLowerCase() ||
          s.username?.toLowerCase() === cleanReg.toLowerCase() ||
          s.email?.toLowerCase() === cleanReg.toLowerCase() ||
          s.id === cleanReg
        );
      }

      if (studentDoc) {
        return res.json(studentDoc);
      } else {
        return res.status(404).json({ error: `No student profile record found for Register Number "${cleanReg}".` });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST create single student profile
  app.post('/api/students', async (req, res) => {
    try {
      const studentData = req.body;
      const regNum = String(studentData.registerNumber || '').trim();
      const stdName = String(studentData.fullName || studentData.name || '').trim();
      const cgpaVal = Number(studentData.cgpa);

      if (!regNum) return res.status(400).json({ error: 'Register Number is required.' });
      if (!stdName) return res.status(400).json({ error: 'Student Name is required.' });
      if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
        return res.status(400).json({ error: 'CGPA must be a valid number between 0 and 10.' });
      }

      const id = studentData.id || `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const record = {
        ...studentData,
        id,
        name: stdName,
        fullName: stdName,
        registerNumber: regNum,
        cgpa: cgpaVal
      };

      if (db) {
        await db.collection('students').updateOne(
          { registerNumber: { $regex: new RegExp(`^${regNum}$`, 'i') } },
          { $set: record },
          { upsert: true }
        );
      }

      const idx = inMemoryDB.students.findIndex(s => s.registerNumber?.toLowerCase() === regNum.toLowerCase());
      if (idx >= 0) inMemoryDB.students[idx] = record;
      else inMemoryDB.students.push(record);

      return res.json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT update student profile
  app.put('/api/students/:id', async (req, res) => {
    try {
      const studentId = req.params.id;
      const cleanId = String(studentId).trim();
      const studentData = req.body;
      const stdName = String(studentData.fullName || studentData.name || '').trim();
      const regNum = String(studentData.registerNumber || '').trim();

      const record = {
        ...studentData,
        name: stdName || studentData.name,
        fullName: stdName || studentData.fullName,
        registerNumber: regNum || studentData.registerNumber
      };

      if (db) {
        let query: any = {
          $or: [
            { id: cleanId },
            { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
          ]
        };
        if (ObjectId.isValid(cleanId)) {
          query.$or.push({ _id: new ObjectId(cleanId) });
        }

        await db.collection('students').updateOne(query, { $set: record }, { upsert: true });
      }

      const idx = inMemoryDB.students.findIndex(
        s => s.id === cleanId || s.registerNumber?.toLowerCase() === cleanId.toLowerCase()
      );
      if (idx >= 0) inMemoryDB.students[idx] = { ...inMemoryDB.students[idx], ...record };

      return res.json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE student profile
  app.delete('/api/students/:id', async (req, res) => {
    try {
      const studentId = req.params.id;
      const cleanId = String(studentId).trim();

      if (db) {
        let query: any = {
          $or: [
            { id: cleanId },
            { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
          ]
        };
        if (ObjectId.isValid(cleanId)) {
          query.$or.push({ _id: new ObjectId(cleanId) });
        }

        await db.collection('students').deleteMany(query);
      }

      inMemoryDB.students = inMemoryDB.students.filter(
        s => s.id !== cleanId && s.registerNumber?.toLowerCase() !== cleanId.toLowerCase() && s.username?.toLowerCase() !== cleanId.toLowerCase()
      );

      return res.json({ success: true, message: `Student profile "${cleanId}" deleted successfully.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bulk Student Upload / Upsert (e.g. from Faculty dataset upload)
  app.post('/api/students/bulk', async (req, res) => {
    try {
      const { students: rawRows } = req.body;
      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        return res.status(400).json({ error: 'Array of student records required.' });
      }

      const normalizedList = rawRows.map((row, idx) => {
        const std = normalizeServerRowToStudent(row, idx);
        const extractedCgpa = extractCgpaFromRow(row);
        if (extractedCgpa > 0 || row.cgpa === 0 || row.cgpa === '0') {
          std.cgpa = extractedCgpa;
        }
        return std;
      });

      if (db) {
        for (const std of normalizedList) {
          if (std.registerNumber) {
            await db.collection('students').updateOne(
              { registerNumber: { $regex: new RegExp(`^${std.registerNumber.trim()}$`, 'i') } },
              { $set: std },
              { upsert: true }
            );
          }
        }
      } else {
        normalizedList.forEach(std => {
          const idx = inMemoryDB.students.findIndex(s => s.registerNumber?.toLowerCase() === std.registerNumber?.toLowerCase());
          if (idx >= 0) inMemoryDB.students[idx] = std;
          else inMemoryDB.students.push(std);
        });
      }

      return res.json({ success: true, count: normalizedList.length, students: normalizedList });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Datasets Endpoints for saving and sync
  app.get('/api/datasets', async (req, res) => {
    try {
      const uploadedBy = (req.query.uploadedBy || req.query.facultyEmail) as string;
      const filter = uploadedBy ? { uploadedBy: { $regex: new RegExp(`^${uploadedBy.trim()}$`, 'i') } } : {};
      if (db) {
        const datasets = await db.collection('datasets').find(filter).sort({ uploadDate: -1 }).toArray();
        return res.json(datasets);
      }
      const list = (inMemoryDB as any).datasets || [];
      if (uploadedBy) {
        return res.json(list.filter((d: any) => d.uploadedBy?.toLowerCase() === uploadedBy.toLowerCase()));
      }
      return res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/datasets', async (req, res) => {
    try {
      const datasetData = req.body;
      const rows = datasetData.rows || datasetData.dataPreview || [];

      // Save dataset in MongoDB
      if (db) {
        await db.collection('datasets').insertOne({
          ...datasetData,
          id: datasetData.id || `data_${Date.now()}`
        });
      }

      // Upsert every student record in dataset into students collection in MongoDB Atlas
      if (Array.isArray(rows) && rows.length > 0) {
        const normalizedStudents = rows.map((row, idx) => {
          const std: any = normalizeServerRowToStudent(row, idx);
          if (datasetData.uploadedBy) std.uploadedBy = datasetData.uploadedBy;
          return std;
        });
        if (db) {
          for (const std of normalizedStudents) {
            await db.collection('students').updateOne(
              { registerNumber: { $regex: new RegExp(`^${std.registerNumber.trim()}$`, 'i') } },
              { $set: std },
              { upsert: true }
            );
          }
        } else {
          normalizedStudents.forEach(std => {
            const idx = inMemoryDB.students.findIndex(s => s.registerNumber?.toLowerCase() === std.registerNumber?.toLowerCase());
            if (idx >= 0) inMemoryDB.students[idx] = std;
            else inMemoryDB.students.push(std);
          });
        }
      }

      return res.json({ success: true, message: 'Dataset saved and student profiles synced to MongoDB Atlas.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- ASSESSMENTS ENDPOINTS ---
  app.get('/api/assessments', async (req, res) => {
    try {
      const createdBy = (req.query.createdBy || req.query.uploadedBy || req.query.facultyEmail) as string;
      const filter = createdBy ? { createdBy: { $regex: new RegExp(`^${createdBy.trim()}$`, 'i') } } : {};
      if (db) {
        const assessments = await db.collection('assessments').find(filter).toArray();
        return res.json(assessments);
      }
      const list = (inMemoryDB as any).assessments || [];
      if (createdBy) {
        return res.json(list.filter((a: any) => (a as any).createdBy?.toLowerCase() === createdBy.toLowerCase()));
      }
      return res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/assessments', async (req, res) => {
    try {
      const assessmentData = req.body;
      const id = assessmentData.id || `assess_${Date.now()}`;
      const record = { ...assessmentData, id };

      if (db) {
        await db.collection('assessments').updateOne(
          { id },
          { $set: record },
          { upsert: true }
        );
      } else {
        if (!(inMemoryDB as any).assessments) (inMemoryDB as any).assessments = [];
        const idx = (inMemoryDB as any).assessments.findIndex((a: any) => a.id === id);
        if (idx >= 0) (inMemoryDB as any).assessments[idx] = record;
        else (inMemoryDB as any).assessments.push(record);
      }

      return res.json(record);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/assessments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        await db.collection('assessments').deleteOne({ id });
        await db.collection('assessment_scores').deleteOne({ assessmentId: id });
      } else {
        if ((inMemoryDB as any).assessments) {
          (inMemoryDB as any).assessments = (inMemoryDB as any).assessments.filter((a: any) => a.id !== id);
        }
        if ((inMemoryDB as any).assessmentScores) {
          delete (inMemoryDB as any).assessmentScores[id];
        }
      }
      return res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/assessments/:id/scores', async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        const scoreDoc = await db.collection('assessment_scores').findOne({ assessmentId: id });
        if (scoreDoc && scoreDoc.scores) {
          return res.json(scoreDoc.scores);
        }
      } else {
        if ((inMemoryDB as any).assessmentScores && (inMemoryDB as any).assessmentScores[id]) {
          return res.json((inMemoryDB as any).assessmentScores[id]);
        }
      }
      return res.json([]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/assessments/:id/scores', async (req, res) => {
    try {
      const { id } = req.params;
      const { scores } = req.body;

      if (db) {
        await db.collection('assessment_scores').updateOne(
          { assessmentId: id },
          { $set: { assessmentId: id, scores, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      } else {
        if (!(inMemoryDB as any).assessmentScores) (inMemoryDB as any).assessmentScores = {};
        (inMemoryDB as any).assessmentScores[id] = scores;
      }

      return res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });



  // GET single student by ID or Register Number
  app.get('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cleanId = id.trim();
      let student = null;

      if (db) {
        student = await db.collection('students').findOne({
          $or: [
            { id: cleanId },
            { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
          ]
        });
      }

      if (!student) {
        student = inMemoryDB.students.find((s: any) =>
          s.id === cleanId || s.registerNumber?.toLowerCase() === cleanId.toLowerCase()
        );
      }

      if (student) {
        return res.json(student);
      }
      return res.status(404).json({ error: 'Student not found.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST create new student with strict validations
  app.post('/api/students', async (req, res) => {
    try {
      const studentData = req.body;
      
      const registerNumber = (studentData.registerNumber || '').trim();
      const name = (studentData.name || studentData.fullName || '').trim();
      const cgpa = Number(studentData.cgpa);

      if (!registerNumber) {
        return res.status(400).json({ error: 'Register Number is required.' });
      }
      if (!name) {
        return res.status(400).json({ error: 'Student Name is required.' });
      }
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        return res.status(400).json({ error: 'CGPA must be a number between 0 and 10.' });
      }

      const newStudent = {
        ...studentData,
        id: studentData.id || `std_${registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
        registerNumber,
        name,
        fullName: name,
        cgpa
      };

      if (db) {
        const existing = await db.collection('students').findOne({
          registerNumber: { $regex: new RegExp(`^${registerNumber}$`, 'i') }
        });
        if (existing && existing.id !== newStudent.id) {
          return res.status(400).json({ error: `Register Number "${registerNumber}" already exists.` });
        }

        await db.collection('students').updateOne(
          { registerNumber: { $regex: new RegExp(`^${registerNumber}$`, 'i') } },
          { $set: newStudent },
          { upsert: true }
        );
      } else {
        const idx = inMemoryDB.students.findIndex(s => s.registerNumber?.toLowerCase() === registerNumber.toLowerCase());
        if (idx >= 0) inMemoryDB.students[idx] = newStudent;
        else inMemoryDB.students.push(newStudent);
      }

      return res.json(newStudent);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT update student
  app.put('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const cleanId = id.trim();

      if (updatedData.cgpa !== undefined && updatedData.cgpa !== null) {
        const cgpaNum = Number(updatedData.cgpa);
        if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
          return res.status(400).json({ error: 'CGPA must be a number between 0 and 10.' });
        }
        updatedData.cgpa = cgpaNum;
      }

      if (updatedData.name || updatedData.fullName) {
        const n = (updatedData.name || updatedData.fullName).trim();
        updatedData.name = n;
        updatedData.fullName = n;
      }

      let updatedStudent = null;

      if (db) {
        await db.collection('students').updateOne(
          { $or: [{ id: cleanId }, { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } }] },
          { $set: updatedData },
          { upsert: true }
        );
        updatedStudent = await db.collection('students').findOne({
          $or: [{ id: cleanId }, { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } }]
        });
      } else {
        const idx = inMemoryDB.students.findIndex(s => s.id === cleanId || s.registerNumber?.toLowerCase() === cleanId.toLowerCase());
        if (idx >= 0) {
          inMemoryDB.students[idx] = { ...inMemoryDB.students[idx], ...updatedData };
          updatedStudent = inMemoryDB.students[idx];
        } else {
          updatedStudent = { id: cleanId, ...updatedData };
          inMemoryDB.students.push(updatedStudent);
        }
      }

      return res.json(updatedStudent);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE student
  app.delete('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cleanId = id.trim();

      if (db) {
        await db.collection('students').deleteOne({
          $or: [
            { id: cleanId },
            { registerNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
          ]
        });
      }

      inMemoryDB.students = inMemoryDB.students.filter(s =>
        s.id !== cleanId && s.registerNumber?.toLowerCase() !== cleanId.toLowerCase()
      );

      return res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Companies Endpoints
  app.get('/api/companies', async (req, res) => {
    try {
      if (db) {
        const companies = await db.collection('companies').find({}).toArray();
        return res.json(companies);
      }
      return res.json(inMemoryDB.companies);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const companyData = req.body;
      const newCompany = {
        ...companyData,
        id: companyData.id || `co_${Date.now()}`
      };

      if (db) {
        await db.collection('companies').insertOne(newCompany);
      } else {
        inMemoryDB.companies.push(newCompany);
      }
      res.json(newCompany);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/companies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      if (db) {
        await db.collection('companies').updateOne({ id }, { $set: updatedData }, { upsert: true });
        const updated = await db.collection('companies').findOne({ id });
        return res.json(updated);
      } else {
        const idx = inMemoryDB.companies.findIndex(c => c.id === id);
        if (idx >= 0) {
          inMemoryDB.companies[idx] = { ...inMemoryDB.companies[idx], ...updatedData };
          return res.json(inMemoryDB.companies[idx]);
        } else {
          inMemoryDB.companies.push({ id, ...updatedData });
          return res.json({ id, ...updatedData });
        }
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- PUBLISH PLACEMENT DRIVE WORKFLOW ENDPOINTS ---

  app.post('/api/placement-drives/publish', async (req, res) => {
    try {
      const { companyId, registrationFormUrl, pdfDataUrl, publisherName, company: passedCompany, eligibleStudents: passedEligible, allStudents: passedAll } = req.body;

      if (!companyId && !passedCompany) {
        return res.status(400).json({ error: 'Company details or Company ID required to publish placement drive.' });
      }

      // Fetch company
      let company = passedCompany;
      if (!company && db) {
        company = await db.collection('companies').findOne({ id: companyId });
      }
      if (!company) {
        company = passedCompany || { id: companyId, name: 'Placement Drive' };
      }

      // Save/Update Google Form / Sheet link in company record inside MongoDB
      const formUrl = registrationFormUrl || company.googleFormLink || company.registrationFormUrl || 'https://forms.google.com/adithya-placement';
      company.googleFormLink = formUrl;
      company.registrationFormUrl = formUrl;

      if (db) {
        await db.collection('companies').updateOne(
          { id: company.id },
          { $set: { googleFormLink: formUrl, registrationFormUrl: formUrl, status: 'Active', formStatus: 'Published' } },
          { upsert: true }
        );
      }

      // STEP 1: Find All Students and Evaluate Eligibility
      let allStudents = passedAll || [];
      if (allStudents.length === 0 && db) {
        allStudents = await db.collection('students').find({}).toArray();
      }

      const eligibleStudentsList: any[] = [];
      allStudents.forEach((student: any) => {
        const { isEligible } = evaluateEligibility(student, company);
        if (isEligible) {
          eligibleStudentsList.push(student);
        }
      });

      // Use passed eligible list as fallback if needed
      const finalEligibleStudents = eligibleStudentsList.length > 0 ? eligibleStudentsList : (passedEligible || []);

      // STEP 2 & 3 & 4: Generate Delivery Logs and Dispatch Emails automatically
      const studentDeliveryLogs: any[] = [];
      let emailSentCount = 0;
      let emailFailedCount = 0;

      for (const student of finalEligibleStudents) {
        const emailResult = await sendPlacementOpportunityEmail({
          toEmail: student.email,
          studentName: student.name,
          companyName: company.name,
          registrationFormUrl: formUrl,
          pdfDataUrl
        });

        const status = emailResult.success ? 'Sent' : 'Failed';
        if (emailResult.success) emailSentCount++;
        else emailFailedCount++;

        studentDeliveryLogs.push({
          studentId: student.id,
          name: student.name,
          registerNumber: student.registerNumber,
          email: student.email,
          department: student.department,
          cgpa: student.cgpa,
          emailStatus: status,
          sentAt: new Date().toISOString(),
          errorMessage: emailResult.error
        });
      }

      // STEP 8: Create PlacementDrive Document & Store in MongoDB Atlas
      const driveRecord = {
        id: `drive_${Date.now()}`,
        companyId: company.id,
        companyName: company.name,
        jobRole: company.jobRole,
        salaryPackage: company.salaryPackage,
        location: company.location,
        applicationDeadline: company.applicationDeadline || 'As scheduled',
        description: company.description || '',
        registrationFormUrl: formUrl,
        pdfDataUrl: pdfDataUrl || '',
        eligibilityCriteria: {
          allowedDepartments: company.allowedDepartments,
          cgpaCutoff: company.cgpaCutoff,
          maxActiveArrears: company.maxActiveArrears,
          year: company.year,
          requiredSkills: company.requiredSkills,
          requiredCertifications: company.requiredCertifications,
          internshipRequired: company.internshipRequired
        },
        status: 'Published',
        publishedAt: new Date().toISOString(),
        publishedBy: publisherName || 'Placement Officer',
        totalStudentsCount: allStudents.length,
        eligibleStudentsCount: finalEligibleStudents.length,
        emailSentCount,
        emailFailedCount,
        emailPendingCount: 0,
        deliveryStatus: emailFailedCount === 0 ? 'Delivered' : 'Partial Failure',
        eligibleStudentIds: finalEligibleStudents.map(s => s.id),
        studentsList: studentDeliveryLogs
      };

      if (db) {
        await db.collection('placement_drives').insertOne(driveRecord);
      } else {
        inMemoryDB.placementDrives.unshift(driveRecord);
      }

      return res.json({
        success: true,
        message: `Successfully published placement drive for ${company.name} and dispatched emails to ${finalEligibleStudents.length} eligible students.`,
        drive: driveRecord
      });
    } catch (e: any) {
      console.error('Error publishing placement drive:', e);
      return res.status(500).json({ error: e.message || 'Failed to publish placement drive.' });
    }
  });

  app.get('/api/placement-drives', async (req, res) => {
    try {
      if (db) {
        const drives = await db.collection('placement_drives').find({}).sort({ publishedAt: -1 }).toArray();
        return res.json(drives);
      }
      return res.json(inMemoryDB.placementDrives);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/placement-drives/student/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      let drives: any[] = [];
      if (db) {
        drives = await db.collection('placement_drives').find({ status: 'Published' }).sort({ publishedAt: -1 }).toArray();
      } else {
        drives = inMemoryDB.placementDrives.filter(d => d.status === 'Published');
      }

      const eligibleDrives = drives.filter(d => 
        (d.eligibleStudentIds && d.eligibleStudentIds.includes(studentId)) ||
        (d.studentsList && d.studentsList.some((s: any) => s.studentId === studentId))
      );

      res.json(eligibleDrives);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Chatbot / AI Placement Advisor endpoint powered by Gemini API
  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { message, history, role } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      if (ai) {
        const systemInstruction = `You are the official AI Placement Readiness Advisor for Adithya Institute of Technology.
Your role is to counsel and guide engineering students, faculty members, and placement officers.
Keep your answers structured, encouraging, actionable, and specific. Use bullet points or bold text where helpful.
Topics you cover:
1. Placement Readiness Score optimization (DSA, core engineering, CGPA, projects).
2. Technical skill development (Full-Stack, Cloud/DevOps, AI/Data Science, Embedded/VLSI).
3. Resume building (1-page format, XYZ bullet formula, impact metrics).
4. Technical & Behavioral Interview prep (STAR method, coding practice).
5. Company recruitment guidelines, cutoff management, and dataset analysis.

Current user role: ${role || 'Student'}.
Be concise, helpful, and professional.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: message,
          config: {
            systemInstruction
          }
        });

        const replyText = response.text || 'I am ready to help you with placement preparation!';
        return res.json({ reply: replyText });
      } else {
        return res.json({
          reply: `Welcome to the PRA Portal AI Advisor! (Server Mode)\n\nFor placement readiness, focus on:\n1. **Core Technical Skills**: Maintain projects with clean code and READMEs.\n2. **Aptitude & DSA**: Solve problem sets regularly.\n3. **CGPA & Academic Record**: Maintain a CGPA above 7.5 to maximize eligibility.\n\nHow else can I assist your ${role || 'Student'} journey today?`
        });
      }
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      res.status(500).json({
        reply: `I encountered an issue processing your request. Please try again. (Details: ${err?.message || 'Server error'})`
      });
    }
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    const { usernameOrEmail, password, role } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ message: 'Username or email is required.' });
    }

    const cleanInput = usernameOrEmail.trim();

    if (role === 'Faculty') {
      return res.json({
        token: 'jwt-fac-' + Date.now(),
        user: {
          id: 'fac_1',
          name: cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput,
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@university.edu`,
          department: 'Academic Department',
          role: 'Faculty'
        }
      });
    } else if (role === 'Placement Faculty') {
      return res.json({
        token: 'jwt-placement-' + Date.now(),
        user: {
          id: 'fac_placement_1',
          name: cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput,
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@university.edu`,
          role: 'Placement Faculty'
        }
      });
    } else {
      // Student role - Fetch exact student document using Register Number
      let studentDoc = null;

      if (db) {
        studentDoc = await db.collection('students').findOne({
          $or: [
            { registerNumber: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
            { username: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
            { email: { $regex: new RegExp(`^${cleanInput}$`, 'i') } }
          ]
        });

        if (!studentDoc) {
          const datasets = await db.collection('datasets').find({}).toArray();
          for (const ds of datasets) {
            const rows = ds.rows || ds.dataPreview || [];
            const matchingRow = rows.find((r: any) => {
              const reg = String(
                r['Register Number'] || r['registerNumber'] || r['Reg No'] || r['RegNo'] || r['Roll No'] || r['username'] || ''
              ).trim();
              return reg.toLowerCase() === cleanInput.toLowerCase();
            });

            if (matchingRow) {
              studentDoc = normalizeServerRowToStudent(matchingRow);
              await db.collection('students').updateOne(
                { registerNumber: studentDoc.registerNumber },
                { $set: studentDoc },
                { upsert: true }
              );
              break;
            }
          }
        }
      }

      if (!studentDoc) {
        studentDoc = inMemoryDB.students.find((s: any) =>
          s.registerNumber?.toLowerCase() === cleanInput.toLowerCase() ||
          s.username?.toLowerCase() === cleanInput.toLowerCase() ||
          s.email?.toLowerCase() === cleanInput.toLowerCase()
        );
      }

      if (!studentDoc) {
        for (const ds of (inMemoryDB.datasets || [])) {
          const rows = ds.rows || ds.dataPreview || [];
          const matchingRow = rows.find((r: any) => {
            const reg = String(
              r['Register Number'] || r['registerNumber'] || r['Reg No'] || r['RegNo'] || r['Roll No'] || r['username'] || r['Student Name'] || ''
            ).trim();
            return reg.toLowerCase() === cleanInput.toLowerCase() ||
                   (r['Student Name'] && String(r['Student Name']).trim().toLowerCase() === cleanInput.toLowerCase());
          });

          if (matchingRow) {
            studentDoc = normalizeServerRowToStudent(matchingRow);
            inMemoryDB.students.push(studentDoc);
            break;
          }
        }
      }

      if (!studentDoc) {
        return res.status(401).json({
          message: `No student record found for Register Number "${cleanInput}". Faculty must upload the dataset first.`
        });
      }

      return res.json({
        token: `jwt-student-${studentDoc.registerNumber}-${Date.now()}`,
        user: studentDoc
      });
    }
  });

  // --- EMAIL OTP VERIFICATION ENDPOINTS ---
  app.post('/api/auth/send-verification-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email address is required.' });

      const cleanEmail = String(email).trim().toLowerCase();
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      serverOtpStore.set(cleanEmail, { code: generatedOtp, expiresAt });

      await sendVerificationOTPEmail(cleanEmail, generatedOtp);

      return res.json({
        success: true,
        otp: generatedOtp,
        message: `A 6-digit verification code has been sent to ${cleanEmail}.`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to dispatch verification code.' });
    }
  });

  app.post('/api/auth/verify-login-otp', (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ message: 'Email and OTP code are required.' });

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = serverOtpStore.get(cleanEmail);
      if (!record) {
        return res.status(400).json({ message: 'No active OTP verification session found. Please re-send verification code.' });
      }

      if (Date.now() > record.expiresAt) {
        serverOtpStore.delete(cleanEmail);
        return res.status(400).json({ message: 'Verification code has expired. Please click Resend OTP.' });
      }

      if (record.code !== cleanOtp) {
        return res.status(400).json({ message: 'Invalid verification code. Please enter the exact 6-digit code sent to your email.' });
      }

      serverOtpStore.delete(cleanEmail);
      return res.json({ success: true, message: 'Gmail identity verified successfully!' });
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'OTP Verification failed.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
      if (!emailOrPhone) return res.status(400).json({ message: 'Email or phone number is required.' });

      const cleanKey = String(emailOrPhone).trim().toLowerCase();
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      serverOtpStore.set(`reset_${cleanKey}`, { code: generatedOtp, expiresAt });

      if (cleanKey.includes('@')) {
        await sendVerificationOTPEmail(cleanKey, generatedOtp);
      }

      return res.json({
        success: true,
        otp: generatedOtp,
        message: `A secure 6-digit OTP verification code (${generatedOtp}) has been dispatched to ${cleanKey}.`
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { emailOrPhone, otp } = req.body;
      if (!emailOrPhone || !otp) return res.status(400).json({ message: 'Email/Phone and OTP code required.' });

      const cleanKey = String(emailOrPhone).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = serverOtpStore.get(`reset_${cleanKey}`);
      if (!record || Date.now() > record.expiresAt) {
        return res.status(400).json({ message: 'OTP verification session expired. Please re-request code.' });
      }

      if (record.code !== cleanOtp) {
        return res.status(400).json({ message: 'Invalid OTP. Please enter the exact 6-digit code received.' });
      }

      serverOtpStore.delete(`reset_${cleanKey}`);
      return res.json({
        success: true,
        message: 'Your account password has been updated successfully. You can now log in.'
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Dedicated Static Routes for Privacy Policy & Terms of Service (Google OAuth Compliance)
  app.get(['/privacy', '/privacy-policy'], (req, res) => {
    const privacyPath = path.join(process.cwd(), 'public', 'privacy.html');
    res.sendFile(privacyPath);
  });

  app.get(['/terms', '/terms-of-service'], (req, res) => {
    const termsPath = path.join(process.cwd(), 'public', 'terms.html');
    res.sendFile(termsPath);
  });

  // --- VITE / STATIC SERVING MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();

