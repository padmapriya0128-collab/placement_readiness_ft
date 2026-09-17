export interface Student {
  id: string;
  name: string;
  fullName?: string;
  registerNumber: string;
  department: string;
  year: number | string;
  section: string;
  email: string;
  phone?: string;
  cgpa: number;
  attendance?: number;
  tenthPercentage?: number | string;
  twelfthPercentage?: number | string;
  diplomaPercentage?: number | string;
  skills: string[];
  certifications: string[];
  internships: string[];
  projects: string[];
  activeArrears?: number;
  historyArrears?: number;
  gender?: 'Male' | 'Female' | 'Other';
  resumeUrl?: string;
  resume?: string;
  resumeScore?: number; // 0 - 100
  assessmentMarks?: { title: string; marks: number; maxMarks: number; grade?: string }[];
  aptitudeScore?: number;
  logicalScore?: number;
  quantScore?: number;
  verbalScore?: number;
  codingScore?: number;
  aptitudeHistory?: { 
    assessmentTitle?: string; 
    date?: string; 
    score: number; 
    logicalScore?: number; 
    quantScore?: number; 
    verbalScore?: number; 
    codingScore?: number; 
    result?: string;
  }[];
  linkedinUrl?: string;
  readinessScore: number; // 0 - 100
  strengths?: string[];
  weaknesses?: string[];
  skillGap?: string[];
  recommendations?: string[];
  placementStatus: 'Placed' | 'Eligible' | 'Not Eligible' | 'In Progress';
  username: string;
  role?: string;
  password?: string;
  avatarUrl?: string;
  profileCompletion?: number;
  uploadedBy?: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date';
  value?: string | number;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface GeneratedFormConfig {
  isGenerated: boolean;
  isPublished: boolean;
  customInstructions?: string;
  allowResumeUpload?: boolean;
  collectCertifications?: boolean;
  collectSkills?: boolean;
  collectBacklogsDetail?: boolean;
  customFields?: CustomFormField[];
  generatedAt?: string;
  publishedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  location: string;
  jobRole: string;
  salaryPackage: string; // e.g. "5.0 LPA"
  cgpaCutoff: number;
  allowedDepartments: string[];
  year?: string;
  requiredSkills?: string[];
  requiredCertifications?: string[];
  internshipRequired?: 'Yes' | 'No';
  requiredProjects?: number;
  maxActiveArrears?: number;
  eligibleGender?: 'All' | 'Male' | 'Female';
  applicationDeadline?: string;
  selectionProcess?: string;
  description: string;
  googleFormLink?: string;
  additionalInstructions?: string;
  status?: 'Active' | 'Closed' | 'Upcoming';

  // Aptitude Criteria & Manual Override Eligibility
  enableAptitudeFilter?: boolean;
  minAptitudeScore?: number;
  minLogicalScore?: number;
  minQuantScore?: number;
  minVerbalScore?: number;
  minCodingScore?: number;
  manuallyIncludedStudentIds?: string[];

  // Extended Company Recruitment & Circular Requirements
  educationalQualification?: string; // e.g. "B.E ( ECE / CSE / IT )"
  eligibleBranches?: string[];
  vacancies?: number | string;
  employmentType?: 'Full-Time' | 'Internship' | 'Internship + Full-Time' | 'Contract';
  workMode?: 'Onsite' | 'Remote' | 'Hybrid';
  recruitmentDate?: string;

  // VIS AI LABS Circular Template Attributes
  circularRefNo?: string; // e.g. "42 / 2025-2026 / TPC"
  circularDate?: string; // e.g. "29.12.2025"
  driveVenue?: string; // e.g. "Bannari Amman Institute of Technology, Sathyamangalam"
  bond?: string; // e.g. "2 Years"
  positionOverview?: string;
  tenthCutoff?: number | string; // e.g. 75
  twelfthCutoff?: number | string; // e.g. 75
  customFields?: CustomFormField[]; // Custom options added by Placement Officer

  // Dynamic Form Generation config & status
  generatedFormConfig?: GeneratedFormConfig;
  formStatus?: 'Draft' | 'Published' | 'Closed';
  requirements?: string[];
}

export interface StudentApplication {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  department: string;
  year: string | number;
  cgpa: number;
  companyId: string;
  companyName: string;
  jobRole: string;
  salaryPackage: string;
  status: 'Applied' | 'Pending' | 'Selected' | 'Rejected';
  appliedDate: string;
  googleFormSubmitted?: boolean;

  // Extended Student Application Fields
  email?: string;
  phone?: string;
  backlogs?: number;
  passingYear?: string;
  degree?: string;
  skillsSubmitted?: string[];
  certificationsSubmitted?: string[];
  resumeUrl?: string;
  customAnswers?: Record<string, string>;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert' | 'company';
  companyId?: string;
  googleFormLink?: string;
  role?: string;
  package?: string;
  deadline?: string;
}

export interface Dataset {
  id: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'json';
  uploadDate: string;
  recordCount: number;
  missingValues: number;
  dataQualityScore: number; // 0 - 100
  dataPreview: Record<string, string | number>[];
  uploadedBy?: string;
}

export interface ActivityHistory {
  id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface Assessment {
  id: string;
  title: string;
  date: string;
  maxMarks: number;
  averageScore?: number;
  classSection?: string;
  subject?: string;
  createdBy?: string;
}

export interface StudentScore {
  studentId: string;
  studentName: string;
  registerNumber: string;
  marksObtained: number;
  status: 'Absent' | 'Present';
}


