import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Bell, 
  Download, 
  Settings, 
  CheckSquare, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Send, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Briefcase, 
  Award, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Printer,
  Sparkles,
  List,
  Trash2
} from 'lucide-react';
import { Student, Company, StudentApplication, AppNotification, GeneratedFormConfig } from '../types';
import { getStudents } from '../api/students';
import { getCompanies, addCompany, updateCompany, deleteCompany, getStudentApplications, getStudentApplicationsAPI, updateApplicationStatus, evaluateStudentEligibility } from '../api/placement';
import { getPublishedPlacementDrives, PlacementDriveRecord, testNodemailerEmailAPI } from '../api/placementDrives';
import CompanyFormGeneratorModal from '../components/CompanyFormGeneratorModal';
import PublishPlacementDriveModal from '../components/PublishPlacementDriveModal';
import StudentImportModal from '../components/StudentImportModal';
import StudentBulkEditModal from '../components/StudentBulkEditModal';
import { exportToExcel, exportToCSV, printToPDF } from '../utils/export';
import WatermarkBackground from '../components/WatermarkBackground';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';

interface PlacementFacultyDashboardProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'alert' | 'company', extra?: any) => void;
  notifications: AppNotification[];
  onUpdateAvatar?: (url: string) => void;
}

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Engineering',
  'Robotics & Automation'
];

export default function PlacementFacultyDashboard({
  user,
  activeTab,
  setActiveTab,
  searchTerm: globalSearchTerm,
  onAddNotification,
  notifications,
  onUpdateAvatar
}: PlacementFacultyDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [publishedDrives, setPublishedDrives] = useState<PlacementDriveRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Company Form State
  const [showForm, setShowForm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCompanyForMatching, setSelectedCompanyForMatching] = useState<Company | null>(null);

  // Form Generator Modal State
  const [showFormGeneratorModal, setShowFormGeneratorModal] = useState(false);
  const [selectedCompanyForFormGen, setSelectedCompanyForFormGen] = useState<Company | null>(null);

  // Publish Placement Drive Modal State
  const [showPublishDriveModal, setShowPublishDriveModal] = useState(false);
  const [selectedCompanyForPublish, setSelectedCompanyForPublish] = useState<Company | null>(null);

  // Import & Bulk Edit Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedCompanyForAppliedImport, setSelectedCompanyForAppliedImport] = useState<string | undefined>(undefined);

  const handleOpenPublishDrive = (company: Company) => {
    setSelectedCompanyForPublish(company);
    setShowPublishDriveModal(true);
  };

  const handleOpenFormGenerator = (company: Company) => {
    setSelectedCompanyForFormGen(company);
    setShowFormGeneratorModal(true);
  };

  const handleSaveFormConfig = async (companyId: string, config: GeneratedFormConfig, formStatus: 'Draft' | 'Published' | 'Closed') => {
    try {
      await updateCompany(companyId, {
        generatedFormConfig: config,
        formStatus,
        status: formStatus === 'Published' ? 'Active' : formStatus === 'Closed' ? 'Closed' : 'Active'
      });
      await loadAllData();

      if (formStatus === 'Published') {
        onAddNotification(
          `Company Recruitment Announcement Published: ${selectedCompanyForFormGen?.name || 'Company Drive'}`,
          `Official recruitment announcement & guidelines for ${selectedCompanyForFormGen?.jobRole || 'Recruitment'} are now published for eligible students.`,
          'company',
          { companyId }
        );
      }
    } catch (e) {
      console.error('Failed to update company form config', e);
    }
  };

  const initialFormState: Omit<Company, 'id'> = {
    name: '',
    location: '',
    jobRole: '',
    salaryPackage: '',
    cgpaCutoff: 6.0,
    allowedDepartments: DEPARTMENTS,
    year: '2026',
    requiredSkills: [],
    requiredCertifications: [],
    internshipRequired: 'No',
    requiredProjects: 1,
    maxActiveArrears: 0,
    eligibleGender: 'All',
    applicationDeadline: '',
    selectionProcess: 'Aptitude Test -> Technical Interview -> HR Round',
    description: '',
    googleFormLink: '',
    additionalInstructions: '',
    status: 'Active',
    educationalQualification: 'B.E ( ECE / CSE / IT )',
    vacancies: '20+',
    employmentType: 'Full-Time',
    workMode: 'Onsite',
    recruitmentDate: '',
    circularRefNo: `42 / ${new Date().getFullYear()}-${new Date().getFullYear() + 1} / TPC`,
    circularDate: new Date().toLocaleDateString('en-GB'),
    driveVenue: 'Bannari Amman Institute of Technology, Sathyamangalam',
    bond: '2 Years',
    positionOverview: '',
    tenthCutoff: 75,
    twelfthCutoff: 75,
    customFields: []
  };

  const [formData, setFormData] = useState<Omit<Company, 'id'>>(initialFormState);
  const [skillsInput, setSkillsInput] = useState('');
  const [certsInput, setCertsInput] = useState('');

  // Dynamic Custom Option Field Builder States
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomType, setNewCustomType] = useState<'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date'>('number');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [newCustomMin, setNewCustomMin] = useState<number>(0);
  const [newCustomMax, setNewCustomMax] = useState<number>(100);
  const [newCustomStep, setNewCustomStep] = useState<number>(1);
  const [newCustomOptions, setNewCustomOptions] = useState('');

  // Custom Category Option States
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [employmentTypesList, setEmploymentTypesList] = useState<string[]>(['Full-Time', 'Internship', 'Internship + Full-Time', 'Contract']);
  const [customEmploymentTypeInput, setCustomEmploymentTypeInput] = useState('');
  const [workModesList, setWorkModesList] = useState<string[]>(['Onsite', 'Remote', 'Hybrid']);
  const [customWorkModeInput, setCustomWorkModeInput] = useState('');
  const [eligibleGendersList, setEligibleGendersList] = useState<string[]>(['All', 'Male', 'Female']);
  const [customGenderInput, setCustomGenderInput] = useState('');

  // Smart Matching State
  const [matchedStudents, setMatchedStudents] = useState<{ student: Student; isEligible: boolean; reasons: string[]; hasApplied: boolean }[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectAllMatched, setSelectAllMatched] = useState(true);

  // Application Tracking Filters
  const [appFilterTab, setAppFilterTab] = useState<'All' | 'Applied' | 'Pending' | 'Selected' | 'Rejected'>('All');
  const [appSearch, setAppSearch] = useState('');
  const [appDeptFilter, setAppDeptFilter] = useState('All');
  const [appCompanyFilter, setAppCompanyFilter] = useState('All');
  const [appYearFilter, setAppYearFilter] = useState('All');
  const [appCgpaMin, setAppCgpaMin] = useState<number>(0);

  // Hide Applications tab for Placement Officer and fallback to company-requirements
  useEffect(() => {
    if (activeTab === 'applications') {
      setActiveTab('company-requirements');
    }
  }, [activeTab, setActiveTab]);

  // Nodemailer Email Test State
  const [testEmailInput, setTestEmailInput] = useState(user?.email || 'placement@adithya.edu.in');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    collegeName: 'Adithya Institute of Technology',
    placementOfficerEmail: user?.email || 'placement@adithya.edu.in',
    placementCellPhone: user?.phone || '+91 98765 43210',
    academicYear: '2025-2026',
    minimumEligibleCgpaDefault: 6.0,
    autoNotifyOnPublish: true
  });

  // Load All Core Data from DB
  const loadAllData = async () => {
    setLoading(true);
    try {
      const stdList = await getStudents();
      const coList = await getCompanies();
      const appList = await getStudentApplicationsAPI();
      const driveList = await getPublishedPlacementDrives();
      setStudents(stdList);
      setCompanies(coList);
      setApplications(appList);
      setPublishedDrives(driveList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const totalEligibleCount = students.filter(s => s.placementStatus === 'Eligible' || (s.cgpa && s.cgpa >= 6.0)).length;
  const pendingCount = applications.filter(a => a.status === 'Pending').length;
  const appliedCount = applications.filter(a => a.status === 'Applied').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;
  const selectedCount = applications.filter(a => a.status === 'Selected').length;

  // Run Smart Matching whenever selectedCompanyForMatching or students list changes
  useEffect(() => {
    if (selectedCompanyForMatching && students.length > 0) {
      runSmartMatching(selectedCompanyForMatching);
    }
  }, [selectedCompanyForMatching, students, applications]);

  const runSmartMatching = async (company: Company) => {
    const results = await Promise.all(
      students.map(async (std) => {
        const evalRes = await evaluateStudentEligibility(std, company);
        const hasApplied = applications.some(a => a.studentId === std.id && a.companyId === company.id);
        return {
          student: std,
          isEligible: evalRes.isEligible,
          reasons: evalRes.reasons,
          hasApplied
        };
      })
    );
    setMatchedStudents(results);
    const eligibleIds = results.filter(r => r.isEligible).map(r => r.student.id);
    setSelectedStudentIds(eligibleIds);
    setSelectAllMatched(true);
  };

  // Form Handlers
  const handleSkillAdd = () => {
    if (skillsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillsInput.trim()]
      }));
      setSkillsInput('');
    }
  };

  const handleCertAdd = () => {
    if (certsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredCertifications: [...(prev.requiredCertifications || []), certsInput.trim()]
      }));
      setCertsInput('');
    }
  };

  const handleAddCustomOption = () => {
    if (!newCustomLabel.trim()) {
      alert('Please enter a label for the custom option.');
      return;
    }

    const newField = {
      id: `cf_${Date.now()}`,
      label: newCustomLabel.trim(),
      type: newCustomType,
      value: newCustomValue,
      required: true,
      min: newCustomType === 'number' ? newCustomMin : undefined,
      max: newCustomType === 'number' ? newCustomMax : undefined,
      step: newCustomType === 'number' ? newCustomStep : undefined,
      options: (newCustomType === 'select' || newCustomType === 'radio') 
        ? newCustomOptions.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    };

    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }));

    setNewCustomLabel('');
    setNewCustomValue('');
    setNewCustomOptions('');
  };

  const handleRemoveCustomOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.id !== id)
    }));
  };

  const handleDeptToggle = (dept: string) => {
    setFormData(prev => {
      const exists = prev.allowedDepartments.includes(dept);
      if (exists) {
        return { ...prev, allowedDepartments: prev.allowedDepartments.filter(d => d !== dept) };
      } else {
        return { ...prev, allowedDepartments: [...prev.allowedDepartments, dept] };
      }
    });
  };

  const handleSaveRequirement = async (status: 'Active' | 'Closed') => {
    if (!formData.name || !formData.jobRole || !formData.salaryPackage) {
      alert('Please fill in Company Name, Job Role, and Package.');
      return;
    }

    try {
      const created = await addCompany({ ...formData, status });
      await loadAllData();
      setSelectedCompanyForMatching(created);
      setShowForm(false);
      alert(`Company Requirement saved and set to ${status}!`);
    } catch (e) {
      console.error(e);
      alert('Failed to save company requirement.');
    }
  };

  const handleSendNotification = () => {
    if (!selectedCompanyForMatching) return;
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one eligible student to notify.');
      return;
    }

    onAddNotification(
      `Placement Drive: ${selectedCompanyForMatching.name}`,
      `Recruitment drive for ${selectedCompanyForMatching.jobRole} (${selectedCompanyForMatching.salaryPackage}). Deadline: ${selectedCompanyForMatching.applicationDeadline || 'As per schedule'}.`,
      'company',
      {
        companyId: selectedCompanyForMatching.id,
        googleFormLink: selectedCompanyForMatching.googleFormLink,
        role: selectedCompanyForMatching.jobRole,
        package: selectedCompanyForMatching.salaryPackage,
        deadline: selectedCompanyForMatching.applicationDeadline
      }
    );

    alert(`Notification dispatched to ${selectedStudentIds.length} eligible student(s)!`);
  };

  // Metrics Calculations
  const totalStudentsCount = students.length;
  const eligibleStudentsCount = students.filter(s => s.placementStatus !== 'Not Eligible').length;
  const totalCompaniesCount = companies.length;
  const activeDrivesCount = companies.filter(c => c.status === 'Active').length;
  const appliedStudentsCount = new Set(applications.map(a => a.studentId)).size;
  const selectedStudentsCount = applications.filter(a => a.status === 'Selected').length;

  // Application Table Filtering
  const filteredApplications = applications.filter(app => {
    if (appFilterTab !== 'All' && app.status !== appFilterTab) return false;
    if (appDeptFilter !== 'All' && app.department !== appDeptFilter) return false;
    if (appCompanyFilter !== 'All' && app.companyName !== appCompanyFilter) return false;
    if (appYearFilter !== 'All' && String(app.year) !== appYearFilter) return false;
    if (appCgpaMin > 0 && app.cgpa < appCgpaMin) return false;
    if (appSearch) {
      const term = appSearch.toLowerCase();
      return (
        app.studentName.toLowerCase().includes(term) ||
        app.registerNumber.toLowerCase().includes(term) ||
        app.companyName.toLowerCase().includes(term) ||
        app.jobRole.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Export handlers
  const handleExportApplications = (type: 'Excel' | 'CSV' | 'PDF') => {
    if (filteredApplications.length === 0) {
      alert('No application records available to export.');
      return;
    }

    const exportRows = filteredApplications.map(app => ({
      'Register Number': app.registerNumber,
      'Student Name': app.studentName,
      'Department': app.department,
      'Year': app.year,
      'CGPA': app.cgpa,
      'Company Name': app.companyName,
      'Job Role': app.jobRole,
      'Package': app.salaryPackage,
      'Applied Date': app.appliedDate,
      'Status': app.status
    }));

    if (type === 'Excel') {
      exportToExcel('AIT_Placement_Applications', exportRows);
    } else if (type === 'CSV') {
      exportToCSV('AIT_Placement_Applications', exportRows);
    } else if (type === 'PDF') {
      printToPDF('Placement Applications Report', exportRows);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-12 font-sans">
      <WatermarkBackground opacity={0.05} />

      {/* 1. DASHBOARD OVERVIEW TAB */}
      {(activeTab === 'dashboard' || activeTab === 'overview') && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                Adithya Institute of Technology
              </span>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Placement Officer Dashboard
              </h2>
              <p className="text-xs text-blue-100 max-w-xl">
                Department of Placement & Training — Manage placement requirements, student eligibility, company notifications, and recruitment drives.
              </p>
            </div>

            {/* Profile Photo Uploader */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center space-x-3 text-white">
              <ProfilePhotoUploader
                currentAvatarUrl={user?.avatarUrl}
                onAvatarChange={(url) => onUpdateAvatar && onUpdateAvatar(url)}
                size="sm"
                showUploadButton={true}
              />
              <div className="text-left text-xs">
                <div className="font-bold">{user?.name || 'Placement Officer'}</div>
                <div className="text-[10px] text-blue-200">Placement Cell Head</div>
              </div>
            </div>
          </div>

          {/* 6 Required Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            {/* 1. Total Students */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Students</span>
                <Users size={16} className="text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalStudentsCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">Uploaded Datasets</div>
            </div>

            {/* 2. Eligible Students */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Eligible Students</span>
                <UserCheck size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{eligibleStudentsCount}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Meet Base Criteria</div>
            </div>

            {/* 3. Companies */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Companies</span>
                <Building2 size={16} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-600">{totalCompaniesCount}</div>
              <div className="text-[10px] text-indigo-600 font-medium">Recruiting Partners</div>
            </div>

            {/* 4. Active Drives */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Drives</span>
                <Briefcase size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{activeDrivesCount}</div>
              <div className="text-[10px] text-amber-600 font-medium">Open Placement Drives</div>
            </div>

            {/* 5. Applied Students */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Applied Students</span>
                <CheckSquare size={16} className="text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-600">{appliedStudentsCount}</div>
              <div className="text-[10px] text-purple-600 font-medium">Applications Filed</div>
            </div>

            {/* 6. Selected Students */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Selected Students</span>
                <Award size={16} className="text-teal-600" />
              </div>
              <div className="text-2xl font-black text-teal-600">{selectedStudentsCount}</div>
              <div className="text-[10px] text-teal-600 font-medium">Offers Confirmed</div>
            </div>

          </div>

          {/* Core Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Active Company Requirements */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Company Requirements</h3>
                  <p className="text-[11px] text-slate-500">Requirements created in the database</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('company-requirements');
                    setShowForm(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Create Requirement</span>
                </button>
              </div>

              {companies.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                  <Building2 size={32} className="mx-auto text-slate-300" />
                  <p>No Company Requirements Available.</p>
                  <p className="text-[10px] text-slate-400">Click "Create Requirement" to manually add a company drive.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                            {c.jobRole}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {c.salaryPackage}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                          <span>Min CGPA: <strong>{c.cgpaCutoff}</strong></span>
                          <span>Deadline: <strong>{c.applicationDeadline || 'N/A'}</strong></span>
                          <span>Depts: <strong>{c.allowedDepartments?.length || 'All'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setActiveTab('company-requirements');
                            handleOpenFormGenerator(c);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Sparkles size={14} />
                          <span>View Form</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`Delete requirement for "${c.name}"? This action cannot be undone.`)) {
                              await deleteCompany(c.id);
                              await loadAllData();
                              onAddNotification(
                                'Requirement Deleted',
                                `Requirement for "${c.name}" has been deleted.`,
                                'info'
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 border border-rose-200"
                          title="Delete Requirement"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Quick Navigation & Audit Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Quick Navigation
              </h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('company-requirements')}
                  className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <Building2 size={16} />
                    <span>Company Requirements Module</span>
                  </span>
                  <ChevronRight size={16} />
                </button>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. COMPANY REQUIREMENTS MODULE (CORE MODULE) */}
      {activeTab === 'company-requirements' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          
          {/* Module Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Company Requirement Module</h2>
              <p className="text-xs text-slate-500">Create company requirements and execute smart student matching.</p>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setFormData(initialFormState);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Company Requirement</span>
              </button>
            )}
          </div>

          {/* FORM VIEW */}
          {showForm && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-6 animate-scale-up">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">New Company Requirement Form</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 18 Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                {/* 1. Company Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google / Zoho / TCS"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 2. Company Location */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Company Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore / Chennai / Remote"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 3. Job Role */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Job Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer / Data Analyst"
                    value={formData.jobRole}
                    onChange={e => setFormData({ ...formData, jobRole: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Software Engineer', 'Data Analyst', 'Full Stack Developer', 'Cloud Engineer', 'QA Tester'].map(roleOpt => (
                      <button
                        key={roleOpt}
                        type="button"
                        onClick={() => setFormData({ ...formData, jobRole: roleOpt })}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        + {roleOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Package (LPA) */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Package (LPA) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 LPA"
                    value={formData.salaryPackage}
                    onChange={e => setFormData({ ...formData, salaryPackage: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['4.5 LPA', '6 LPA', '8.5 LPA', '12 LPA', '15+ LPA'].map(pkgOpt => (
                      <button
                        key={pkgOpt}
                        type="button"
                        onClick={() => setFormData({ ...formData, salaryPackage: pkgOpt })}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        + {pkgOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Minimum CGPA */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Minimum CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.cgpaCutoff}
                    onChange={e => setFormData({ ...formData, cgpaCutoff: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 7. Year */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Passing Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026 / 4th Year"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* Educational Qualification */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Educational Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.E / B.Tech / M.E / MCA"
                    value={formData.educationalQualification || ''}
                    onChange={e => setFormData({ ...formData, educationalQualification: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['B.E / B.Tech', 'M.E / M.Tech', 'MCA', 'B.Sc / M.Sc', 'MBA'].map(qualOpt => (
                      <button
                        key={qualOpt}
                        type="button"
                        onClick={() => setFormData({ ...formData, educationalQualification: qualOpt })}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        + {qualOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vacancies */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Vacancies / Openings</label>
                  <input
                    type="text"
                    placeholder="e.g. 25 Openings"
                    value={formData.vacancies || ''}
                    onChange={e => setFormData({ ...formData, vacancies: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* Employment Type */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Employment Type</label>
                  <select
                    value={formData.employmentType || 'Full-Time'}
                    onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  >
                    {employmentTypesList.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="flex space-x-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom employment type"
                      value={customEmploymentTypeInput}
                      onChange={e => setCustomEmploymentTypeInput(e.target.value)}
                      className="flex-1 p-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEmploymentTypeInput.trim()) {
                          const newOpt = customEmploymentTypeInput.trim();
                          if (!employmentTypesList.includes(newOpt)) {
                            setEmploymentTypesList(prev => [...prev, newOpt]);
                          }
                          setFormData(prev => ({ ...prev, employmentType: newOpt as any }));
                          setCustomEmploymentTypeInput('');
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Custom Option
                    </button>
                  </div>
                </div>

                {/* Work Mode */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Work Mode</label>
                  <select
                    value={formData.workMode || 'Onsite'}
                    onChange={e => setFormData({ ...formData, workMode: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  >
                    {workModesList.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  <div className="flex space-x-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom work mode"
                      value={customWorkModeInput}
                      onChange={e => setCustomWorkModeInput(e.target.value)}
                      className="flex-1 p-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customWorkModeInput.trim()) {
                          const newOpt = customWorkModeInput.trim();
                          if (!workModesList.includes(newOpt)) {
                            setWorkModesList(prev => [...prev, newOpt]);
                          }
                          setFormData(prev => ({ ...prev, workMode: newOpt as any }));
                          setCustomWorkModeInput('');
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Custom Option
                    </button>
                  </div>
                </div>

                {/* Recruitment Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Recruitment Drive Date</label>
                  <input
                    type="date"
                    value={formData.recruitmentDate || ''}
                    onChange={e => setFormData({ ...formData, recruitmentDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 10. Internship Required */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Internship Required?</label>
                  <select
                    value={formData.internshipRequired}
                    onChange={e => setFormData({ ...formData, internshipRequired: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* 11. Projects Required */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Projects Required Count</label>
                  <input
                    type="number"
                    value={formData.requiredProjects}
                    onChange={e => setFormData({ ...formData, requiredProjects: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 12. Maximum Active Arrears */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Max Active Arrears Allowed</label>
                  <input
                    type="number"
                    value={formData.maxActiveArrears}
                    onChange={e => setFormData({ ...formData, maxActiveArrears: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 13. Eligible Gender */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Eligible Gender</label>
                  <select
                    value={formData.eligibleGender}
                    onChange={e => setFormData({ ...formData, eligibleGender: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  >
                    {eligibleGendersList.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                  <div className="flex space-x-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom gender option"
                      value={customGenderInput}
                      onChange={e => setCustomGenderInput(e.target.value)}
                      className="flex-1 p-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customGenderInput.trim()) {
                          const newOpt = customGenderInput.trim();
                          if (!eligibleGendersList.includes(newOpt)) {
                            setEligibleGendersList(prev => [...prev, newOpt]);
                          }
                          setFormData(prev => ({ ...prev, eligibleGender: newOpt as any }));
                          setCustomGenderInput('');
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Custom Option
                    </button>
                  </div>
                </div>

                {/* 14. Application Deadline */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={e => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 17. Google Form Link */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Google Form Link (Apply URL)</label>
                  <input
                    type="url"
                    placeholder="https://forms.google.com/..."
                    value={formData.googleFormLink}
                    onChange={e => setFormData({ ...formData, googleFormLink: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 6. Allowed Departments (Checkboxes + Custom Department Add) */}
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block font-bold text-slate-700">Allowed Departments</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        placeholder="Add custom department option"
                        value={customDeptInput}
                        onChange={e => setCustomDeptInput(e.target.value)}
                        className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none w-52"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customDeptInput.trim()) {
                            const newDept = customDeptInput.trim();
                            if (!departmentsList.includes(newDept)) {
                              setDepartmentsList(prev => [...prev, newDept]);
                            }
                            if (!formData.allowedDepartments.includes(newDept)) {
                              setFormData(prev => ({ ...prev, allowedDepartments: [...prev.allowedDepartments, newDept] }));
                            }
                            setCustomDeptInput('');
                          }
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Add Custom Option
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {departmentsList.map(dept => {
                      const checked = formData.allowedDepartments.includes(dept);
                      return (
                        <label key={dept} className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleDeptToggle(dept)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 8. Required Skills */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-bold text-slate-700">Required Skills</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add required skill (e.g. Java, React, SQL)"
                      value={skillsInput}
                      onChange={e => setSkillsInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                      className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleSkillAdd}
                      className="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.requiredSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <span>{sk}</span>
                        <X size={12} className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter((_, i) => i !== idx) }))} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* 9. Required Certifications */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-bold text-slate-700">Required Certifications</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add certification (e.g. AWS Certified, CCNA)"
                      value={certsInput}
                      onChange={e => setCertsInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCertAdd())}
                      className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleCertAdd}
                      className="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.requiredCertifications?.map((cert, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <span>{cert}</span>
                        <X size={12} className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, requiredCertifications: prev.requiredCertifications?.filter((_, i) => i !== idx) }))} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* 15. Selection Process */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-bold text-slate-700">Selection Process</label>
                  <textarea
                    rows={2}
                    placeholder="Describe stages (e.g. Aptitude Test -> Technical Interview -> HR)"
                    value={formData.selectionProcess}
                    onChange={e => setFormData({ ...formData, selectionProcess: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 16. Job Description */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-bold text-slate-700">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed job description and expectations..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 18. Additional Instructions */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-bold text-slate-700">Additional Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Special instructions regarding dress code, documents to bring..."
                    value={formData.additionalInstructions}
                    onChange={e => setFormData({ ...formData, additionalInstructions: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold"
                  />
                </div>

                {/* 19. Add Custom Option / Detail Builder at the End */}
                <div className="md:col-span-2 lg:col-span-3 space-y-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center space-x-1.5">
                      <Plus size={14} className="text-indigo-600" />
                      <span>Add Custom Requirement / Detail Option at the End</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-bold">
                      Add extra fields/questions at the end of requirement circular
                    </span>
                  </div>

                  {formData.customFields && formData.customFields.length > 0 && (
                    <div className="space-y-2">
                      {formData.customFields.map((cf, idx) => (
                        <div key={cf.id || idx} className="p-3 bg-white rounded-xl border border-indigo-100 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900">{idx + 1}. {cf.label}</span>
                            <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              {cf.type}
                            </span>
                            {cf.options && cf.options.length > 0 && (
                              <span className="ml-2 text-[10px] text-slate-500 font-mono">[{cf.options.join(', ')}]</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                customFields: (prev.customFields || []).filter((_, i) => i !== idx)
                              }));
                            }}
                            className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-all"
                            title="Remove custom option"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <input
                      type="text"
                      placeholder="Custom Option Title (e.g. Passport Required, Shift Timing, Bond Term)"
                      value={newCustomLabel}
                      onChange={e => setNewCustomLabel(e.target.value)}
                      className="p-2 border border-slate-200 rounded-xl bg-white outline-none font-semibold sm:col-span-2 text-xs"
                    />
                    <select
                      value={newCustomType}
                      onChange={e => setNewCustomType(e.target.value as any)}
                      className="p-2 border border-slate-200 rounded-xl bg-white outline-none font-semibold text-xs"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph</option>
                      <option value="number">Number (Arrows)</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="radio">Radio Options</option>
                      <option value="date">Date</option>
                    </select>
                  </div>

                  {(newCustomType === 'select' || newCustomType === 'radio' || newCustomType === 'checkbox') && (
                    <input
                      type="text"
                      placeholder="Options (comma-separated, e.g. Yes, No, Maybe)"
                      value={newCustomOptions}
                      onChange={e => setNewCustomOptions(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none text-xs font-semibold"
                    />
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomLabel.trim()) {
                          const newField = {
                            id: `cf_${Date.now()}`,
                            label: newCustomLabel.trim(),
                            type: newCustomType,
                            required: false,
                            placeholder: 'Enter detail...',
                            options: (newCustomType === 'select' || newCustomType === 'radio' || newCustomType === 'checkbox')
                              ? newCustomOptions.split(',').map(s => s.trim()).filter(Boolean)
                              : undefined
                          };
                          setFormData(prev => ({
                            ...prev,
                            customFields: [...(prev.customFields || []), newField]
                          }));
                          setNewCustomLabel('');
                          setNewCustomOptions('');
                        }
                      }}
                      disabled={!newCustomLabel.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Add Custom Option at End</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRequirement('Closed')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.name || !formData.jobRole || !formData.salaryPackage) {
                      alert('Please fill in Company Name, Job Role, and Package before generating form.');
                      return;
                    }
                    try {
                      const created = await addCompany({ ...formData, status: 'Active' });
                      await loadAllData();
                      setShowForm(false);
                      handleOpenFormGenerator(created);
                    } catch (e) {
                      console.error(e);
                      alert('Failed to generate form.');
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center space-x-2 transition-all"
                >
                  <Sparkles size={16} />
                  <span>Generate Form</span>
                </button>
              </div>

            </div>
          )}

          {/* LIST OF CREATED COMPANY REQUIREMENTS */}
          {!showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Created Company Requirements
              </h3>

              {companies.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic">
                  No Company Requirements Available.
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map(c => {
                    const isSelectedForMatch = selectedCompanyForMatching?.id === c.id;
                    const isFormPublished = c.formStatus === 'Published' || c.generatedFormConfig?.isPublished;
                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelectedForMatch ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20' : 'border-slate-200 bg-slate-50/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-base text-slate-900">{c.name}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                                {c.jobRole}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                {c.salaryPackage}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {c.status}
                              </span>
                              {isFormPublished ? (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded flex items-center space-x-1">
                                  <Sparkles size={10} />
                                  <span>Form Live</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                  {c.formStatus === 'Draft' ? 'Form Draft' : 'No Form'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">
                              {c.location} &bull; Min CGPA: {c.cgpaCutoff} &bull; Deadline: {c.applicationDeadline || 'N/A'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleOpenPublishDrive(c)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center space-x-1.5 border border-emerald-400/30"
                            >
                              <Send size={14} />
                              <span>Publish Drive</span>
                            </button>

                            <button
                              onClick={() => handleOpenFormGenerator(c)}
                              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                            >
                              <Sparkles size={14} />
                              <span>{c.generatedFormConfig ? 'Edit Form' : 'Generate Form'}</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${c.name}" requirement? This action cannot be undone.`)) {
                                  await deleteCompany(c.id);
                                  await loadAllData();
                                  onAddNotification(
                                    'Requirement Deleted',
                                    `Company requirement "${c.name}" has been deleted successfully.`,
                                    'info'
                                  );
                                }
                              }}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5"
                              title="Delete Requirement"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 6. APPLICATIONS TRACKING MODULE */}
      {activeTab === 'applications' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Applications Tracking Page</h2>
                  <p className="text-xs text-slate-500">View student applications submitted directly via recruitment form links.</p>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExportApplications('Excel')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => handleExportApplications('CSV')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <FileText size={16} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportApplications('PDF')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <Printer size={16} />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs">
              
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student / reg no..."
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium"
                />
              </div>

              {/* Department Filter */}
              <select
                value={appDeptFilter}
                onChange={e => setAppDeptFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Company Filter */}
              <select
                value={appCompanyFilter}
                onChange={e => setAppCompanyFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium"
              >
                <option value="All">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                value={appYearFilter}
                onChange={e => setAppYearFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium"
              >
                <option value="All">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              {/* CGPA Min */}
              <input
                type="number"
                step="0.5"
                placeholder="Min CGPA"
                value={appCgpaMin || ''}
                onChange={e => setAppCgpaMin(parseFloat(e.target.value) || 0)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium"
              />

            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold">Register No.</th>
                  <th className="p-3.5 font-bold">Student Name</th>
                  <th className="p-3.5 font-bold">Department</th>
                  <th className="p-3.5 font-bold">CGPA</th>
                  <th className="p-3.5 font-bold">Company</th>
                  <th className="p-3.5 font-bold">Job Role</th>
                  <th className="p-3.5 font-bold">Applied Date</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-3.5 font-mono font-semibold text-slate-800">{app.registerNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{app.studentName}</td>
                    <td className="p-3.5 text-slate-600">{app.department}</td>
                    <td className="p-3.5 font-bold text-slate-800">{app.cgpa}</td>
                    <td className="p-3.5 font-bold text-blue-700">{app.companyName}</td>
                    <td className="p-3.5 text-slate-700">{app.jobRole}</td>
                    <td className="p-3.5 text-slate-500">{app.appliedDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        app.status === 'Selected' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={app.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          updateApplicationStatus(app.id, newStatus);
                          loadAllData();
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg text-[11px] font-bold outline-none"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Pending">Pending</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                      No Applications
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6 relative z-10 animate-fade-in max-w-2xl">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Placement Cell System Settings</h2>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Institution Name</label>
                <input
                  type="text"
                  value={settings.collegeName}
                  onChange={e => setSettings({ ...settings, collegeName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Placement Officer Email</label>
                <input
                  type="email"
                  value={settings.placementOfficerEmail}
                  onChange={e => setSettings({ ...settings, placementOfficerEmail: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Placement Cell Contact Phone</label>
                <input
                  type="text"
                  value={settings.placementCellPhone}
                  onChange={e => setSettings({ ...settings, placementCellPhone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Academic Batch Year</label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div className="pt-3">
                <button
                  onClick={() => alert('Settings saved successfully!')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Portal Settings
                </button>
              </div>
            </div>
          </div>

          {/* Nodemailer Email Configuration & Live Tester */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google OAuth2 Email Integration Status</h3>
                <p className="text-xs text-slate-500">OAuth2 2FA token authentication configured for automated recruitment invitations</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Auth Method:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Google OAuth2 (2FA Active)</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 font-semibold font-sans">Transport:</span>
                <span className="text-slate-700 text-[11px]">Nodemailer Gmail OAuth2</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="block font-bold text-slate-700">Send Test Email to Verify Dispatch:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter recipient email address..."
                  value={testEmailInput}
                  onChange={e => setTestEmailInput(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:bg-white"
                />
                <button
                  type="button"
                  disabled={testEmailLoading || !testEmailInput.trim()}
                  onClick={async () => {
                    setTestEmailLoading(true);
                    setTestEmailResult(null);
                    try {
                      const res = await testNodemailerEmailAPI(testEmailInput.trim());
                      if (res.success) {
                        setTestEmailResult({ success: true, message: `Test email dispatched to ${testEmailInput}` });
                      } else {
                        setTestEmailResult({ success: false, message: res.error || 'Failed to send test email' });
                      }
                    } catch (e: any) {
                      setTestEmailResult({ success: false, message: e?.message || 'Error communicating with email service endpoint' });
                    } finally {
                      setTestEmailLoading(false);
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <Send size={14} />
                  <span>{testEmailLoading ? 'Sending...' : 'Send Test'}</span>
                </button>
              </div>

              {testEmailResult && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  testEmailResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {testEmailResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                  <span>{testEmailResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW REQUIREMENT MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">
                  Company Requirement Preview
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{formData.name || 'Company Name'}</h3>
                <p className="text-xs font-bold text-blue-600">{formData.jobRole || 'Job Role'} &bull; {formData.salaryPackage || '0 LPA'}</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-slate-800">Job Description:</strong>
                <p className="text-slate-600 mt-1">{formData.description || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div><span className="text-slate-400">Location:</span> <strong>{formData.location}</strong></div>
                <div><span className="text-slate-400">CGPA Cutoff:</span> <strong>{formData.cgpaCutoff}</strong></div>
                <div><span className="text-slate-400">Internship Req:</span> <strong>{formData.internshipRequired}</strong></div>
                <div><span className="text-slate-400">Deadline:</span> <strong>{formData.applicationDeadline || 'N/A'}</strong></div>
              </div>
              <div>
                <strong className="text-slate-800">Allowed Depts:</strong>
                <p className="text-slate-600">{formData.allowedDepartments.join(', ')}</p>
              </div>
              {formData.requiredSkills.length > 0 && (
                <div>
                  <strong className="text-slate-800">Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.requiredSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Form Generator Modal */}
      {selectedCompanyForFormGen && (
        <CompanyFormGeneratorModal
          company={selectedCompanyForFormGen}
          isOpen={showFormGeneratorModal}
          onClose={() => {
            setShowFormGeneratorModal(false);
            setSelectedCompanyForFormGen(null);
          }}
          onSaveFormConfig={handleSaveFormConfig}
        />
      )}

      {/* Publish Placement Drive Modal */}
      {selectedCompanyForPublish && (
        <PublishPlacementDriveModal
          company={selectedCompanyForPublish}
          isOpen={showPublishDriveModal}
          onClose={() => {
            setShowPublishDriveModal(false);
            setSelectedCompanyForPublish(null);
          }}
          onSuccess={(drive) => {
            loadAllData();
            onAddNotification(
              `Placement Drive Published: ${selectedCompanyForPublish.name}`,
              `Dispatched emails with official PDF to ${drive.eligibleStudentsCount} eligible students.`,
              'company'
            );
          }}
        />
      )}

      {/* Student Dataset Import Modal */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        uploadedBy={user?.email || user?.id}
        onSuccess={loadAllData}
      />

      {/* Student Bulk Edit Modal */}
      <StudentBulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSuccess={loadAllData}
        selectedStudentIds={selectedStudentIds}
      />

    </div>
  );
}
