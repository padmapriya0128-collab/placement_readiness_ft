import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  UploadCloud, 
  Search, 
  Filter, 
  UserPlus, 
  Users,
  Database, 
  FileText, 
  PieChart as ChartIcon, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  X, 
  Mail, 
  Phone, 
  Award, 
  FileSpreadsheet, 
  Linkedin,
  TrendingUp,
  SlidersHorizontal,
  FolderSync,
  BookOpen,
  CheckSquare,
  GraduationCap,
  Download
} from 'lucide-react';
import { Student, Dataset, ActivityHistory, Assessment, StudentScore, Company, StudentApplication } from '../types';
import { getStudents, addStudent, updateStudent, deleteStudent, bulkUploadStudents, getImportHistoryAPI, bulkDeleteStudentsAPI } from '../api/students';
import { getDatasets, uploadDataset, deleteDataset, addDatasetRecord, getActivityHistory, addActivity, getAssessments, createAssessment, deleteAssessment, getAssessmentScores, saveAssessmentScores } from '../api/faculty';
import { getCompanies, saveBulkStudentApplications } from '../api/placement';
import { normalizeRowToStudent, isMatchingDatasetRow, calculateReadinessScore } from '../utils/studentNormalizer';
import StudentImportModal from '../components/StudentImportModal';
import StudentBulkEditModal from '../components/StudentBulkEditModal';
import { exportToExcel } from '../utils/export';
import CircularScoreMeter from '../components/CircularScoreMeter';
import WatermarkBackground from '../components/WatermarkBackground';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface FacultyDashboardProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function FacultyDashboard({
  user,
  activeTab,
  setActiveTab,
  searchTerm,
  onAddNotification
}: FacultyDashboardProps) {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [maxCgpa, setMaxCgpa] = useState('');
  const [minReadiness, setMinReadiness] = useState('');
  const [maxReadiness, setMaxReadiness] = useState('');

  // Import & Bulk Management States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] = useState(false);
  const [importHistoryList, setImportHistoryList] = useState<any[]>([]);
  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);

  // Modals & Forms
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  
  // New Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    registerNumber: '',
    department: 'Computer Science',
    year: 4,
    section: 'A',
    email: '',
    phone: '',
    cgpa: 8.0,
    skillsString: '',
    certificationsString: '',
    internshipsString: '',
    projectsString: '',
    username: '',
    password: '',
    linkedinUrl: '',
    placementStatus: 'Eligible' as any,
    resumeScore: 75
  });

  // Class / Batch Access Form States
  const [classDept, setClassDept] = useState('AI&DS');
  const [classYear, setClassYear] = useState('3rd Year');
  const [classSection, setClassSection] = useState('A');
  const [classStrength, setClassStrength] = useState(60);
  const [classUsernamePattern, setClassUsernamePattern] = useState('AIDS3A');
  const [classPassword, setClassPassword] = useState('aids2026');
  const [classRegisterNumbers, setClassRegisterNumbers] = useState('');

  // Bulk Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Dataset specific states
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [datasetRecordForm, setDatasetRecordForm] = useState<Record<string, string>>({});

  // Assessment specific states
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [assessmentScores, setAssessmentScores] = useState<StudentScore[]>([]);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);
  const [showImportAssessmentModal, setShowImportAssessmentModal] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [newAssessmentForm, setNewAssessmentForm] = useState({
    title: '',
    maxMarks: 100,
    date: new Date().toISOString().split('T')[0],
    classSection: 'CS-A',
    subject: 'Data Structures'
  });
  const [importAssessmentForm, setImportAssessmentForm] = useState({
    title: '',
    maxMarks: 100,
    date: new Date().toISOString().split('T')[0],
    classSection: 'CS-A',
    subject: 'Data Structures'
  });
  const [importedScores, setImportedScores] = useState<StudentScore[]>([]);
  const [importedFileName, setImportedFileName] = useState('');

  // Applied Students Excel Upload States
  const [showUploadAppliedExcelModal, setShowUploadAppliedExcelModal] = useState(false);
  const [availableCompaniesForUpload, setAvailableCompaniesForUpload] = useState<Company[]>([]);
  const [selectedCompanyForUpload, setSelectedCompanyForUpload] = useState<Company | null>(null);
  const [parsedAppliedRows, setParsedAppliedRows] = useState<any[]>([]);
  const [appliedFileName, setAppliedFileName] = useState('');
  const [uploadAppliedError, setUploadAppliedError] = useState('');

  const handleOpenUploadAppliedExcelModal = async () => {
    try {
      const coList = await getCompanies();
      setAvailableCompaniesForUpload(coList);
      if (coList.length > 0) {
        setSelectedCompanyForUpload(coList[0]);
      }
      setParsedAppliedRows([]);
      setAppliedFileName('');
      setUploadAppliedError('');
      setShowUploadAppliedExcelModal(true);
    } catch (err: any) {
      alert(err.message || 'Error loading companies');
    }
  };

  const handleAppliedExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAppliedFileName(file.name);
    setUploadAppliedError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          setUploadAppliedError('Uploaded file appears to be empty.');
          return;
        }
        setParsedAppliedRows(json);
      } catch (err: any) {
        setUploadAppliedError('Error parsing Excel file: ' + (err.message || 'Invalid format'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveAppliedExcel = async () => {
    if (!selectedCompanyForUpload) {
      alert('Please select a company requirement / drive.');
      return;
    }
    if (!parsedAppliedRows || parsedAppliedRows.length === 0) {
      alert('Please upload an Excel file containing applied student rows.');
      return;
    }

    try {
      const appList: Omit<StudentApplication, 'id'>[] = parsedAppliedRows.map((row, idx) => {
        const regVal = row['Register Number'] || row['Reg No'] || row['RegisterNo'] || row['Roll No'] || row['RegNo'] || row['Registration Number'] || row['username'] || row['Register_Number'] || '';
        const cleanReg = String(regVal).trim() || `REG_${idx + 1}`;
        
        const nameVal = row['Student Name'] || row['Name'] || row['Full Name'] || row['StudentName'] || row['Candidate Name'] || '';
        const cleanName = String(nameVal).trim() || `Student ${cleanReg}`;
        
        const deptVal = row['Department'] || row['Dept'] || row['Branch'] || row['Course'] || '';
        const cleanDept = String(deptVal).trim() || 'Computer Science & Engineering';

        const cgpaVal = Number(row['CGPA'] || row['cgpa'] || row['GPA'] || 0) || 7.5;

        const existingStd = students.find(s => s.registerNumber?.toLowerCase() === cleanReg.toLowerCase());

        return {
          studentId: existingStd?.id || `std_${cleanReg.replace(/[^a-zA-Z0-9]/g, '_')}`,
          studentName: existingStd?.name || cleanName,
          registerNumber: (existingStd?.registerNumber || cleanReg).toUpperCase(),
          department: existingStd?.department || cleanDept,
          year: existingStd?.year || 4,
          cgpa: existingStd?.cgpa || cgpaVal,
          companyId: selectedCompanyForUpload.id,
          companyName: selectedCompanyForUpload.name,
          jobRole: selectedCompanyForUpload.jobRole,
          salaryPackage: selectedCompanyForUpload.salaryPackage,
          status: 'Applied',
          appliedDate: new Date().toLocaleDateString('en-GB')
        };
      });

      saveBulkStudentApplications(appList);

      onAddNotification(
        'Applied Students Imported',
        `Successfully synced ${appList.length} applied student records for "${selectedCompanyForUpload.name}" drive from Excel.`,
        'success'
      );

      await addActivity({
        user: user.name,
        role: 'Placement Faculty',
        action: 'Imported Applied Students Excel',
        details: `Uploaded ${appList.length} student application records for company "${selectedCompanyForUpload.name}"`
      });

      setShowUploadAppliedExcelModal(false);
      setParsedAppliedRows([]);
      setAppliedFileName('');
      alert(`Successfully imported ${appList.length} applied student records for ${selectedCompanyForUpload.name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to save applied student records.');
    }
  };

  // Fetch initial data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const facultyEmail = user?.email || user?.id || '';
      const stdList = await getStudents(facultyEmail);
      const dsList = await getDatasets(facultyEmail);
      const actList = await getActivityHistory();
      const assessList = await getAssessments();
      setStudents(stdList);
      setDatasets(dsList);
      setActivities(actList);
      setAssessments(assessList);

      if (dsList.length > 0 && !selectedDataset) {
        setSelectedDataset(dsList[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync dataset selection when database updates
  useEffect(() => {
    if (datasets.length > 0) {
      const stillExists = datasets.find(d => d.id === selectedDataset?.id);
      if (!stillExists) {
        setSelectedDataset(datasets[0]);
      } else {
        setSelectedDataset(stillExists);
      }
    } else {
      setSelectedDataset(null);
    }
  }, [datasets]);

  // Form Reset Helper
  const resetStudentForm = () => {
    setStudentForm({
      name: '',
      registerNumber: '',
      department: 'Computer Science',
      year: 4,
      section: 'A',
      email: '',
      phone: '',
      cgpa: 8.0,
      skillsString: '',
      certificationsString: '',
      internshipsString: '',
      projectsString: '',
      username: '',
      password: '',
      linkedinUrl: '',
      placementStatus: 'Eligible',
      resumeScore: 75
    });
    setEditingStudent(null);
  };

  // Student CRUD triggers
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const regNum = studentForm.registerNumber.trim();
      const stdName = studentForm.name.trim();
      const cgpaVal = Number(studentForm.cgpa);

      if (!regNum) {
        alert('Register Number is required.');
        return;
      }
      if (!stdName) {
        alert('Student Name is required.');
        return;
      }
      if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
        alert('CGPA must be a valid number between 0 and 10.');
        return;
      }

      const skills = studentForm.skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const certifications = studentForm.certificationsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const internships = studentForm.internshipsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const projects = studentForm.projectsString.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const payload = {
        name: stdName,
        fullName: stdName,
        registerNumber: regNum,
        department: studentForm.department,
        year: Number(studentForm.year),
        section: studentForm.section,
        email: studentForm.email,
        phone: studentForm.phone,
        cgpa: cgpaVal,
        skills,
        certifications,
        internships,
        projects,
        username: studentForm.username || regNum.toLowerCase(),
        password: studentForm.password || 'Student@123',
        linkedinUrl: studentForm.linkedinUrl,
        placementStatus: studentForm.placementStatus,
        resumeScore: Number(studentForm.resumeScore)
      };

      if (editingStudent) {
        const updated = await updateStudent(editingStudent.id, payload);
        onAddNotification('Student Record Modified', `${updated.name}'s credentials and score indices have been compiled.`, 'info');
        await addActivity({
          user: user.name,
          role: 'Faculty',
          action: 'Updated Student',
          details: `Modified details for student: ${updated.name}`
        });
      } else {
        const added = await addStudent(payload);
        onAddNotification('Student Added Successfully', `New student ${added.name} registered under Username: ${added.username}`, 'success');
        await addActivity({
          user: user.name,
          role: 'Faculty',
          action: 'Added Student',
          details: `Created new student account for ${added.name}`
        });
      }

      setShowAddStudentModal(false);
      resetStudentForm();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error processing student details');
    }
  };

  // Create Class Access Batch Submission
  const handleCreateClassAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse register numbers from textarea or generate them automatically if empty
      let regNums: string[] = [];
      if (classRegisterNumbers.trim()) {
        regNums = classRegisterNumbers.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      } else {
        // Generate register numbers automatically based on username pattern and count
        for (let i = 1; i <= classStrength; i++) {
          const numStr = String(i).padStart(3, '0');
          regNums.push(`${classUsernamePattern}${numStr}`);
        }
      }

      // Generate access for each student using uploaded dataset rows when available
      const newStudents: any[] = [];
      const currentDatasets = datasets.length > 0 ? datasets : await getDatasets();
      
      // Flatten all dataset rows
      const allRows: { row: any; dsIndex: number; rowIndex: number }[] = [];
      currentDatasets.forEach((ds, dsIdx) => {
        const rows = ds.dataPreview || (ds as any).rows || [];
        rows.forEach((r: any, rIdx: number) => {
          allRows.push({ row: r, dsIndex: dsIdx, rowIndex: rIdx });
        });
      });

      for (let i = 0; i < regNums.length; i++) {
        const regNum = regNums[i];
        const username = `${classUsernamePattern.toLowerCase()}${String(i + 1).padStart(2, '0')}`;
        
        // Find matching dataset row by registration number or index
        let matchedRowObj = allRows.find(item => isMatchingDatasetRow(item.row, regNum, i));
        
        // Fallback: match by index if total rows matches or index exists
        if (!matchedRowObj && allRows[i]) {
          matchedRowObj = allRows[i];
        }

        if (matchedRowObj) {
          const normalized = normalizeRowToStudent(matchedRowObj.row, i);
          newStudents.push({
            ...normalized,
            registerNumber: regNum || normalized.registerNumber,
            username: username || normalized.username,
            password: classPassword,
            department: normalized.department || classDept,
            year: parseInt(classYear) || normalized.year || 3,
            section: classSection || normalized.section || 'A'
          });
        } else {
          // If no dataset row found, construct clean record using register number (no random names)
          const defaultName = regNum ? `Student ${regNum}` : `Student ${i + 1}`;
          newStudents.push({
            name: defaultName,
            registerNumber: regNum,
            department: classDept,
            year: parseInt(classYear) || 3,
            section: classSection,
            email: `${username}@college.edu`,
            phone: '',
            cgpa: 7.5,
            skills: ['Python', 'SQL', 'Data Structures'],
            certifications: [],
            internships: [],
            projects: [],
            username: username,
            password: classPassword,
            linkedinUrl: '',
            placementStatus: 'Eligible' as const,
            resumeScore: 70
          });
        }
      }

      await bulkUploadStudents(newStudents);
      
      onAddNotification(
        'Class Access Generated', 
        `Successfully generated login credentials for ${newStudents.length} students of ${classDept} - ${classYear} Year, Section ${classSection}.`, 
        'success'
      );

      await addActivity({
        user: user.name,
        role: 'Faculty',
        action: 'Created Class Access',
        details: `Generated credentials for ${newStudents.length} students in ${classDept} (${classYear} - ${classSection})`
      });

      setShowAddStudentModal(false);
      loadAllData();
      
      // Reset Class Access form parameters
      setClassDept('AI&DS');
      setClassYear('3rd Year');
      setClassSection('A');
      setClassStrength(60);
      setClassUsernamePattern('AIDS3A');
      setClassPassword('aids2026');
      setClassRegisterNumbers('');
    } catch (err: any) {
      alert(err.message || 'Error generating class access');
    }
  };

  const handleEditStudentClick = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      registerNumber: student.registerNumber,
      department: student.department,
      year: student.year,
      section: student.section,
      email: student.email,
      phone: student.phone,
      cgpa: student.cgpa,
      skillsString: student.skills.join(', '),
      certificationsString: student.certifications.join(', '),
      internshipsString: student.internships.join(', '),
      projectsString: student.projects.join(', '),
      username: student.username,
      password: student.password || 'Student@123',
      linkedinUrl: student.linkedinUrl || '',
      placementStatus: student.placementStatus,
      resumeScore: student.resumeScore || 75
    });
    setShowAddStudentModal(true);
  };

  const handleDeleteStudentClick = async (student: Student) => {
    const displayName = student.fullName || student.name;
    const regNum = student.registerNumber;
    if (confirm(`Are you sure you want to delete ${displayName} (${regNum})?`)) {
      setStudents(prev => prev.filter(s => s.id !== student.id && s.registerNumber !== student.registerNumber));
      if (student.id) await deleteStudent(student.id);
      if (regNum) await deleteStudent(regNum);
      onAddNotification('Student Deleted', 'Student deleted successfully.', 'success');
      await addActivity({
        user: user.name,
        role: 'Faculty',
        action: 'Deleted Student',
        details: `Deleted student ${displayName} (${regNum}) from registry`
      });
      await loadAllData();
    }
  };

  // CSV Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processBulkFile = async (fileName: string, textContent: string) => {
    try {
      const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or missing content rows.');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const records: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        records.push(rowObj);
      }

      await bulkUploadStudents(records);
      onAddNotification('Bulk Upload Success', `Imported ${records.length} new student profiles from CSV.`, 'success');
      await addActivity({
        user: user.name,
        role: 'Faculty',
        action: 'Bulk Import',
        details: `Imported ${records.length} profiles using ${fileName}`
      });
      loadAllData();
    } catch (err: any) {
      setBulkError(err.message || 'Failed parsing file as CSV');
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setBulkError('');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isCSV = file.name.endsWith('.csv');
      if (!isCSV) {
        setBulkError('Only .csv formatted files are accepted for bulk parsing.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processBulkFile(file.name, content);
      };
      reader.readAsText(file);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError('');
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processBulkFile(file.name, content);
      };
      reader.readAsText(file);
    }
  };

  // Custom Dataset Upload with Excel (XLSX/XLS), CSV & JSON support
  const handleDatasetUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const fileType: 'csv' | 'json' | 'xlsx' = ext === 'json' ? 'json' : (ext === 'xlsx' || ext === 'xls') ? 'xlsx' : 'csv';

    try {
      let parsedRows: any[] = [];

      if (fileType === 'json') {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        parsedRows = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // Read binary array buffer and parse via SheetJS / XLSX
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName) {
          const worksheet = workbook.Sheets[firstSheetName];
          parsedRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        }
      }

      const newDs = await uploadDataset({
        name: file.name,
        size: file.size,
        type: fileType,
        rows: parsedRows
      });

      // Automatically sync parsed student records into Active Registry
      if (parsedRows.length > 0) {
        await bulkUploadStudents(parsedRows);
        await loadAllData();
      }

      onAddNotification('Dataset Cataloged', `Uploaded: ${newDs.fileName} with ${newDs.recordCount} student records synced to registry.`, 'success');
      const updatedDsList = await getDatasets();
      setDatasets(updatedDsList);
      setSelectedDataset(newDs);
    } catch (err: any) {
      alert(`Error reading file "${file.name}": ${err.message || 'Invalid format'}`);
    }

    e.target.value = '';
  };

  const handleDeleteDataset = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete dataset "${name}"?`)) {
      await deleteDataset(id);
      onAddNotification('Dataset Purged', `${name} has been removed from historical records.`, 'warning');
      const updatedList = await getDatasets();
      setDatasets(updatedList);
      if (selectedDataset?.id === id) {
        setSelectedDataset(updatedList.length > 0 ? updatedList[0] : null);
      }
    }
  };

  // Weekly Assessment handlers
  const handleCreateNewAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await createAssessment({
        title: newAssessmentForm.title,
        maxMarks: Number(newAssessmentForm.maxMarks),
        date: newAssessmentForm.date,
        classSection: newAssessmentForm.classSection,
        subject: newAssessmentForm.subject
      });
      onAddNotification('Weekly Test Created', `Added ${added.title} successfully.`, 'success');
      await addActivity({
        user: user.name,
        role: 'Faculty',
        action: 'Created Test',
        details: `Created weekly test: ${added.title}`
      });
      setShowAddAssessmentModal(false);
      setNewAssessmentForm({
        title: '',
        maxMarks: 100,
        date: new Date().toISOString().split('T')[0],
        classSection: 'CS-A',
        subject: 'Data Structures'
      });
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating assessment');
    }
  };

  const handleDeleteAssessmentClick = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete weekly test: ${title}?`)) {
      await deleteAssessment(id);
      onAddNotification('Weekly Test Removed', `Test ${title} and associated scores deleted.`, 'warning');
      await addActivity({
        user: user.name,
        role: 'Faculty',
        action: 'Deleted Test',
        details: `Deleted weekly test: ${title}`
      });
      loadAllData();
    }
  };

  const handleOpenScoresModal = async (assess: Assessment) => {
    setSelectedAssessment(assess);
    try {
      const scores = await getAssessmentScores(assess.id);
      setAssessmentScores(scores);
      setShowScoresModal(true);
    } catch (err: any) {
      alert('Error fetching scores');
    }
  };

  const handleScoreChange = (studentId: string, value: number) => {
    setAssessmentScores(prev => prev.map(s => {
      if (s.studentId === studentId) {
        return { ...s, marksObtained: Math.min(selectedAssessment?.maxMarks || 100, Math.max(0, value)) };
      }
      return s;
    }));
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent') => {
    setAssessmentScores(prev => prev.map(s => {
      if (s.studentId === studentId) {
        return { ...s, status, marksObtained: status === 'Absent' ? 0 : s.marksObtained };
      }
      return s;
    }));
  };

  const handleSaveScoresSubmit = async () => {
    if (!selectedAssessment) return;
    try {
      await saveAssessmentScores(selectedAssessment.id, assessmentScores);
      onAddNotification('Scores Recorded', `Weekly grades and statistics compiled for ${selectedAssessment.title}.`, 'success');
      setShowScoresModal(false);
      loadAllData();
    } catch (err: any) {
      alert('Error saving scores');
    }
  };

  const parseAssessmentFile = async (file: File): Promise<Array<{ regOrName: string; nameFromRow?: string; marks: number; status: 'Present' | 'Absent' }>> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) return [];

    const results: Array<{ regOrName: string; nameFromRow?: string; marks: number; status: 'Present' | 'Absent' }> = [];

    let startIdx = 0;
    let headerRegIdx = -1;
    let headerNameIdx = -1;
    let headerMarksIdx = -1;
    let headerStatusIdx = -1;

    if (rawRows.length > 0) {
      const firstRowStr = rawRows[0].map((cell: any) => String(cell || '').toLowerCase().trim());
      
      firstRowStr.forEach((h: string, idx: number) => {
        const cleanH = h.replace(/[^a-z0-9]/g, '');
        if (cleanH.includes('register') || cleanH.includes('regno') || cleanH.includes('rollno') || cleanH.includes('urn') || cleanH === 'id' || cleanH.includes('username')) {
          headerRegIdx = idx;
        } else if (cleanH.includes('name') || cleanH.includes('student')) {
          headerNameIdx = idx;
        } else if (cleanH.includes('mark') || cleanH.includes('score') || cleanH.includes('point') || cleanH.includes('total') || cleanH.includes('obtained') || cleanH.includes('grade') || cleanH.includes('aptitude')) {
          headerMarksIdx = idx;
        } else if (cleanH.includes('status') || cleanH.includes('attend') || cleanH.includes('present')) {
          headerStatusIdx = idx;
        }
      });

      if (headerRegIdx !== -1 || headerNameIdx !== -1 || headerMarksIdx !== -1) {
        startIdx = 1;
      }
    }

    for (let i = startIdx; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      let regOrName = '';
      let nameFromRow = '';
      let marksNum = NaN;
      let statusVal: 'Present' | 'Absent' = 'Present';

      if (headerRegIdx !== -1 || headerNameIdx !== -1 || headerMarksIdx !== -1) {
        if (headerRegIdx !== -1 && row[headerRegIdx] !== undefined) {
          regOrName = String(row[headerRegIdx]).trim();
        }
        if (headerNameIdx !== -1 && row[headerNameIdx] !== undefined) {
          nameFromRow = String(row[headerNameIdx]).trim();
          if (!regOrName) regOrName = nameFromRow;
        }
        if (headerMarksIdx !== -1 && row[headerMarksIdx] !== undefined) {
          const val = Number(String(row[headerMarksIdx]).trim());
          if (!isNaN(val)) marksNum = val;
        }
        if (headerStatusIdx !== -1 && row[headerStatusIdx] !== undefined) {
          const st = String(row[headerStatusIdx]).trim().toLowerCase();
          if (st === 'absent' || st === 'a' || st === '0' || st === 'false') statusVal = 'Absent';
        }
      }

      if (isNaN(marksNum) || !regOrName) {
        const parts = row.map((cell: any) => String(cell || '').trim()).filter((s: string) => s !== '');
        if (parts.length === 0) continue;

        const firstStr = parts[0].toLowerCase();
        if (firstStr.includes('register') || firstStr.includes('student') || firstStr.includes('reg no') || firstStr.includes('name')) {
          continue;
        }

        regOrName = parts[0];

        for (let j = 1; j < parts.length; j++) {
          const val = parts[j];
          if (!isNaN(Number(val))) {
            marksNum = Number(val);
            if (j > 1 && !nameFromRow) nameFromRow = parts[1];
            if (parts[j + 1]) {
              const st = parts[j + 1].toLowerCase();
              if (st === 'absent' || st === 'a' || st === '0' || st === 'false') statusVal = 'Absent';
            }
            break;
          }
        }
      }

      if (!regOrName || regOrName.includes('PK') || /^[\uFFFD\u0000-\u001F\u007F-\u009F]+$/.test(regOrName) || regOrName.length > 100) {
        continue;
      }

      if (!isNaN(marksNum)) {
        results.push({
          regOrName,
          nameFromRow,
          marks: marksNum,
          status: statusVal
        });
      }
    }

    return results;
  };

  const handleCsvMarksUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseAssessmentFile(file);

      if (parsedData.length === 0) {
        alert('Could not find valid student score rows in the uploaded file.');
        e.target.value = '';
        return;
      }

      let updatedCount = 0;
      const newScores = [...assessmentScores];

      parsedData.forEach((item) => {
        const targetIndex = newScores.findIndex(
          s => s.registerNumber?.toLowerCase() === item.regOrName.toLowerCase() ||
               s.studentName?.toLowerCase() === item.regOrName.toLowerCase() ||
               s.studentId === item.regOrName ||
               (item.nameFromRow && (s.studentName?.toLowerCase() === item.nameFromRow.toLowerCase() || s.registerNumber?.toLowerCase() === item.nameFromRow.toLowerCase()))
        );

        if (targetIndex !== -1) {
          const max = selectedAssessment?.maxMarks || 100;
          newScores[targetIndex] = {
            ...newScores[targetIndex],
            marksObtained: Math.min(max, Math.max(0, item.marks)),
            status: item.status
          };
          updatedCount++;
        }
      });

      setAssessmentScores(newScores);
      onAddNotification('Marks Uploaded', `Successfully imported assessment marks for ${updatedCount} students from file.`, 'success');
      alert(`Successfully imported assessment marks for ${updatedCount} students from CSV/Excel file.`);
    } catch (err: any) {
      alert('Error parsing marks file: ' + (err.message || 'Invalid format'));
    }
    e.target.value = '';
  };

  const handleDownloadCsvTemplate = () => {
    if (!selectedAssessment) return;
    const headers = ['Register Number', 'Student Name', `Marks Obtained (Max ${selectedAssessment.maxMarks})`, 'Attendance Status (Present/Absent)'];
    const rows = assessmentScores.map(s => [
      s.registerNumber,
      `"${s.studentName}"`,
      s.marksObtained,
      s.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedAssessment.title.replace(/\s+/g, '_')}_Marks_Sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssessmentCsvFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    setImportAssessmentForm(prev => ({ ...prev, title: prev.title || cleanTitle }));

    try {
      const parsedData = await parseAssessmentFile(file);

      if (parsedData.length === 0) {
        alert('Could not find valid student score rows in the uploaded file. Please verify file content format.');
        e.target.value = '';
        return;
      }

      const studentMap = new Map<string, Student>();
      students.forEach(s => {
        if (s.registerNumber) studentMap.set(s.registerNumber.toLowerCase().trim(), s);
        if (s.name) studentMap.set(s.name.toLowerCase().trim(), s);
        if (s.id) studentMap.set(s.id.toLowerCase().trim(), s);
      });

      const parsedScores: StudentScore[] = [];

      parsedData.forEach((item) => {
        const matchedStd = studentMap.get(item.regOrName.toLowerCase().trim()) || (item.nameFromRow ? studentMap.get(item.nameFromRow.toLowerCase().trim()) : undefined);

        const regNum = matchedStd?.registerNumber || (item.regOrName.length > 2 ? item.regOrName : item.nameFromRow || item.regOrName);
        const studentName = matchedStd?.name || item.nameFromRow || item.regOrName;
        const studentId = matchedStd?.id || `std_${regNum.replace(/[^a-zA-Z0-9]/g, '_')}`;

        parsedScores.push({
          studentId,
          studentName,
          registerNumber: regNum,
          marksObtained: Math.min(importAssessmentForm.maxMarks || 100, Math.max(0, item.marks)),
          status: item.status
        });
      });

      // Include remaining active students from system with 0 marks if not present in the imported file
      students.forEach(s => {
        const alreadyIncluded = parsedScores.some(
          p => p.studentId === s.id || 
               p.registerNumber?.toLowerCase() === s.registerNumber?.toLowerCase() ||
               p.studentName?.toLowerCase() === s.name?.toLowerCase()
        );

        if (!alreadyIncluded) {
          parsedScores.push({
            studentId: s.id,
            studentName: s.name,
            registerNumber: s.registerNumber,
            marksObtained: 0,
            status: 'Absent'
          });
        }
      });

      setImportedScores(parsedScores);
      onAddNotification('File Parsed', `Mapped ${parsedScores.length} student scores from ${file.name}.`, 'info');
    } catch (err: any) {
      alert('Error parsing score file: ' + (err.message || 'Invalid file format'));
    }
    e.target.value = '';
  };

  const handleSaveImportedAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importAssessmentForm.title.trim()) {
      alert('Please enter a test title');
      return;
    }
    if (importedScores.length === 0) {
      alert('Please upload a valid CSV/Excel file containing student marks before saving.');
      return;
    }

    try {
      const added = await createAssessment({
        title: importAssessmentForm.title,
        maxMarks: Number(importAssessmentForm.maxMarks),
        date: importAssessmentForm.date,
        classSection: importAssessmentForm.classSection,
        subject: importAssessmentForm.subject
      });

      if (added) {
        await saveAssessmentScores(added.id, importedScores);
        await addActivity({
          user: user.name,
          role: 'Faculty',
          action: 'Imported Assessment CSV',
          details: `Imported CSV marks for ${added.title} (${importedScores.length} students)`
        });
      }

      onAddNotification('Assessment Marks Saved', `Created test "${importAssessmentForm.title}" and saved grades for ${importedScores.length} students.`, 'success');
      setShowImportAssessmentModal(false);
      setImportedScores([]);
      setImportedFileName('');
      setImportAssessmentForm({
        title: '',
        maxMarks: 100,
        date: new Date().toISOString().split('T')[0],
        classSection: 'CS-A',
        subject: 'Data Structures'
      });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error saving imported assessment marks');
    }
  };

  // Dataset manual record insert
  const handleAddDatasetRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDataset) return;
    try {
      await addDatasetRecord(selectedDataset.id, datasetRecordForm);
      onAddNotification('Record Added', 'Appended custom row parameters to active dataset catalog.', 'success');
      setShowAddRecordModal(false);
      setDatasetRecordForm({});
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter & Search Students List
  const filteredStudents = students.filter(student => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !searchLower || 
      (student.registerNumber || '').toLowerCase().includes(searchLower) ||
      (student.fullName || student.name || '').toLowerCase().includes(searchLower) ||
      (student.email || '').toLowerCase().includes(searchLower) ||
      (student.department || '').toLowerCase().includes(searchLower) ||
      (student.skills || []).some(s => s.toLowerCase().includes(searchLower));

    const matchesDept = !deptFilter || student.department === deptFilter;
    const matchesYear = !yearFilter || String(student.year).toLowerCase() === yearFilter.toLowerCase();
    const matchesSec = !sectionFilter || (student.section || '').toLowerCase() === sectionFilter.toLowerCase();
    const matchesStatus = !statusFilter || student.placementStatus === statusFilter;
    
    const cgpaVal = Number(student.cgpa) || 0;
    const matchesMinCgpa = !minCgpa || cgpaVal >= parseFloat(minCgpa);
    const matchesMaxCgpa = !maxCgpa || cgpaVal <= parseFloat(maxCgpa);

    const scoreVal = Number(student.readinessScore || student.score) || 0;
    const matchesMinReadiness = !minReadiness || scoreVal >= parseInt(minReadiness);
    const matchesMaxReadiness = !maxReadiness || scoreVal <= parseInt(maxReadiness);

    return matchesSearch && matchesDept && matchesYear && matchesSec && matchesStatus && matchesMinCgpa && matchesMaxCgpa && matchesMinReadiness && matchesMaxReadiness;
  }).sort((a, b) => (a.registerNumber || '').localeCompare(b.registerNumber || '', undefined, { numeric: true, sensitivity: 'base' }));

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id || s.registerNumber));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id || s.registerNumber));
    }
  };

  const handleRowSelectToggle = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteStudentsAPI(selectedStudentIds);
      onAddNotification('Bulk Delete Completed', `Deleted ${selectedStudentIds.length} student records from database.`, 'warning');
      setSelectedStudentIds([]);
      setShowBulkDeleteConfirmModal(false);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error executing bulk delete.');
    }
  };

  const handleRecalculateSelectedScores = async () => {
    try {
      for (const id of selectedStudentIds) {
        const std = students.find(s => s.id === id || s.registerNumber === id);
        if (std) {
          await updateStudent(std.id, { readinessScore: calculateReadinessScore(std) });
        }
      }
      onAddNotification('Scores Recalculated', `Recalculated readiness indices for ${selectedStudentIds.length} students.`, 'success');
      await loadAllData();
    } catch (err: any) {
      alert('Error recalculating scores');
    }
  };

  const handleExportSelectedStudents = () => {
    const selectedList = students.filter(s => selectedStudentIds.includes(s.id) || selectedStudentIds.includes(s.registerNumber));
    if (selectedList.length === 0) return;
    const exportRows = selectedList.map(s => ({
      'Register Number': s.registerNumber,
      'Student Name': s.fullName || s.name,
      'Department': s.department,
      'Year': s.year,
      'Section': s.section,
      'CGPA': s.cgpa && Number(s.cgpa) > 0 ? Number(s.cgpa).toFixed(2) : 'Not Available',
      'Email': s.email || 'Not Available',
      'Phone': s.phone || 'Not Available',
      'Attendance (%)': s.attendance || 85,
      'Skills': Array.isArray(s.skills) ? s.skills.join(', ') : '',
      'Projects': typeof s.projects === 'number' ? s.projects : (Array.isArray(s.projects) ? s.projects.length : 0),
      'Certifications': typeof s.certifications === 'number' ? s.certifications : (Array.isArray(s.certifications) ? s.certifications.length : 0),
      'Internships': typeof s.internships === 'number' ? s.internships : (Array.isArray(s.internships) ? s.internships.length : 0),
      'Readiness Score (%)': s.readinessScore || s.score || 0,
      'Placement Status': s.placementStatus
    }));
    exportToExcel(`Selected_Students_${Date.now()}`, exportRows);
  };

  const handleExportAllStudents = () => {
    if (students.length === 0) return;
    const exportRows = students.map(s => ({
      'Register Number': s.registerNumber,
      'Student Name': s.fullName || s.name,
      'Department': s.department,
      'Year': s.year,
      'Section': s.section,
      'CGPA': s.cgpa && Number(s.cgpa) > 0 ? Number(s.cgpa).toFixed(2) : 'Not Available',
      'Email': s.email || 'Not Available',
      'Phone': s.phone || 'Not Available',
      'Attendance (%)': s.attendance || 85,
      'Skills': Array.isArray(s.skills) ? s.skills.join(', ') : '',
      'Projects': typeof s.projects === 'number' ? s.projects : (Array.isArray(s.projects) ? s.projects.length : 0),
      'Certifications': typeof s.certifications === 'number' ? s.certifications : (Array.isArray(s.certifications) ? s.certifications.length : 0),
      'Internships': typeof s.internships === 'number' ? s.internships : (Array.isArray(s.internships) ? s.internships.length : 0),
      'Readiness Score (%)': s.readinessScore || s.score || 0,
      'Placement Status': s.placementStatus
    }));
    exportToExcel(`All_Students_Registry_${Date.now()}`, exportRows);
  };

  const handleOpenImportHistory = async () => {
    try {
      const logs = await getImportHistoryAPI();
      setImportHistoryList(logs);
      setShowImportHistoryModal(true);
    } catch (err: any) {
      alert('Error fetching import history');
    }
  };

  // Calculate chart statistics dynamically based on student registry state
  const getDepartmentAverages = () => {
    const depts = Array.from(new Set(students.map(s => s.department))) as string[];
    return depts.map(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const avgScore = deptStudents.reduce((acc, s) => acc + s.readinessScore, 0) / deptStudents.length;
      const avgCgpa = deptStudents.reduce((acc, s) => acc + s.cgpa, 0) / deptStudents.length;
      return {
        name: dept.split(' ').map(w => w[0]).join(''), // Abbreviate
        fullName: dept,
        'Avg Readiness Score': Math.round(avgScore),
        'Avg CGPA (x10)': Math.round(avgCgpa * 10)
      };
    });
  };

  const getPlacementStatusCounts = () => {
    const counts = { Placed: 0, Eligible: 0, 'Not Eligible': 0, 'In Progress': 0 };
    students.forEach(s => {
      counts[s.placementStatus] = (counts[s.placementStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getSkillDemands = () => {
    const skillCounts: Record<string, number> = {};
    students.forEach(s => {
      s.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    return Object.entries(skillCounts)
      .map(([name, count]) => ({ name, Students: count }))
      .sort((a, b) => b.Students - a.Students)
      .slice(0, 8);
  };

  const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="relative min-h-screen space-y-6 pb-12 font-sans">
      <WatermarkBackground opacity={0.05} />

      {/* Faculty Navigation Header */}
      <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <nav className="flex items-center space-x-1" aria-label="Faculty Navigation Header">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm flex items-center space-x-2 cursor-pointer transition-all"
          >
            <Users size={15} />
            <span>Placement Faculty</span>
          </button>
        </nav>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>{user.department || 'AI&DS'} Department Active</span>
        </div>
      </div>

      {/* Faculty Department Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md shadow-blue-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Active University Portal
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold mt-2 tracking-tight">
            Placement Faculty
          </h1>
          <p className="text-xs text-blue-100/80 mt-1">
            Welcome back, <strong className="font-semibold text-white">{user.name}</strong>. Manage student batch access, analyze curriculum readiness scores, and track weekly exam grades.
          </p>
        </div>
      </div>
      
      {/* Tab Content Router */}

      {/* 1. STUDENT MANAGEMENT TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Actions row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Users size={20} className="text-indigo-500 mr-2" />
                Student Registry Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage student records, batch matrices, bulk updates, and Excel database imports.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <UploadCloud size={15} />
                <span>Upload Student Data (CSV/Excel)</span>
              </button>
              <button
                onClick={handleOpenImportHistory}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-200 cursor-pointer"
              >
                <FolderSync size={14} />
                <span>Import History</span>
              </button>
              <button
                onClick={handleExportAllStudents}
                className="px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-900 cursor-pointer"
              >
                <Download size={14} />
                <span>Export All</span>
              </button>
            </div>
          </div>

          {/* Extended Multi-Filter Controls */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800 pb-2">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter size={14} className="text-blue-500" />
                <span>Registry Filters & Search Criteria</span>
              </span>
              {(deptFilter || yearFilter || sectionFilter || statusFilter || minCgpa || maxCgpa || minReadiness || maxReadiness) && (
                <button
                  onClick={() => {
                    setDeptFilter('');
                    setYearFilter('');
                    setSectionFilter('');
                    setStatusFilter('');
                    setMinCgpa('');
                    setMaxCgpa('');
                    setMinReadiness('');
                    setMaxReadiness('');
                  }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="">All Depts</option>
                <option value="AI&DS">AI&DS</option>
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Information Technology">IT</option>
                <option value="Electronics & Communication Engineering">ECE</option>
                <option value="Mechanical Engineering">MECH</option>
              </select>

              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="">All Years</option>
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
                <option value="IV">IV Year</option>
                <option value="4">4th Year</option>
              </select>

              <select
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="">All Secs</option>
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
                <option value="C">Sec C</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="Eligible">Eligible</option>
                <option value="Placed">Placed</option>
                <option value="Not Eligible">Not Eligible</option>
                <option value="In Progress">In Progress</option>
              </select>

              <input
                type="number"
                step="0.1"
                placeholder="Min CGPA"
                value={minCgpa}
                onChange={e => setMinCgpa(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              />

              <input
                type="number"
                step="0.1"
                placeholder="Max CGPA"
                value={maxCgpa}
                onChange={e => setMaxCgpa(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              />

              <input
                type="number"
                placeholder="Min Score %"
                value={minReadiness}
                onChange={e => setMinReadiness(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              />

              <input
                type="number"
                placeholder="Max Score %"
                value={maxReadiness}
                onChange={e => setMaxReadiness(e.target.value)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          {selectedStudentIds.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-scale-up">
              <div className="flex items-center space-x-3">
                <span className="p-2 bg-white/20 rounded-xl font-mono font-black text-xs">
                  {selectedStudentIds.length}
                </span>
                <span className="font-extrabold text-xs">
                  Students Selected for Bulk Actions
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Edit2 size={13} />
                  <span>Bulk Edit</span>
                </button>
                <button
                  onClick={handleRecalculateSelectedScores}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw size={13} />
                  <span>Recalculate Score</span>
                </button>
                <button
                  onClick={handleExportSelectedStudents}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Download size={13} />
                  <span>Export Selected</span>
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirmModal(true)}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 size={13} />
                  <span>Bulk Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Students Data Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
              <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                  ACTIVE REGISTRY ({filteredStudents.length} STUDENTS)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredStudents.length} of {students.length} matching filter criteria
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800">
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAllToggle}
                          className="accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Register No</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Student Name</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">CGPA</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Department</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Year / Sec</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase text-center">Score</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                          No students found matching your search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      (filteredStudents || []).map((std, idx) => {
                        const stdKey = std.id || std.registerNumber;
                        const isChecked = selectedStudentIds.includes(stdKey);
                        const displayName = (std.fullName || std.name || '').trim();
                        const displayCgpa = std.cgpa && Number(std.cgpa) > 0 ? Number(std.cgpa).toFixed(2) : 'Not Available';
                        return (
                          <tr 
                            key={stdKey || `std_${idx}`}
                            className={`hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-all cursor-pointer ${isChecked ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                            onClick={() => setViewingStudent(std)}
                          >
                            <td className="p-4" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleRowSelectToggle(stdKey)}
                                className="accent-blue-600 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold">{std.registerNumber}</td>
                            <td className="p-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{displayName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{std.email || 'Not Available'}</p>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">{displayCgpa}</td>
                            <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{std.department || 'Not Available'}</td>
                            <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{std.year || 'IV'} - Sec {std.section || 'A'}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                (std.readinessScore || std.score || 0) >= 80 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                                  : (std.readinessScore || std.score || 0) >= 60 
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              }`}>
                                {std.readinessScore || std.score || 0}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                std.placementStatus === 'Placed' 
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30' 
                                  : std.placementStatus === 'Eligible'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30'
                                    : std.placementStatus === 'In Progress'
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100/30'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {std.placementStatus}
                              </span>
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEditStudentClick(std)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Edit Profile"
                                >
                                  <Edit2 size={14} />
                                  <span className="text-[11px] font-bold text-indigo-600">Edit</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setStudentToDelete(std);
                                    setShowDeleteConfirmModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Remove Profile"
                                >
                                  <Trash2 size={14} />
                                  <span className="text-[11px] font-bold text-rose-600">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      )}

      {/* 2. DATASET MANAGEMENT TAB */}
      {activeTab === 'datasets' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Action card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Database size={20} className="text-indigo-500 mr-2" />
                Historical Placement Datasets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload placement reports (CSV, JSON, XLSX), view data quality audits, or perform inline record corrections.
              </p>
            </div>
            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-lg shadow-indigo-600/10">
              <UploadCloud size={14} />
              <span>Upload New Dataset</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleDatasetUploadInput}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Datasets List */}
            <div className="space-y-4 lg:col-span-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Cataloged Datasets
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  {datasets.length} Total
                </span>
              </div>

              {datasets.length === 0 ? (
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center rounded-3xl text-slate-400 text-xs">
                  No datasets currently loaded. Use top action to upload records.
                </div>
              ) : (
                datasets.map(ds => {
                  const isSelected = selectedDataset?.id === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => setSelectedDataset(ds)}
                      className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-950 shadow-xl' 
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2.5">
                          <span className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-500'}`}>
                            <FileSpreadsheet size={16} />
                          </span>
                          <div className="min-w-0">
                            <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                              {ds.fileName}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ds.uploadDate}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDataset(ds.id, ds.fileName);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected 
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' 
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
                          }`}
                          title="Delete Dataset"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Info Chips */}
                      <div className="grid grid-cols-3 gap-1.5 mt-4">
                        <div className={`p-2 rounded-xl text-center ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'}`}>
                          <span className="block text-[14px] font-extrabold">{ds.recordCount}</span>
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Records</span>
                        </div>
                        <div className={`p-2 rounded-xl text-center ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'}`}>
                          <span className="block text-[14px] font-extrabold text-amber-500">{ds.missingValues}</span>
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Missing</span>
                        </div>
                        <div className={`p-2 rounded-xl text-center ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'}`}>
                          <span className="block text-[14px] font-extrabold text-emerald-500">{ds.dataQualityScore}%</span>
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Quality</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Dataset Quality Report and Preview Table */}
            <div className="lg:col-span-2 space-y-6">
              
              {selectedDataset ? (
                <>
                  {/* Quality Audit Dashboard Header */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
                        <CheckCircle2 size={12} className="mr-1.5 text-indigo-500" />
                        Automated Data Quality Audit
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedDataset.dataQualityScore >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        Score: {selectedDataset.dataQualityScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Analysis Card 1 */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Students Analyzed</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedDataset.recordCount} Profiles</p>
                        <p className="text-[9px] text-slate-400 mt-1">Cross-referenced with active databases.</p>
                      </div>

                      {/* Analysis Card 2 */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Missing Values</span>
                        <p className={`text-xl font-bold mt-1 ${selectedDataset.missingValues > 5 ? 'text-amber-500' : 'text-slate-850 dark:text-slate-100'}`}>
                          {selectedDataset.missingValues} Cells
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">Unfilled profile gaps or broken links.</p>
                      </div>

                      {/* Analysis Card 3 */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quality Summary</span>
                        <p className="text-xl font-bold text-emerald-500 mt-1">Excellent</p>
                        <p className="text-[9px] text-slate-400 mt-1">High compatibility with diagnostic templates.</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Preview table with manual additions */}
                  {(() => {
                    const datasetHeaders: string[] = Array.from(
                      new Set(
                        (selectedDataset.dataPreview || []).flatMap((row: Record<string, any>) => Object.keys(row || {}))
                      )
                    );
                    if (datasetHeaders.length === 0) {
                      datasetHeaders.push('name', 'cgpa', 'department');
                    }

                    return (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col">
                        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              Dataset Row Preview
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900">
                              {selectedDataset.dataPreview?.length || 0} Preview Rows
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newFormObj: Record<string, string> = {};
                              datasetHeaders.forEach(k => { newFormObj[k] = ''; });
                              setDatasetRecordForm(newFormObj);
                              setShowAddRecordModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <Plus size={12} />
                            <span>Add Row Manually</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center w-10">
                                  #
                                </th>
                                {(datasetHeaders || []).map((header, hIdx) => (
                                  <th key={`th_${header}_${hIdx}`} className="p-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap capitalize">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                              {selectedDataset.dataPreview && selectedDataset.dataPreview.length > 0 ? (
                                selectedDataset.dataPreview.map((row, rIdx) => (
                                  <tr key={`row_${rIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 text-center">
                                      {rIdx + 1}
                                    </td>
                                    {(datasetHeaders || []).map((header, hIdx) => {
                                      const cellVal = row?.[header];
                                      let displayVal = '-';
                                      if (cellVal !== null && cellVal !== undefined && cellVal !== '') {
                                        if (typeof cellVal === 'object') {
                                          displayVal = Array.isArray(cellVal) ? cellVal.join(', ') : JSON.stringify(cellVal);
                                        } else {
                                          displayVal = String(cellVal);
                                        }
                                      }
                                      return (
                                        <td key={`td_${header}_${hIdx}`} className="p-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                          {displayVal}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={datasetHeaders.length + 1} className="p-8 text-center text-slate-400 text-xs">
                                    No rows available in this dataset. Click "Add Row Manually" to append records.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="p-12 bg-white dark:bg-slate-900 text-center rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-400 text-sm">
                  Select a historical database catalog to view data quality reports and previews.
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* WEEKLY ASSESSMENTS TAB */}
      {activeTab === 'assessments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center">
                <BookOpen size={16} className="text-blue-600 mr-2" />
                Weekly Assessment Management
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload student assessment marks using CSV/Excel file import, record grades, and sync scores directly to student career readiness profiles.
              </p>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                onClick={() => setShowImportAssessmentModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileSpreadsheet size={15} />
                <span>Upload Assessment Marks (CSV / Excel)</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Test Registries</span>
              <span className="text-[10px] font-mono text-slate-400">{assessments.length} Tests Recorded</span>
            </div>

            {assessments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 dark:bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800 tracking-wider">
                      <th className="p-4">Test Title</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Class Section</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Max Marks</th>
                      <th className="p-4">Average Score</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {assessments.map((assess) => (
                      <tr key={assess.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20">
                        <td className="p-4">
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {assess.title}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {assess.subject || 'General'}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-mono uppercase">
                            {assess.classSection || 'All'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500 font-mono">
                          {assess.date}
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {assess.maxMarks}
                        </td>
                        <td className="p-4">
                          {assess.averageScore ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {assess.averageScore}
                              </span>
                              <span className="text-[10px] text-slate-400">/ {assess.maxMarks}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">Ungraded</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenScoresModal(assess)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckSquare size={12} />
                              Grade Marks
                            </button>
                            <button
                              onClick={() => handleDeleteAssessmentClick(assess.id, assess.title)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete Test"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm space-y-3">
                <p>No assessments registered. Click "Upload Assessment Marks" to import student grades.</p>
                <button
                  onClick={() => setShowImportAssessmentModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  <span>Upload Assessment Marks (CSV / Excel)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PLACEMENT ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Registry Average</span>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                  {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.readinessScore, 0) / students.length) : 0}%
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center">
                  <TrendingUp size={10} className="mr-1" />
                  +4.2% from target criteria
                </p>
              </div>
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-500">
                <TrendingUp size={24} />
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Placement Status</span>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {students.filter(s => s.placementStatus === 'Placed').length} Placed
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Out of {students.length} eligible students
                </p>
              </div>
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-500">
                <CheckCircle2 size={24} />
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Critical Skill Deficiencies</span>
                <p className="text-2xl font-extrabold text-rose-500 mt-1">AWS & Docker</p>
                <p className="text-[10px] text-slate-400 mt-1">Identified in {students.filter(s => s.readinessScore < 80).length} student portfolios</p>
              </div>
              <span className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-rose-500">
                <AlertCircle size={24} />
              </span>
            </div>
          </div>

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Department Performance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Department Performance Analysis
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDepartmentAverages()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Avg Readiness Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg CGPA (x10)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Skill Demand Market */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Skills Demand Metrics (Students Counts)
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getSkillDemands()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip />
                    <Bar dataKey="Students" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Placement Status Distribution Pie */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Placement Readiness Distribution
              </h4>
              <div className="h-72 flex flex-col sm:flex-row items-center justify-around">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPlacementStatusCounts()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getPlacementStatusCounts().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 w-full sm:w-1/2 px-4">
                  {getPlacementStatusCounts().map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></span>
                        <span className="text-slate-600 dark:text-slate-400">{entry.name}</span>
                      </div>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{entry.value} students</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: Timeline analysis */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                System Readiness Growth Rate
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Mar', AvgScore: 72 },
                    { name: 'Apr', AvgScore: 74 },
                    { name: 'May', AvgScore: 78 },
                    { name: 'Jun', AvgScore: 82 },
                    { name: 'Jul', AvgScore: 86 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="AvgScore" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. ACTIVITY LOGS TAB */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 animate-fade-in">
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
              <FolderSync size={12} className="mr-1.5" />
              Activity History Stream
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Audit log listing manual inserts, student revisions, and data uploads performed in this session.
            </p>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, actIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {actIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                          {activity.action[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {activity.action} <span className="text-slate-500 font-normal">by {activity.user}</span>
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {activity.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in my-8">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <GraduationCap size={18} className="text-blue-600 mr-2" />
                {editingStudent ? 'Edit Student Profile' : 'Create Class Student Access'}
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {editingStudent ? (
              <form onSubmit={handleStudentFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Primary Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">University Register Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.registerNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                    placeholder="e.g. CS2023001"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Course details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Department Branch</label>
                  <select
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Year of Study</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: Number(e.target.value) })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Section</label>
                  <input
                    type="text"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Grading and Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">CGPA Grade (out of 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={studentForm.cgpa}
                    onChange={(e) => setStudentForm({ ...studentForm, cgpa: Number(e.target.value) })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    placeholder="+1 555-0100"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Skills and Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Core Tech Skills (Comma Separated)</label>
                  <textarea
                    value={studentForm.skillsString}
                    onChange={(e) => setStudentForm({ ...studentForm, skillsString: e.target.value })}
                    placeholder="React, Node.js, Python, SQL"
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Certifications (Comma Separated)</label>
                  <textarea
                    value={studentForm.certificationsString}
                    onChange={(e) => setStudentForm({ ...studentForm, certificationsString: e.target.value })}
                    placeholder="AWS Practitioner, Google Data Analytics"
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Internships & Projects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Internships (Comma Separated)</label>
                  <textarea
                    value={studentForm.internshipsString}
                    onChange={(e) => setStudentForm({ ...studentForm, internshipsString: e.target.value })}
                    placeholder="Frontend Intern at TechCorp (3 months)"
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Projects Portfolio (Comma Separated)</label>
                  <textarea
                    value={studentForm.projectsString}
                    onChange={(e) => setStudentForm({ ...studentForm, projectsString: e.target.value })}
                    placeholder="E-Commerce Platform, Chat Widget"
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Student authentication details set by Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Set Student Username</label>
                  <input
                    type="text"
                    value={studentForm.username}
                    onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                    placeholder="e.g. alex.rivera"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Set Password (Default)</label>
                  <input
                    type="text"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Student@123"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Placement Status</label>
                  <select
                    value={studentForm.placementStatus}
                    onChange={(e) => setStudentForm({ ...studentForm, placementStatus: e.target.value as any })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="Eligible">Eligible</option>
                    <option value="Placed">Placed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Not Eligible">Not Eligible</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateClassAccessSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-blue-100/30 text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                Generate student dashboard credentials instantly by batch. The system automatically provisions individual accounts for the entire class under your specified Department and Year.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={classDept}
                    onChange={(e) => setClassDept(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="AI&DS">AI&DS</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Year of Study</label>
                  <select
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Class Strength</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={classStrength}
                    onChange={(e) => setClassStrength(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username Pattern / Prefix</label>
                  <input
                    type="text"
                    required
                    value={classUsernamePattern}
                    onChange={(e) => setClassUsernamePattern(e.target.value)}
                    placeholder="e.g. AIDS3A"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Common Password</label>
                  <input
                    type="text"
                    required
                    value={classPassword}
                    onChange={(e) => setClassPassword(e.target.value)}
                    placeholder="e.g. aids2026"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Specific Register Numbers (Optional)
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">One per line. If empty, generated from prefix pattern.</span>
                </div>
                <textarea
                  value={classRegisterNumbers}
                  onChange={(e) => setClassRegisterNumbers(e.target.value)}
                  placeholder="AIDS001&#10;AIDS002&#10;AIDS003"
                  rows={4}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/15 cursor-pointer"
                >
                  Generate Credentials
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT PROFILE OVERLAY/VIEW DRAWER */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Student Placement Readiness Profile
              </span>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-55 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={viewingStudent.avatarUrl}
                    alt={viewingStudent.name}
                    className="w-14 h-14 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{viewingStudent.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingStudent.registerNumber}</p>
                    <p className="text-xs text-slate-500 mt-1">{viewingStudent.department} · Sec {viewingStudent.section}</p>
                    <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono font-extrabold text-[11px] rounded-md border border-blue-200/50">
                      CGPA: {viewingStudent.cgpa} / 10
                    </div>
                  </div>
                </div>
                <div>
                  <CircularScoreMeter score={viewingStudent.readinessScore} size={80} strokeWidth={6} showLabel={false} />
                </div>
              </div>

              {/* Dynamic Assessment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-100/30 rounded-2xl">
                  <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Strengths</h5>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-350 list-disc pl-4">
                    {(viewingStudent.strengths || []).map((str, idx) => <li key={`str_${idx}`}>{str}</li>)}
                  </ul>
                </div>
                {/* Weaknesses */}
                <div className="p-4 bg-rose-50/10 dark:bg-rose-950/10 border border-rose-100/30 rounded-2xl">
                  <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Areas of Focus</h5>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-350 list-disc pl-4">
                    {(viewingStudent.weaknesses || []).map((w, idx) => <li key={`w_${idx}`}>{w}</li>)}
                  </ul>
                </div>
              </div>

              {/* Skills Gaps */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Skills Gap Matrix</span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingStudent.skillGap || []).map((gap, idx) => (
                    <span key={`gap_${idx}`} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-semibold rounded-lg border border-amber-100/30">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Recommended Actions</span>
                <div className="space-y-1.5">
                  {(viewingStudent.recommendations || []).map((rec, idx) => (
                    <p key={`rec_${idx}`} className="text-xs text-slate-600 dark:text-slate-400 flex items-start">
                      <span className="text-indigo-500 mr-2 font-bold">•</span>
                      {rec}
                    </p>
                  ))}
                </div>
              </div>

              {/* Contact Profiles */}
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <p className="text-slate-500 flex items-center">
                  <Mail size={12} className="mr-2 text-slate-400" />
                  {viewingStudent.email}
                </p>
                <p className="text-slate-500 flex items-center">
                  <Phone size={12} className="mr-2 text-slate-400" />
                  {viewingStudent.phone}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD RECORD TO DATASET ROW MODAL */}
      {showAddRecordModal && selectedDataset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add Record to Dataset</h3>
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDatasetRecord} className="p-6 space-y-4">
              {Object.keys(datasetRecordForm).map((key) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 capitalize">{key}</label>
                  <input
                    type="text"
                    required
                    value={datasetRecordForm[key]}
                    onChange={(e) => setDatasetRecordForm({ ...datasetRecordForm, [key]: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Append Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODAL 4B: IMPORT ASSESSMENT MARKS CSV MODAL */}
      {showImportAssessmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in my-6 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-blue-600" />
                Upload Student Assessment Marks (CSV / Excel)
              </h3>
              <button
                onClick={() => setShowImportAssessmentModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveImportedAssessment} className="p-6 space-y-4 overflow-y-auto">
              {/* Test metadata inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Assessment Test Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Test 4: Algorithms & Data Structures"
                    value={importAssessmentForm.title}
                    onChange={(e) => setImportAssessmentForm({ ...importAssessmentForm, title: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures"
                    value={importAssessmentForm.subject}
                    onChange={(e) => setImportAssessmentForm({ ...importAssessmentForm, subject: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Class Section</label>
                  <select
                    value={importAssessmentForm.classSection}
                    onChange={(e) => setImportAssessmentForm({ ...importAssessmentForm, classSection: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="CS-A">CS-A</option>
                    <option value="CS-B">CS-B</option>
                    <option value="CS-C">CS-C</option>
                    <option value="IT-A">IT-A</option>
                    <option value="ECE-A">ECE-A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={importAssessmentForm.maxMarks}
                    onChange={(e) => setImportAssessmentForm({ ...importAssessmentForm, maxMarks: Number(e.target.value) })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Test Date</label>
                  <input
                    type="date"
                    required
                    value={importAssessmentForm.date}
                    onChange={(e) => setImportAssessmentForm({ ...importAssessmentForm, date: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* CSV Upload Dropzone */}
              <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mx-auto">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {importedFileName ? `Selected File: ${importedFileName}` : 'Select or Drop CSV / Excel Marks File'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Format: Register Number, Student Name, Marks Obtained, Status (Present/Absent)
                  </p>
                </div>
                <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                  <span>Browse CSV / Excel File</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .txt, .tsv"
                    onChange={handleAssessmentCsvFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Mapped Student Scores Preview Table */}
              {importedScores.length > 0 && (
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Mapped Grades Preview ({importedScores.length} Students)
                    </span>
                    <span className="text-[10px] font-bold text-blue-600">
                      Class Avg: {(importedScores.reduce((acc, s) => acc + s.marksObtained, 0) / (importedScores.length || 1)).toFixed(1)} / {importAssessmentForm.maxMarks}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="p-2.5">Register No</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5 text-right">Marks</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                        {importedScores.map((sc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {sc.registerNumber || '-'}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                              {sc.studentName}
                            </td>
                            <td className="p-2.5 text-right font-bold text-blue-600">
                              {sc.marksObtained}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                sc.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {sc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportAssessmentModal(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importedScores.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={14} />
                  <span>Save & Map Grades</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: GRADE MARKS / ASSESSMENT SCORES MODAL */}
      {showScoresModal && selectedAssessment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in my-8">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Record Student Scores: {selectedAssessment.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                  Subject: {selectedAssessment.subject} | Class Section: {selectedAssessment.classSection} | Max Marks: {selectedAssessment.maxMarks}
                </p>
              </div>
              <button
                onClick={() => setShowScoresModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* CSV Upload & Template Download Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-blue-600" />
                    Batch Upload Class Marks via CSV / Excel
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Upload completed class marks or update marks individually below.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Download size={12} />
                    <span>Download CSV Template</span>
                  </button>

                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs">
                    <UploadCloud size={12} />
                    <span>Upload CSV / Excel</span>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls, .txt, .tsv"
                      onChange={handleCsvMarksUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Quick stats on top */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-50 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Logged</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">{assessmentScores.length} Students</span>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Present</span>
                  <span className="text-sm font-extrabold text-emerald-600">{assessmentScores.filter(s => s.status === 'Present').length} / {assessmentScores.length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Calculated Avg</span>
                  <span className="text-sm font-extrabold text-blue-600 text-teal-600">
                    {(() => {
                      const presents = assessmentScores.filter(s => s.status === 'Present');
                      const sum = presents.reduce((acc, s) => acc + s.marksObtained, 0);
                      return presents.length > 0 ? (sum / presents.length).toFixed(1) : '0';
                    })()}
                  </span>
                </div>
              </div>

              {/* Student grading table */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Register No.</th>
                      <th className="p-3">Attendance</th>
                      <th className="p-3">Obtained Marks (/{selectedAssessment.maxMarks})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {(assessmentScores || []).map((score, idx) => (
                      <tr key={score.studentId || score.registerNumber || `score_${idx}`} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20">
                        <td className="p-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {score.studentName}
                        </td>
                        <td className="p-3 text-xs font-mono text-slate-400">
                          {score.registerNumber}
                        </td>
                        <td className="p-3">
                          <select
                            value={score.status}
                            onChange={(e) => handleStatusChange(score.studentId, e.target.value as any)}
                            className="text-xs p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-250"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={selectedAssessment.maxMarks}
                            disabled={score.status === 'Absent'}
                            value={score.status === 'Absent' ? '' : score.marksObtained}
                            onChange={(e) => handleScoreChange(score.studentId, Number(e.target.value))}
                            placeholder="0"
                            className="w-20 text-xs p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-250 disabled:opacity-40"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-slate-50 dark:border-slate-800 flex justify-end space-x-2 bg-slate-50/30 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setShowScoresModal(false)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScoresSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
              >
                Compile & Save Grades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD APPLIED STUDENTS EXCEL MODAL */}
      {showUploadAppliedExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider rounded">
                  Placement Faculty Import
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  Upload Applied Students (Excel / CSV)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Import Google Form / WhatsApp response Excel collected for company drives.
                </p>
              </div>
              <button
                onClick={() => setShowUploadAppliedExcelModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Company Requirement */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Select Target Company Requirement / Drive:
                </label>
                {availableCompaniesForUpload.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium">
                    No active company requirements found. Please ask Placement Officer to create a company requirement first.
                  </div>
                ) : (
                  <select
                    value={selectedCompanyForUpload?.id || ''}
                    onChange={(e) => {
                      const found = availableCompaniesForUpload.find(c => c.id === e.target.value);
                      if (found) setSelectedCompanyForUpload(found);
                    }}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 outline-none font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {availableCompaniesForUpload.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.jobRole} ({c.salaryPackage})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Upload Excel / CSV File */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Upload Excel Sheet (.xlsx, .xls, .csv):
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-950 transition-all">
                  <FileSpreadsheet size={32} className="mx-auto text-blue-500 mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {appliedFileName ? appliedFileName : 'Click to Browse or Drag & Drop Excel File'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Columns supported: Register Number / Reg No, Student Name, Department, CGPA
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleAppliedExcelFileSelect}
                    className="hidden"
                    id="applied-excel-input"
                  />
                  <label
                    htmlFor="applied-excel-input"
                    className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                  >
                    Choose Excel File
                  </label>
                </div>
              </div>

              {uploadAppliedError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 font-semibold text-xs">
                  {uploadAppliedError}
                </div>
              )}

              {parsedAppliedRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
                  <span>Parsed {parsedAppliedRows.length} Student Records Ready for Import</span>
                  <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 rounded text-[10px]">
                    Status: Applied
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowUploadAppliedExcelModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAppliedExcel}
                disabled={!selectedCompanyForUpload || parsedAppliedRows.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg cursor-pointer transition-all"
              >
                Import & Sync Applications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT IMPORT MODAL */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        uploadedBy={user?.email || user?.id}
        onSuccess={() => {
          loadAllData();
          onAddNotification('Import Completed', 'Student registry synced with uploaded file data.', 'success');
        }}
      />

      {/* MODAL: BULK EDIT MODAL */}
      <StudentBulkEditModal
        selectedStudentIds={selectedStudentIds}
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSuccess={() => {
          setSelectedStudentIds([]);
          loadAllData();
          onAddNotification('Bulk Edit Saved', 'Selected student records updated successfully.', 'success');
        }}
      />

      {/* MODAL: SINGLE DELETE CONFIRMATION */}
      {showDeleteConfirmModal && studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Delete Student Profile?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action will permanently delete the student from MongoDB.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                Student: <span className="text-blue-600 font-bold">{studentToDelete.fullName || studentToDelete.name}</span>
              </p>
              <p className="font-mono text-slate-500">
                Register Number: <strong>{studentToDelete.registerNumber}</strong>
              </p>
              <p className="text-slate-500">
                Department: {studentToDelete.department} | Year: {studentToDelete.year} | Sec: {studentToDelete.section}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (studentToDelete) {
                    await handleDeleteStudentClick(studentToDelete);
                    setShowDeleteConfirmModal(false);
                    setStudentToDelete(null);
                  }
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK DELETE CONFIRMATION */}
      {showBulkDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Bulk Delete {selectedStudentIds.length} Students?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are about to permanently remove {selectedStudentIds.length} selected student records from MongoDB Atlas.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 font-semibold">
              ⚠️ Warning: This action cannot be undone. All matching academic metrics and readiness scores will be removed.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                Delete {selectedStudentIds.length} Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT HISTORY */}
      {showImportHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 space-y-6 animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider rounded">
                  MongoDB Atlas Import Logs
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                  <FolderSync size={22} className="text-blue-600" />
                  <span>Student Excel Import Batch History</span>
                </h3>
              </div>
              <button
                onClick={() => setShowImportHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {importHistoryList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-semibold">
                  No import batch records found in MongoDB Atlas.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">File Name</th>
                        <th className="p-3">Upload Date</th>
                        <th className="p-3">Uploaded By</th>
                        <th className="p-3 text-center">Total</th>
                        <th className="p-3 text-center">Success</th>
                        <th className="p-3 text-center">Updated</th>
                        <th className="p-3 text-center">Skipped</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importHistoryList.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 font-mono">{item.fileName}</td>
                          <td className="p-3 text-slate-500">{item.uploadDate || item.createdAt?.slice(0,10)}</td>
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{item.uploadedBy || 'Faculty'}</td>
                          <td className="p-3 text-center font-bold">{item.totalRows}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{item.successfulRows}</td>
                          <td className="p-3 text-center font-bold text-blue-600">{item.updatedRows}</td>
                          <td className="p-3 text-center font-bold text-amber-600">{item.skippedRows}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded">
                              {item.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowImportHistoryModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT IMPORT */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        uploadedBy={user?.email || user?.id}
        onSuccess={loadAllData}
      />

      {/* MODAL: STUDENT BULK EDIT */}
      <StudentBulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSuccess={loadAllData}
        selectedStudentIds={selectedStudentIds}
      />

    </div>
  );
}
