import { Student } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
const STORAGE_KEY = 'students_list';

export function calculateReadinessScore(student: Partial<Student>): number {
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

// Student API Services
export async function getStudents(uploadedBy?: string): Promise<Student[]> {
  try {
    const url = uploadedBy 
      ? `${API_BASE_URL}/students?uploadedBy=${encodeURIComponent(uploadedBy)}`
      : `${API_BASE_URL}/students`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (!uploadedBy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (e) {
    console.warn('Backend server offline, returning local storage students.');
  }
  const local = localStorage.getItem(STORAGE_KEY);
  const list: Student[] = local ? JSON.parse(local) : [];
  if (uploadedBy) {
    return list.filter(s => (s as any).uploadedBy?.toLowerCase() === uploadedBy.toLowerCase());
  }
  return list;
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(id)}`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend server offline');
  }
  const students = await getStudents();
  return students.find(s => s.id === id || s.registerNumber?.toLowerCase() === id.toLowerCase()) || null;
}

export async function getStudentProfileByRegisterNumber(registerNumber: string): Promise<Student | null> {
  if (!registerNumber) return null;
  const cleanReg = registerNumber.trim();
  try {
    const response = await fetch(`${API_BASE_URL}/students/profile/${encodeURIComponent(cleanReg)}`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend offline, searching local storage');
  }
  const students = await getStudents();
  return students.find(s => s.registerNumber?.toLowerCase() === cleanReg.toLowerCase() || s.username?.toLowerCase() === cleanReg.toLowerCase()) || null;
}

export async function addStudent(studentData: Partial<Student>): Promise<Student> {
  const regNum = (studentData.registerNumber || `REG_${Date.now()}`).trim().toUpperCase();
  const name = (studentData.name || studentData.fullName || "Student").trim();
  const score = calculateReadinessScore(studentData);

  const payload = {
    ...studentData,
    registerNumber: regNum,
    fullName: name,
    name: name,
    readinessScore: score,
    score: score
  };

  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend offline');
  }

  const students = await getStudents();
  const newStudent = { ...payload, id: `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}` } as Student;
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  return newStudent;
}

export async function updateStudent(studentId: string, updatedData: Partial<Student>): Promise<Student> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(studentId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend offline');
  }

  const students = await getStudents();
  const index = students.findIndex(s => s.id === studentId || s.registerNumber === studentId);
  if (index === -1) throw new Error('Student not found');

  const merged = { ...students[index], ...updatedData };
  merged.readinessScore = calculateReadinessScore(merged);
  students[index] = merged;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  return merged;
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE'
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend offline');
  }

  const students = await getStudents();
  const filtered = students.filter(s => s.id !== studentId && s.registerNumber !== studentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// -------------------------------------------------------------
// EXCEL IMPORT & PREVIEW APIS
// -------------------------------------------------------------
export async function previewStudentImportAPI(params: { file?: File; rows?: any[]; defaultDepartment?: string }) {
  try {
    if (params.file) {
      const formData = new FormData();
      formData.append('file', params.file);
      if (params.defaultDepartment) formData.append('defaultDepartment', params.defaultDepartment);
      const response = await fetch(`${API_BASE_URL}/students/import/preview`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) return await response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/students/import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: params.rows, defaultDepartment: params.defaultDepartment })
      });
      if (response.ok) return await response.json();
    }
  } catch (e) {
    console.warn('Backend import preview offline', e);
  }
  return null;
}

export async function confirmStudentImportAPI(payload: {
  rows: any[];
  columnMapping?: Record<string, string>;
  defaultDepartment?: string;
  duplicateMode?: 'update' | 'skip' | 'new';
  fileName?: string;
  uploadedBy?: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/students/import/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend import confirm offline, using local storage multi-department fallback');
  }

  // Local storage fallback for multi-department data accumulation
  const existingStudents = await getStudents();
  const studentMap = new Map<string, Student>();
  existingStudents.forEach(s => {
    if (s.registerNumber) studentMap.set(s.registerNumber.toUpperCase(), s);
  });

  const fallbackDept = payload.defaultDepartment || 'AI&DS';
  let successfulRows = 0;
  let updatedRows = 0;

  for (let i = 0; i < (payload.rows || []).length; i++) {
    const rawItem = payload.rows[i];
    const item = rawItem.rawRow || rawItem;

    const mapped: Record<string, any> = {};
    if (payload.columnMapping) {
      Object.keys(payload.columnMapping).forEach(rawHeader => {
        const sysField = payload.columnMapping![rawHeader];
        if (sysField && sysField !== 'ignore') {
          mapped[sysField] = item[rawHeader] !== undefined ? item[rawHeader] : item[sysField];
        }
      });
    } else {
      Object.assign(mapped, item);
    }

    const regNum = String(mapped.registerNumber || item.registerNumber || '').trim().toUpperCase();
    const name = String(mapped.fullName || mapped.name || item.fullName || item.name || '').trim();

    if (!regNum || !name) continue;

    const cgpaVal = parseFloat(String(mapped.cgpa ?? 0).replace(/[^0-9.]/g, '')) || 0;
    const attendanceVal = parseFloat(String(mapped.attendance ?? 85).replace(/[^0-9.]/g, '')) || 85;

    const parseArr = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/[,;|]+/).map(s => s.trim()).filter(Boolean) : []);

    const updatedDoc: Partial<Student> = {
      registerNumber: regNum,
      name: name,
      fullName: name,
      username: regNum.toLowerCase(),
      department: String(mapped.department || fallbackDept).trim(),
      year: mapped.year || 4,
      section: String(mapped.section || 'A').trim(),
      email: String(mapped.email || `${regNum.toLowerCase()}@student.edu`).trim(),
      phone: String(mapped.phone || '').trim(),
      cgpa: cgpaVal,
      attendance: attendanceVal,
      skills: parseArr(mapped.skills),
      certifications: parseArr(mapped.certifications),
      internships: parseArr(mapped.internships),
      projects: parseArr(mapped.projects),
      placementStatus: mapped.placementStatus || 'Eligible',
      uploadedBy: payload.uploadedBy || 'Faculty'
    };

    const existing = studentMap.get(regNum);
    if (existing) {
      if (payload.duplicateMode === 'skip') continue;
      const merged = { ...existing, ...updatedDoc };
      merged.readinessScore = calculateReadinessScore(merged);
      studentMap.set(regNum, merged);
      updatedRows++;
    } else {
      const newStudent: Student = {
        id: `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}`,
        ...(updatedDoc as any),
        readinessScore: calculateReadinessScore(updatedDoc)
      };
      studentMap.set(regNum, newStudent);
      successfulRows++;
    }
  }

  const updatedList = Array.from(studentMap.values());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  return {
    success: true,
    stats: {
      totalRows: (payload.rows || []).length,
      successfulRows,
      updatedRows,
      skippedRows: 0,
      failedRows: 0
    }
  };
}

export async function getImportHistoryAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/students/import/history`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend import history offline');
  }
  return [];
}

// -------------------------------------------------------------
// BULK APIS
// -------------------------------------------------------------
export async function bulkUpdateStudentsAPI(studentIds: string[], updates: Partial<Student>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/bulk-update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds, updates })
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend bulk update offline');
  }

  // Local storage fallback
  const students = await getStudents();
  students.forEach(s => {
    if (studentIds.includes(s.id) || studentIds.includes(s.registerNumber)) {
      Object.assign(s, updates);
      s.readinessScore = calculateReadinessScore(s);
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  return true;
}

export async function bulkDeleteStudentsAPI(studentIds: string[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/students/bulk-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds })
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend bulk delete offline');
  }

  const students = await getStudents();
  const filtered = students.filter(s => !studentIds.includes(s.id) && !studentIds.includes(s.registerNumber));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export async function bulkUploadStudents(studentsArray: any[]): Promise<Student[]> {
  const result = await confirmStudentImportAPI({
    rows: studentsArray,
    duplicateMode: 'update',
    fileName: 'bulk_upload.xlsx'
  });
  return await getStudents();
}
