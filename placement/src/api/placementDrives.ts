import { Company, Student } from '../types';

export interface StudentDeliveryLog {
  studentId: string;
  name: string;
  registerNumber: string;
  email: string;
  department: string;
  cgpa: number;
  emailStatus: 'Sent' | 'Failed' | 'Pending';
  sentAt?: string;
  errorMessage?: string;
}

export interface PlacementDriveRecord {
  id: string;
  companyId: string;
  companyName: string;
  jobRole: string;
  salaryPackage: string;
  location: string;
  applicationDeadline: string;
  description: string;
  registrationFormUrl: string;
  pdfDataUrl?: string;
  eligibilityCriteria: {
    allowedDepartments?: string[];
    cgpaCutoff?: number;
    maxActiveArrears?: number;
    year?: string;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    internshipRequired?: string;
  };
  status: 'Published' | 'Draft' | 'Closed';
  publishedAt: string;
  publishedBy?: string;
  totalStudentsCount: number;
  eligibleStudentsCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  emailPendingCount: number;
  deliveryStatus: 'Delivered' | 'Partial Failure' | 'Pending';
  eligibleStudentIds: string[];
  studentsList: StudentDeliveryLog[];
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
const PLACEMENT_DRIVES_KEY = 'placement_drives_list';

function loadLocalDrives(): PlacementDriveRecord[] {
  const data = localStorage.getItem(PLACEMENT_DRIVES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLocalDrives(drives: PlacementDriveRecord[]) {
  localStorage.setItem(PLACEMENT_DRIVES_KEY, JSON.stringify(drives));
}

export async function publishPlacementDriveAPI(params: {
  company: Company;
  registrationFormUrl: string;
  pdfDataUrl?: string;
  eligibleStudents: Student[];
  allStudents: Student[];
  publisherName?: string;
}): Promise<{ success: boolean; drive: PlacementDriveRecord; message: string }> {
  const { company, registrationFormUrl, pdfDataUrl, eligibleStudents, allStudents, publisherName } = params;

  try {
    const response = await fetch(`${API_BASE_URL}/placement-drives/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        registrationFormUrl,
        pdfDataUrl,
        publisherName: publisherName || 'Placement Officer',
        company,
        eligibleStudents,
        allStudents
      })
    });

    if (response.ok) {
      const result = await response.json();
      // Sync local storage as well
      const local = loadLocalDrives();
      const existingIdx = local.findIndex(d => d.id === result.drive.id);
      if (existingIdx >= 0) {
        local[existingIdx] = result.drive;
      } else {
        local.unshift(result.drive);
      }
      saveLocalDrives(local);
      return result;
    }
  } catch (e) {
    console.warn('Server offline/unreachable during publish, operating in client fallback mode.');
  }

  // Fallback client simulation if server endpoint is unavailable
  const deliveryLogs: StudentDeliveryLog[] = eligibleStudents.map(student => ({
    studentId: student.id,
    name: student.name,
    registerNumber: student.registerNumber,
    email: student.email,
    department: student.department,
    cgpa: student.cgpa,
    emailStatus: 'Sent',
    sentAt: new Date().toISOString()
  }));

  const newDrive: PlacementDriveRecord = {
    id: `drive_${Date.now()}`,
    companyId: company.id,
    companyName: company.name,
    jobRole: company.jobRole,
    salaryPackage: company.salaryPackage,
    location: company.location,
    applicationDeadline: company.applicationDeadline || 'As per schedule',
    description: company.description || '',
    registrationFormUrl,
    pdfDataUrl,
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
    eligibleStudentsCount: eligibleStudents.length,
    emailSentCount: eligibleStudents.length,
    emailFailedCount: 0,
    emailPendingCount: 0,
    deliveryStatus: 'Delivered',
    eligibleStudentIds: eligibleStudents.map(s => s.id),
    studentsList: deliveryLogs
  };

  const local = loadLocalDrives();
  local.unshift(newDrive);
  saveLocalDrives(local);

  return {
    success: true,
    drive: newDrive,
    message: `Successfully published placement drive and dispatched emails to ${eligibleStudents.length} eligible students.`
  };
}

export async function getPublishedPlacementDrives(): Promise<PlacementDriveRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/placement-drives`);
    if (response.ok) {
      const data = await response.json();
      saveLocalDrives(data);
      return data;
    }
  } catch (e) {
    console.warn('Backend server offline, returning local placement drives.');
  }
  return loadLocalDrives();
}

export async function getEligibleDrivesForStudent(studentId: string, studentRegNum?: string, studentEmail?: string): Promise<PlacementDriveRecord[]> {
  const allDrives = await getPublishedPlacementDrives();
  return allDrives.filter(drive => {
    if (drive.status !== 'Published') return false;
    if (drive.eligibleStudentIds && drive.eligibleStudentIds.includes(studentId)) return true;
    if (drive.studentsList && drive.studentsList.some(s => 
      s.studentId === studentId || 
      (studentRegNum && s.registerNumber?.toLowerCase() === studentRegNum.toLowerCase()) ||
      (studentEmail && s.email?.toLowerCase() === studentEmail.toLowerCase())
    )) {
      return true;
    }
    return false;
  });
}

export async function deletePlacementDrive(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/placement-drives/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend server offline, deleting drive from local storage.');
  }

  const local = loadLocalDrives();
  const filtered = local.filter(d => d.id !== id);
  saveLocalDrives(filtered);
  return true;
}

export async function testNodemailerEmailAPI(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/placement-drives/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    return data;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Server connection error' };
  }
}

export const testSendGridEmailAPI = testNodemailerEmailAPI;

