import { Company, Student, StudentApplication } from '../types';
import { getStudents } from './students';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
const COMPANIES_KEY = 'companies_list';
const APPLICATIONS_KEY = 'student_applications_list';

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'co_vis_ai_labs',
    name: 'VIS AI LABS',
    location: 'Chennai',
    jobRole: 'Software Development Engineer Trainee / Computer Vision Engineer Trainee',
    salaryPackage: '5.0 LPA',
    cgpaCutoff: 7.50,
    allowedDepartments: [
      'Electronics & Communication Engineering',
      'Computer Science & Engineering',
      'Information Technology'
    ],
    year: '2026',
    requiredSkills: [
      'C',
      'C++',
      'JavaScript',
      'Python',
      'Angular JS',
      'React JS',
      'Full Stack Development',
      'Computer Vision',
      'Data Structures & Algorithms'
    ],
    requiredCertifications: ['Full Stack Development', 'Computer Vision'],
    internshipRequired: 'No',
    requiredProjects: 1,
    maxActiveArrears: 0,
    eligibleGender: 'All',
    applicationDeadline: '30.12.2025 @ 8 AM',
    selectionProcess: 'Day 1: Written Test Pen & Paper Test (Logical & Analytical Puzzles + Technical Assessment related to Full Stack / Computer Vision) | Day 2: In-depth Technical & HR Discussion',
    description: 'VisAI Labs is the brainchild of e-con Systems, a leading OEM camera solutions provider, incubated as a separate entity in 2018. With 6 years of experience in cutting-edge computer vision and artificial intelligence solutions, we specialize in solving real-world problems. Our core engineers and management team are prodigies from e-con Systems with the compounded expertise of providing path-breaking camera solutions for giants like Meta and Walmart. https://visailabs.com/',
    googleFormLink: 'https://docs.google.com/forms/d/e/1FAIpQLScGu4M0MCSb0O41EwUVXbABgjl0r3dvL_fznmGOkAerDhOHNA/viewform',
    additionalInstructions: '10th & 12th Marks: Minimum 75% in 10th & 12th. Standing Arrears: WITHOUT ANY STANDING ARREARS.',
    status: 'Active',
    educationalQualification: 'B.E ( ECE / CSE / IT )',
    vacancies: 'As Per Requirement',
    employmentType: 'Full-Time',
    workMode: 'Onsite',
    recruitmentDate: '29.12.2025',
    circularRefNo: '42 / 2025-2026 / TPC',
    circularDate: '29.12.2025',
    driveVenue: 'Bannari Amman Institute of Technology, Sathyamangalam',
    bond: '2 Years',
    positionOverview: 'Software Development Engineer Trainee: An entry-level role focused on learning and assisting in building software under mentorship, involving coding, testing, debugging, and documentation within the full SDLC, bridging academic knowledge with practical industry skills to grow into a full engineer.\n\nComputer Vision Engineer Trainee: Learns to build systems that help machines "see," focusing on tasks like object detection, image recognition, and video analysis by processing visual data, coding algorithms, training deep learning models (TensorFlow/PyTorch), and assisting in integrating these solutions.',
    tenthCutoff: 75,
    twelfthCutoff: 75,
    customFields: [
      {
        id: 'cf_10th',
        label: '10th & 12th Percentage Minimum Cutoff',
        type: 'number',
        value: 75,
        required: true,
        min: 0,
        max: 100,
        step: 1
      },
      {
        id: 'cf_bond',
        label: 'Service Agreement / Bond Period',
        type: 'text',
        value: '2 Years',
        required: true
      },
      {
        id: 'cf_venue',
        label: 'Campus Drive Venue',
        type: 'text',
        value: 'Bannari Amman Institute of Technology, Sathyamangalam',
        required: true
      }
    ]
  }
];

function loadCompanies(): Company[] {
  const data = localStorage.getItem(COMPANIES_KEY);
  if (!data) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES;
  }
  return JSON.parse(data);
}

function saveCompanies(companies: Company[]) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/companies`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend server offline, falling back to local storage companies.');
  }
  return loadCompanies();
}

export async function addCompany(companyData: Omit<Company, 'id'>): Promise<Company> {
  const newCompany: Company = {
    ...companyData,
    id: `co_${Date.now()}`
  };

  try {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCompany)
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend server offline, saving company to local storage.');
  }

  const companies = loadCompanies();
  companies.push(newCompany);
  saveCompanies(companies);
  return newCompany;
}

export async function updateCompany(id: string, updatedData: Partial<Company>): Promise<Company> {
  const companies = loadCompanies();
  const index = companies.findIndex(c => c.id === id);

  const baseCompany: Company = index >= 0 ? companies[index] : {
    id,
    name: 'Placement Drive Company',
    jobRole: 'Software Engineer Trainee',
    salaryPackage: 'Competitive CTC',
    location: 'Campus',
    allowedDepartments: ['AI&DS', 'CSE', 'ECE', 'IT', 'MECH'],
    cgpaCutoff: 6.0,
    maxActiveArrears: 0,
    description: '',
    requirements: [],
    year: new Date().getFullYear().toString(),
    requiredSkills: [],
    requiredProjects: 0,
    status: 'Active'
  };

  const updatedCompany: Company = { ...baseCompany, ...updatedData };

  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCompany)
    });
    if (response.ok) {
      const serverCompany = await response.json();
      if (index >= 0) {
        companies[index] = serverCompany;
      } else {
        companies.unshift(serverCompany);
      }
      saveCompanies(companies);
      return serverCompany;
    }
  } catch (e) {
    console.warn('Backend server offline, updating company in local storage.');
  }

  if (index >= 0) {
    companies[index] = updatedCompany;
  } else {
    companies.unshift(updatedCompany);
  }
  saveCompanies(companies);
  return updatedCompany;
}

export async function deleteCompany(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend server offline, deleting company from local storage.');
  }

  const companies = loadCompanies();
  const filtered = companies.filter(c => c.id !== id);
  if (filtered.length === companies.length) return false;
  saveCompanies(filtered);
  return true;
}

// Complex Eligibility Evaluator
export interface CompanyEligibilityResult {
  isEligible: boolean;
  matchedCriteriaCount?: number;
  totalCriteriaCount?: number;
  reasons: string[];
  missingSkills: string[];
  cgpaShortfall: number;
  projectShortfall: number;
  departmentMatch: boolean;
  arrearsOk: boolean;
  recommendations: string[];
}

export async function evaluateStudentEligibility(student: Student, company: Company): Promise<CompanyEligibilityResult> {
  const missingSkills: string[] = [];
  const recommendations: string[] = [];
  const reasons: string[] = [];

  // 1. Department match
  const studentDept = (student.department || '').toLowerCase().trim();
  const allowedDepts = company.allowedDepartments || (company as any).eligibleBranches || [];
  let departmentMatch = !allowedDepts || allowedDepts.length === 0 || allowedDepts.some(d => d.toLowerCase().includes('all') || d.trim() === '');
  if (!departmentMatch) {
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
    departmentMatch = allowedDepts.some((rawD: string) => {
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
  if (!departmentMatch) {
    reasons.push(`Department ${student.department} is not in allowed departments (${company.allowedDepartments?.join(', ')})`);
  }

  // 2. CGPA evaluation
  const cgpaShortfall = Math.max(0, parseFloat(((company.cgpaCutoff || 0) - (student.cgpa || 0)).toFixed(2)));
  if (cgpaShortfall > 0) {
    reasons.push(`CGPA ${student.cgpa} is below cutoff ${company.cgpaCutoff}`);
    recommendations.push(`Short by ${cgpaShortfall} CGPA. Focus on academic grades.`);
  }

  // 3. Skill evaluation
  if (company.requiredSkills && company.requiredSkills.length > 0) {
    const studentSkills = (student.skills || []).map(s => s.toLowerCase().trim());
    if (studentSkills.length > 0) {
      company.requiredSkills.forEach(reqSkill => {
        const r = reqSkill.toLowerCase().trim();
        const hasSkill = studentSkills.some(s => s.includes(r) || r.includes(s));
        if (!hasSkill) {
          missingSkills.push(reqSkill);
        }
      });
      // If student has at least 1 matching skill or 50%+ match, don't hard penalize
      if (missingSkills.length === company.requiredSkills.length) {
        reasons.push(`Missing required skills: ${missingSkills.join(', ')}`);
        recommendations.push(`Build skill proficiency in: ${missingSkills.join(', ')}`);
      } else {
        missingSkills.length = 0; // Partial skill match is acceptable
      }
    }
  }

  // 4. Projects evaluation
  const studentProjectCount = student.projects?.length || 0;
  const projectShortfall = Math.max(0, (company.requiredProjects || 0) - studentProjectCount);
  if (projectShortfall > 0) {
    reasons.push(`Projects count (${studentProjectCount}) is below required (${company.requiredProjects})`);
    recommendations.push(`Complete at least ${projectShortfall} more project(s).`);
  }

  // 5. Active Arrears evaluation
  const studentArrears = student.activeArrears || 0;
  const maxAllowedArrears = company.maxActiveArrears !== undefined && company.maxActiveArrears !== null ? company.maxActiveArrears : 99;
  const arrearsOk = studentArrears <= maxAllowedArrears;
  if (!arrearsOk) {
    reasons.push(`Active arrears (${studentArrears}) exceeds maximum allowed (${maxAllowedArrears})`);
  }

  // 6. Passing Year / Batch evaluation
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
        reasons.push(`Passing year (${student.year}) does not match company target batch (${company.year})`);
      }
    }
  }

  // Check Manual Override list (Placement Officer Special Eligibility)
  if (company.manuallyIncludedStudentIds && (company.manuallyIncludedStudentIds.includes(student.id) || company.manuallyIncludedStudentIds.includes(student.registerNumber))) {
    return {
      isEligible: true,
      reasons: [],
      missingSkills: [],
      cgpaShortfall: 0,
      projectShortfall: 0,
      departmentMatch: true,
      arrearsOk: true,
      recommendations: ['Manually included by Placement Officer based on Aptitude Performance.']
    };
  }

  // 7. Aptitude Score Criteria evaluation
  let aptitudeOk = true;
  if (company.minAptitudeScore && company.minAptitudeScore > 0) {
    const sAptitude = student.aptitudeScore || 0;
    if (sAptitude < company.minAptitudeScore) {
      aptitudeOk = false;
      reasons.push(`Aptitude Score (${sAptitude}) is below required minimum (${company.minAptitudeScore})`);
      recommendations.push(`Improve weekly aptitude assessment scores to at least ${company.minAptitudeScore}.`);
    }
  }

  // Calculate matched criteria count
  let matchedCriteriaCount = 0;
  let totalCriteriaCount = 6;

  if (departmentMatch) matchedCriteriaCount++;
  if (cgpaShortfall === 0) matchedCriteriaCount++;
  if (arrearsOk) matchedCriteriaCount++;
  if (missingSkills.length === 0) matchedCriteriaCount++;
  if (projectShortfall === 0) matchedCriteriaCount++;
  if (yearMatch) matchedCriteriaCount++;
  if (company.minAptitudeScore && company.minAptitudeScore > 0) {
    totalCriteriaCount++;
    if (aptitudeOk) matchedCriteriaCount++;
  }

  // Flexible Eligibility: Student is eligible if fully matching OR matching 2+ criteria (partial match)
  const isEligible = (departmentMatch && cgpaShortfall === 0 && missingSkills.length === 0 && projectShortfall === 0 && arrearsOk && yearMatch && aptitudeOk) || (matchedCriteriaCount >= 2);

  if (isEligible) {
    if (matchedCriteriaCount === totalCriteriaCount) {
      recommendations.push(`Fully eligible (${matchedCriteriaCount}/${totalCriteriaCount} criteria met)! Review mock technical problems for ${company.name}.`);
    } else {
      recommendations.push(`Partially eligible (${matchedCriteriaCount}/${totalCriteriaCount} criteria met). Recommended for faculty review.`);
    }
  }

  return {
    isEligible,
    matchedCriteriaCount,
    totalCriteriaCount,
    reasons,
    missingSkills,
    cgpaShortfall,
    projectShortfall,
    departmentMatch,
    arrearsOk,
    recommendations
  };
}

// Fetch all eligible students for a company
export async function getEligibleStudentsForCompany(company: Company): Promise<{
  eligibleStudents: Student[];
  ineligibleStudents: { student: Student; reason: CompanyEligibilityResult }[];
}> {
  const students = await getStudents();
  const eligibleStudents: Student[] = [];
  const ineligibleStudents: { student: Student; reason: CompanyEligibilityResult }[] = [];

  for (const student of students) {
    const evaluation = await evaluateStudentEligibility(student, company);
    if (evaluation.isEligible) {
      eligibleStudents.push(student);
    } else {
      ineligibleStudents.push({ student, reason: evaluation });
    }
  }

  return {
    eligibleStudents,
    ineligibleStudents
  };
}

// -------------------------------------------------------------
// STUDENT APPLICATIONS LOCAL STORAGE MANAGERS
// -------------------------------------------------------------
const DEFAULT_APPLICATIONS: StudentApplication[] = [];

export function getStudentApplications(): StudentApplication[] {
  const data = localStorage.getItem(APPLICATIONS_KEY);
  if (!data) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(DEFAULT_APPLICATIONS));
    return DEFAULT_APPLICATIONS;
  }
  return JSON.parse(data);
}

export async function getStudentApplicationsAPI(): Promise<StudentApplication[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`);
    if (response.ok) {
      const serverApps = await response.json();
      if (Array.isArray(serverApps) && serverApps.length > 0) {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(serverApps));
        return serverApps;
      }
    }
  } catch (e) {
    console.warn('Backend server offline, returning local applications.');
  }
  return getStudentApplications();
}

export function saveStudentApplication(appData: Omit<StudentApplication, 'id'>): StudentApplication {
  const apps = getStudentApplications();
  
  // Check if student already applied to this company
  const existingIndex = apps.findIndex(
    a => a.studentId === appData.studentId && a.companyId === appData.companyId
  );

  let savedApp: StudentApplication;
  if (existingIndex >= 0) {
    apps[existingIndex] = {
      ...apps[existingIndex],
      ...appData
    };
    savedApp = apps[existingIndex];
  } else {
    savedApp = {
      ...appData,
      id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    apps.push(savedApp);
  }
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

  // Async sync to server
  fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(savedApp)
  }).catch(err => console.warn('Offline application save fallback', err));

  return savedApp;
}

export function updateApplicationStatus(id: string, status: 'Applied' | 'Pending' | 'Selected' | 'Rejected'): StudentApplication {
  const apps = getStudentApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Application record not found');

  apps[index].status = status;
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

  // Async sync status to server
  fetch(`${API_BASE_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).catch(err => console.warn('Offline status update fallback', err));

  return apps[index];
}

export function saveBulkStudentApplications(appList: Omit<StudentApplication, 'id'>[]): StudentApplication[] {
  const apps = getStudentApplications();
  const updated: StudentApplication[] = [];

  for (const appData of appList) {
    const existingIndex = apps.findIndex(
      a => (a.registerNumber.toLowerCase() === appData.registerNumber.toLowerCase() || (a.studentId && a.studentId === appData.studentId)) && 
           (a.companyId === appData.companyId || a.companyName.toLowerCase() === appData.companyName.toLowerCase())
    );

    if (existingIndex >= 0) {
      apps[existingIndex] = {
        ...apps[existingIndex],
        ...appData,
        status: appData.status || 'Applied'
      };
      updated.push(apps[existingIndex]);
    } else {
      const newApp: StudentApplication = {
        ...appData,
        id: `app_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        status: appData.status || 'Applied'
      };
      apps.push(newApp);
      updated.push(newApp);
    }
  }

  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  return updated;
}


