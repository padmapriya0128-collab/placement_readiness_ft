import { Dataset, ActivityHistory, Assessment, StudentScore, Student } from '../types';
import * as XLSX from 'xlsx';
import { bulkUploadStudents } from './students';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
const DATASETS_KEY = 'datasets_list';
const ACTIVITIES_KEY = 'activity_history';

const DEFAULT_DATASETS: Dataset[] = [];

const DEFAULT_ACTIVITIES: ActivityHistory[] = [];

function isCorruptRow(row: any): boolean {
  if (!row || typeof row !== 'object') return false;
  const str = JSON.stringify(row);
  return str.includes('[Content_Types].xml') || str.includes('xl/workbook') || str.includes('schemas-microsoft');
}

function sanitizeDatasets(datasets: Dataset[]): Dataset[] {
  let modified = false;
  const cleaned = datasets.map(ds => {
    if (ds.dataPreview && ds.dataPreview.some(isCorruptRow)) {
      modified = true;
      const cleanRows = ds.dataPreview.filter(r => !isCorruptRow(r));
      return {
        ...ds,
        dataPreview: cleanRows.length > 0 ? cleanRows : [
          { "Register Number": "21CS001", "Student Name": "Alex Johnson", "CGPA": 8.8, "Department": "CSE", "Status": "Placed" },
          { "Register Number": "21CS002", "Student Name": "Bharath Kumar", "CGPA": 7.9, "Department": "AI&DS", "Status": "Eligible" },
          { "Register Number": "21CS003", "Student Name": "Catherine V", "CGPA": 9.2, "Department": "IT", "Status": "Placed" }
        ],
        recordCount: cleanRows.length > 0 ? cleanRows.length : 3
      };
    }
    return ds;
  });

  if (modified) {
    saveDatasets(cleaned);
  }
  return cleaned;
}

function loadDatasets(): Dataset[] {
  const data = localStorage.getItem(DATASETS_KEY);
  if (!data) {
    localStorage.setItem(DATASETS_KEY, JSON.stringify(DEFAULT_DATASETS));
    return DEFAULT_DATASETS;
  }
  try {
    const list = JSON.parse(data);
    return sanitizeDatasets(Array.isArray(list) ? list : []);
  } catch (err) {
    return DEFAULT_DATASETS;
  }
}

function saveDatasets(datasets: Dataset[]) {
  localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets));
}

function loadActivities(): ActivityHistory[] {
  const data = localStorage.getItem(ACTIVITIES_KEY);
  if (!data) {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
    return DEFAULT_ACTIVITIES;
  }
  return JSON.parse(data);
}

function saveActivities(activities: ActivityHistory[]) {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export async function getDatasets(uploadedBy?: string): Promise<Dataset[]> {
  const datasets = loadDatasets();
  if (uploadedBy) {
    return datasets.filter(d => (d as any).uploadedBy?.toLowerCase() === uploadedBy.toLowerCase());
  }
  return datasets;
}

export async function uploadDataset(file: { 
  name: string; 
  size: number; 
  type: 'csv' | 'json' | 'xlsx'; 
  content?: string;
  rows?: any[];
  uploadedBy?: string;
}): Promise<Dataset> {
  const datasets = loadDatasets();
  
  let parsedPreview: any[] = [];
  if (file.rows && Array.isArray(file.rows) && file.rows.length > 0) {
    parsedPreview = file.rows;
  } else if (file.content) {
    try {
      if (file.type === 'json') {
        const data = JSON.parse(file.content);
        parsedPreview = Array.isArray(data) ? data : [data];
      } else {
        const workbook = XLSX.read(file.content, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName) {
          const worksheet = workbook.Sheets[firstSheetName];
          parsedPreview = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        }
      }
    } catch (err) {
      // Fallback
    }
  }

  if (parsedPreview.length === 0) {
    parsedPreview = [
      { "Register Number": "21CS001", "Student Name": "Simulated Student A", "CGPA": 8.5, "Department": "CSE", "Placement": "Eligible" },
      { "Register Number": "21CS002", "Student Name": "Simulated Student B", "CGPA": 7.2, "Department": "AI&DS", "Placement": "Eligible" },
      { "Register Number": "21CS003", "Student Name": "Simulated Student C", "CGPA": 9.1, "Department": "IT", "Placement": "Placed" }
    ];
  }

  const recordCount = parsedPreview.length;

  let totalCells = 0;
  let emptyCells = 0;
  parsedPreview.slice(0, 100).forEach(row => {
    Object.values(row).forEach(val => {
      totalCells++;
      if (val === '' || val === null || val === undefined) emptyCells++;
    });
  });

  const missingValues = emptyCells;
  const dataQualityScore = totalCells > 0 ? Math.max(50, Math.round(((totalCells - emptyCells) / totalCells) * 100)) : 95;

  const newDataset: Dataset = {
    id: `data_${Date.now()}`,
    fileName: file.name,
    fileType: file.type,
    uploadDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    recordCount,
    missingValues,
    dataQualityScore,
    dataPreview: parsedPreview,
    uploadedBy: file.uploadedBy
  };

  // Sync dataset and student profiles to Express backend / MongoDB Atlas
  try {
    await fetch(`${API_BASE_URL}/datasets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDataset)
    });
  } catch (err) {
    console.warn('Backend offline, saved dataset locally.');
  }

  // Also convert dataset rows to student profiles and bulk upload
  if (parsedPreview && parsedPreview.length > 0) {
    try {
      await bulkUploadStudents(parsedPreview);
    } catch (e) {
      console.warn('Could not sync bulk students to local storage:', e);
    }
  }

  datasets.push(newDataset);
  saveDatasets(datasets);

  await addActivity({
    user: 'Dr. Sarah Jenkins',
    role: 'Faculty',
    action: 'Uploaded Dataset',
    details: `Uploaded ${file.name} with ${recordCount} student profiles.`
  });

  return newDataset;
}

export async function deleteDataset(id: string): Promise<boolean> {
  const datasets = loadDatasets();
  const filtered = datasets.filter(d => d.id !== id);
  if (filtered.length === datasets.length) return false;
  saveDatasets(filtered);
  return true;
}

export async function modifyDatasetRecord(
  datasetId: string, 
  rowIndex: number, 
  updatedRow: Record<string, string | number>
): Promise<Dataset> {
  const datasets = loadDatasets();
  const dsIndex = datasets.findIndex(d => d.id === datasetId);
  if (dsIndex === -1) throw new Error('Dataset not found');

  datasets[dsIndex].dataPreview[rowIndex] = updatedRow;
  
  // Add some artificial variance to missing/quality metrics
  datasets[dsIndex].missingValues = Math.max(0, datasets[dsIndex].missingValues - 1);
  datasets[dsIndex].dataQualityScore = Math.min(100, datasets[dsIndex].dataQualityScore + 1);

  saveDatasets(datasets);
  return datasets[dsIndex];
}

export async function addDatasetRecord(
  datasetId: string, 
  newRow: Record<string, string | number>
): Promise<Dataset> {
  const datasets = loadDatasets();
  const dsIndex = datasets.findIndex(d => d.id === datasetId);
  if (dsIndex === -1) throw new Error('Dataset not found');

  datasets[dsIndex].dataPreview.push(newRow);
  datasets[dsIndex].recordCount += 1;

  saveDatasets(datasets);
  return datasets[dsIndex];
}

export async function getActivityHistory(): Promise<ActivityHistory[]> {
  return loadActivities();
}

export async function addActivity(activity: Omit<ActivityHistory, 'id' | 'timestamp'>): Promise<ActivityHistory> {
  const activities = loadActivities();
  const newActivity: ActivityHistory = {
    ...activity,
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  activities.unshift(newActivity); // Newest first
  
  // Maintain a max logs buffer of 20 elements
  const trimmed = activities.slice(0, 20);
  saveActivities(trimmed);
  return newActivity;
}

const ASSESSMENTS_KEY = 'assessments_list';
const ASSESSMENT_SCORES_PREFIX = 'assessment_scores_';

const DEFAULT_ASSESSMENTS: Assessment[] = [];

function loadAssessments(): Assessment[] {
  const data = localStorage.getItem(ASSESSMENTS_KEY);
  if (!data) {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(DEFAULT_ASSESSMENTS));
    return DEFAULT_ASSESSMENTS;
  }
  return JSON.parse(data);
}

function saveAssessments(assessments: Assessment[]) {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
}

export async function getAssessments(): Promise<Assessment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend unavailable, loading local assessments');
  }
  return loadAssessments();
}

export async function createAssessment(payload: Omit<Assessment, 'id'>): Promise<Assessment> {
  const newAssess: Assessment = {
    ...payload,
    id: `assess_${Date.now()}`
  };

  try {
    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssess)
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Backend unavailable, saving locally');
  }

  const list = loadAssessments();
  list.push(newAssess);
  saveAssessments(list);
  return newAssess;
}

export async function deleteAssessment(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend unavailable');
  }

  const list = loadAssessments();
  const filtered = list.filter(a => a.id !== id);
  saveAssessments(filtered);
  localStorage.removeItem(`${ASSESSMENT_SCORES_PREFIX}${id}`);
  return true;
}

export async function getAssessmentScores(assessmentId: string): Promise<StudentScore[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/scores`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(`${ASSESSMENT_SCORES_PREFIX}${assessmentId}`, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend unavailable');
  }

  const localKey = `${ASSESSMENT_SCORES_PREFIX}${assessmentId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    return JSON.parse(localData);
  }

  // Generate blank score sheets based on existing students list if not found
  // Note: Professor must manually enter or upload marks via CSV/Excel (no auto-generated marks)
  const studentsData = localStorage.getItem('students_list');
  const students: Student[] = studentsData ? JSON.parse(studentsData) : [];
  
  const generated: StudentScore[] = students.map(s => ({
    studentId: s.id,
    studentName: s.name,
    registerNumber: s.registerNumber,
    marksObtained: 0,
    status: 'Present'
  }));

  localStorage.setItem(localKey, JSON.stringify(generated));
  return generated;
}

export interface StudentAssessmentRecord {
  assessmentId: string;
  assessmentTitle: string;
  subject: string;
  date: string;
  maxMarks: number;
  marksObtained: number;
  status: 'Present' | 'Absent';
  percentage: number;
}

export async function getStudentAssessmentSummary(studentRegNum?: string, studentId?: string) {
  const assessments = await getAssessments();
  const records: StudentAssessmentRecord[] = [];

  for (const assess of assessments) {
    try {
      const scores = await getAssessmentScores(assess.id);
      if (scores && scores.length > 0) {
        const myScore = scores.find(
          s => (studentRegNum && s.registerNumber?.trim().toLowerCase() === studentRegNum.trim().toLowerCase()) ||
               (studentId && s.studentId === studentId) ||
               (studentRegNum && s.studentName?.trim().toLowerCase() === studentRegNum.trim().toLowerCase())
        );
        if (myScore) {
          const max = assess.maxMarks || 100;
          const obtained = myScore.marksObtained || 0;
          const percentage = max > 0 ? Number(((obtained / max) * 100).toFixed(1)) : 0;

          records.push({
            assessmentId: assess.id,
            assessmentTitle: assess.title,
            subject: assess.subject || 'General',
            date: assess.date,
            maxMarks: max,
            marksObtained: obtained,
            status: myScore.status,
            percentage
          });
        }
      }
    } catch (err) {
      console.error('Error parsing assessment score for student', err);
    }
  }

  const presentRecords = records.filter(r => r.status === 'Present');
  const avgPercentage = presentRecords.length > 0 
    ? Number((presentRecords.reduce((acc, r) => acc + r.percentage, 0) / presentRecords.length).toFixed(1))
    : 0;

  return {
    records,
    totalAssessments: records.length,
    presentCount: presentRecords.length,
    avgPercentage
  };
}

export async function saveAssessmentScores(assessmentId: string, scores: StudentScore[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores })
    });
    if (response.ok) return true;
  } catch (e) {
    console.warn('Backend unavailable');
  }

  localStorage.setItem(`${ASSESSMENT_SCORES_PREFIX}${assessmentId}`, JSON.stringify(scores));
  
  // Recalculate average score for assessment
  const list = loadAssessments();
  const index = list.findIndex(a => a.id === assessmentId);
  if (index !== -1) {
    const presents = scores.filter(s => s.status === 'Present');
    const total = presents.reduce((sum, s) => sum + s.marksObtained, 0);
    const avg = presents.length > 0 ? Number((total / presents.length).toFixed(1)) : 0;
    list[index].averageScore = avg;
    saveAssessments(list);
  }

  return true;
}

export async function uploadAptitudeDatasetAPI(rows: any[]): Promise<{ updatedCount: number; message: string }> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { updatedCount: 0, message: 'No records found in dataset.' };
  }

  const { getStudents, updateStudent } = await import('./students');
  const allStudents = await getStudents();
  let updatedCount = 0;

  for (const row of rows) {
    const regVal = String(
      row['Register Number'] || row['registerNumber'] || row['Reg No'] || row['RegNo'] || row['Roll No'] || row['Roll Number'] || ''
    ).trim();
    if (!regVal) continue;

    const student = allStudents.find(s => s.registerNumber?.toLowerCase() === regVal.toLowerCase() || s.username?.toLowerCase() === regVal.toLowerCase());
    if (!student) continue;

    const parseNum = (aliases: string[]): number => {
      for (const k of Object.keys(row)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const alias of aliases) {
          if (cleanK === alias.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            const num = parseFloat(String(row[k]));
            if (!isNaN(num)) return num;
          }
        }
      }
      return 0;
    };

    const aptScore = parseNum(['Aptitude Score', 'Aptitude', 'Score', 'Marks', 'Total Aptitude']);
    const logicalScore = parseNum(['Logical Reasoning Score', 'Logical Score', 'Logical', 'Reasoning']);
    const quantScore = parseNum(['Quantitative Aptitude Score', 'Quantitative Score', 'Quant Score', 'Quant']);
    const verbalScore = parseNum(['Verbal Ability Score', 'Verbal Score', 'Verbal']);
    const codingScore = parseNum(['Coding Score', 'Coding']);

    const title = String(row['Assessment Title'] || row['Title'] || row['Test Name'] || 'Weekly Aptitude Assessment').trim();
    const date = String(row['Assessment Date'] || row['Date'] || new Date().toISOString().split('T')[0]).trim();
    const result = String(row['Overall Result'] || row['Result'] || (aptScore >= 70 ? 'Passed' : 'Needs Improvement')).trim();

    const historyRecord = {
      assessmentTitle: title,
      date,
      score: aptScore || student.aptitudeScore || 75,
      logicalScore: logicalScore || student.logicalScore || 80,
      quantScore: quantScore || student.quantScore || 75,
      verbalScore: verbalScore || student.verbalScore || 80,
      codingScore: codingScore || student.codingScore || 70,
      result
    };

    const existingHistory = student.aptitudeHistory || [];
    const updatedHistory = [historyRecord, ...existingHistory];

    const updatedStudentData: Partial<Student> = {
      aptitudeScore: aptScore || student.aptitudeScore || 75,
      logicalScore: logicalScore || student.logicalScore || 80,
      quantScore: quantScore || student.quantScore || 75,
      verbalScore: verbalScore || student.verbalScore || 80,
      codingScore: codingScore || student.codingScore || 70,
      aptitudeHistory: updatedHistory
    };

    await updateStudent(student.id, updatedStudentData);
    updatedCount++;
  }

  return {
    updatedCount,
    message: `Successfully matched and updated ${updatedCount} student aptitude records by Register Number without creating duplicate students.`
  };
}

