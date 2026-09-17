import { Student } from '../types';

export function calculateReadinessScore(student: Partial<Student>): number {
  let score = 0;
  
  // 1. CGPA (Max 30 points)
  const cgpa = Number(student.cgpa) || 0;
  if (cgpa >= 9) score += 30;
  else if (cgpa >= 8) score += 25;
  else if (cgpa >= 7) score += 20;
  else if (cgpa >= 6) score += 12;
  else score += 5;

  // 2. Technical Skills (Max 20 points)
  const skillCount = student.skills?.length || 0;
  if (skillCount >= 6) score += 20;
  else if (skillCount >= 4) score += 15;
  else if (skillCount >= 2) score += 10;
  else score += 3;

  // 3. Projects (Max 15 points)
  const projectCount = student.projects?.length || 0;
  if (projectCount >= 3) score += 15;
  else if (projectCount >= 2) score += 12;
  else if (projectCount >= 1) score += 8;

  // 4. Internships (Max 15 points)
  const internCount = student.internships?.length || 0;
  if (internCount >= 2) score += 15;
  else if (internCount >= 1) score += 12;

  // 5. Certifications (Max 10 points)
  const certCount = student.certifications?.length || 0;
  if (certCount >= 2) score += 10;
  else if (certCount >= 1) score += 7;

  // 6. Resume Quality (Max 10 points)
  const resScore = student.resumeScore || 70;
  score += Math.round(resScore * 0.1);

  return Math.min(score, 100);
}

export function getStudentInsights(student: Partial<Student>) {
  const score = calculateReadinessScore(student);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const skillGap: string[] = [];
  const recommendations: string[] = [];

  if ((Number(student.cgpa) || 0) >= 8.5) {
    strengths.push('High Academic Excellence (CGPA)');
  } else if ((Number(student.cgpa) || 0) < 7.0) {
    weaknesses.push('Low Academic Standing (CGPA below 7.0)');
    recommendations.push('Improve CGPA in upcoming semesters or clear any standing backlogs');
  }

  if ((student.skills?.length || 0) >= 5) {
    strengths.push('Broad Technical Skillset');
  } else {
    weaknesses.push('Limited Core Technical Skills');
    skillGap.push('Core coding syntax / Framework knowledge');
    recommendations.push('Acquire at least 2 key industry-demand skills like Python, SQL, or React');
  }

  if ((student.projects?.length || 0) >= 2) {
    strengths.push('Solid Project Portfolio');
  } else {
    weaknesses.push('Lack of Practical Projects');
    recommendations.push('Build at least 1 complex project demonstrating end-to-end implementation');
  }

  if ((student.internships?.length || 0) >= 1) {
    strengths.push('Real-world Internship Experience');
  } else {
    weaknesses.push('No Industry Exposure (Internship)');
    recommendations.push('Apply for a micro-internship, research project, or winter/summer industrial training');
  }

  return {
    strengths: strengths.length ? strengths : ['Collaborative Teamwork', 'Eagerness to learn'],
    weaknesses: weaknesses.length ? weaknesses : ['Lack of Mock Interview Practice'],
    skillGap: skillGap.length ? skillGap : ['Advanced Database Design', 'CI/CD deployment patterns'],
    recommendations: recommendations.length ? recommendations : ['Perform structural resume review', 'Practice oral technical presentations']
  };
}

export function normalizeRowToStudent(row: Record<string, any>, defaultIndex: number = 0): Student {
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

  // Strict Register Number extraction (Excluding Serial Numbers like S.No, Sl.No, No)
  let regValRaw = getVal([
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
    'Department', 'Dept', 'Branch', 'Stream', 'Specialization'
  ]);
  const department = String(deptVal || 'AI&DS').trim();

  const yearVal = getVal(['Academic Year', 'Year', 'Batch', 'Semester']);
  const year = yearVal ? (parseInt(String(yearVal).replace(/\D/g, ''), 10) || 4) : 4;

  const secVal = getVal(['Section', 'Sec']);
  const section = String(secVal || 'A').trim();

  const emailVal = getVal(['Email', 'Email ID', 'Mail', 'Student Email']);
  const email = String(emailVal || `${registerNumber.toLowerCase()}@student.edu`).trim();

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
    
    // Check direct property names
    const directKeys = ['cgpa', 'CGPA', 'cgpaScore', 'overallCgpa', 'currentCgpa', 'gpa'];
    for (const dk of directKeys) {
      if (row[dk] !== undefined && row[dk] !== null && row[dk] !== '') {
        const val = parseCgpaValue(row[dk]);
        if (val > 0) return val;
      }
    }

    const aliases = [
      'CGPA', 'GPA', 'Current CGPA', 'Current_CGPA', 'Overall CGPA', 'Overall_CGPA',
      'Grade Point', 'Grade_Point', 'CGPA till last semester', 'CGPA till last sem',
      'CGPA_till_last_semester', 'Cumulative GPA', 'Cumulative Grade Point Average',
      'CGPA (out of 10)', 'CGPA / 10', 'CGPA(out of 10)', 'CGPA (Max 10)', 'CGPA Score',
      'Aggregate CGPA', 'UG CGPA', 'B.E CGPA', 'B.Tech CGPA', 'Percentage / CGPA',
      'Marks (CGPA)', 'Cumulative CGPA', 'C.G.P.A', 'C.G.P.A.', 'C.G.P.A / 10',
      'Sem CGPA', 'Semester CGPA', 'Final CGPA', 'CGPA till 6th sem'
    ];
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const alias of aliases) {
        if (cleanKey === alias.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          const val = parseCgpaValue(row[key]);
          if (val > 0) return val;
        }
      }
    }

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey.includes('cgpa') || (cleanKey.includes('gpa') && !cleanKey.includes('dept'))) {
        const val = parseCgpaValue(row[key]);
        if (val > 0) return val;
      }
    }

    // Smart Fallback: Check all values in row for a number formatted like a CGPA (e.g. 4.0 to 10.0)
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase();
      if (!cleanKey.includes('year') && !cleanKey.includes('sem') && !cleanKey.includes('arrear') && !cleanKey.includes('phone') && !cleanKey.includes('mobile') && !cleanKey.includes('id') && !cleanKey.includes('reg') && !cleanKey.includes('no')) {
        const val = parseCgpaValue(row[key]);
        if (val >= 4.0 && val <= 10.0) {
          return val;
        }
      }
    }

    return 0; // Return 0 if unspecified so table displays 'Not Available' or actual dataset value
  }

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

  const rawStudentPartial = {
    registerNumber,
    name,
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
    skills,
    certifications,
    internships,
    projects,
    resumeUrl,
    placementStatus
  };

  const readinessScore = calculateReadinessScore(rawStudentPartial);
  const insights = getStudentInsights(rawStudentPartial);

  return {
    id: `std_${registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    fullName: name,
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
    strengths: insights.strengths,
    weaknesses: insights.weaknesses,
    skillGap: insights.skillGap,
    recommendations: insights.recommendations,
    placementStatus,
    username: registerNumber.toLowerCase(),
    password: `Student@${registerNumber}`,
    role: 'Student'
  };
}

export function isMatchingDatasetRow(row: Record<string, any>, target: string, index?: number): boolean {
  if (!row || !target) return false;
  const cleanTarget = String(target).trim().toLowerCase();
  if (!cleanTarget) return false;

  // Direct cell value match
  for (const [key, val] of Object.entries(row)) {
    if (val !== null && val !== undefined) {
      const valStr = String(val).trim().toLowerCase();
      if (valStr === cleanTarget) return true;
    }
  }

  const normalized = normalizeRowToStudent(row, index || 0);
  if (normalized.registerNumber.toLowerCase() === cleanTarget ||
      normalized.username.toLowerCase() === cleanTarget ||
      normalized.name.toLowerCase() === cleanTarget ||
      normalized.email.toLowerCase() === cleanTarget) {
    return true;
  }

  // Check digits match (e.g., "2" vs "002" or "AIDS3A002" or "710123104002")
  const targetDigits = cleanTarget.replace(/\D/g, '');
  if (targetDigits) {
    const regDigits = normalized.registerNumber.replace(/\D/g, '');
    if (regDigits && (regDigits === targetDigits || regDigits.endsWith(targetDigits) || targetDigits.endsWith(regDigits))) {
      return true;
    }
  }

  // Check row index match (1-based index)
  if (index !== undefined && targetDigits && parseInt(targetDigits, 10) === (index + 1)) {
    return true;
  }

  return false;
}
