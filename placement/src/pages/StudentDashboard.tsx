import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileSpreadsheet, 
  User, 
  Mail, 
  Phone, 
  Linkedin, 
  CheckCircle2, 
  ArrowUpRight, 
  Compass, 
  CheckSquare, 
  Square,
  Sparkles,
  UploadCloud,
  Loader2,
  FileCheck2,
  Bell,
  Building2,
  ExternalLink,
  MapPin,
  CircleDollarSign,
  Calendar,
  X,
  Briefcase,
  Award,
  AlertCircle,
  BarChart2,
  Wrench,
  Check,
  Send,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';
import { Student, Company, StudentApplication, AppNotification } from '../types';
import { getCompanies, getStudentApplications, saveStudentApplication, evaluateStudentEligibility } from '../api/placement';
import { getEligibleDrivesForStudent, PlacementDriveRecord } from '../api/placementDrives';
import { getStudentAssessmentSummary, StudentAssessmentRecord } from '../api/faculty';
import { getStudentProfileByRegisterNumber } from '../api/students';
import WatermarkBackground from '../components/WatermarkBackground';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import StudentApplicationFormModal from '../components/StudentApplicationFormModal';
import GenerateForm from '../components/GenerateForm';
import CareerReadinessAnalyzer from '../components/CareerReadinessAnalyzer';

interface StudentDashboardProps {
  user: Student;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  notifications: AppNotification[];
  onUpdateAvatar?: (url: string) => void;
}

export default function StudentDashboard({
  user,
  activeTab,
  setActiveTab,
  onAddNotification,
  notifications,
  onUpdateAvatar
}: StudentDashboardProps) {
  const [currentUser, setCurrentUser] = useState<Student>(user);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [publishedDrives, setPublishedDrives] = useState<PlacementDriveRecord[]>([]);
  const [myApplications, setMyApplications] = useState<StudentApplication[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyEligibilityMap, setCompanyEligibilityMap] = useState<Record<string, { isEligible: boolean; reasons: string[] }>>({});
  const [applySuccessToast, setApplySuccessToast] = useState(false);

  // View PDF Form modal state
  const [viewFormDrive, setViewFormDrive] = useState<PlacementDriveRecord | null>(null);

  // Dynamic Student Application Form Modal State
  const [showApplicationFormModal, setShowApplicationFormModal] = useState(false);
  const [selectedCompanyForApp, setSelectedCompanyForApp] = useState<Company | null>(null);

  const [notificationFilter, setNotificationFilter] = useState<'eligible' | 'all'>('eligible');

  // Student Dashboard Automatic Announcement Notification Popup State
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [hasAutoOpenedPopup, setHasAutoOpenedPopup] = useState(false);

  // Faculty-uploaded Weekly Assessment Summary
  const [assessmentSummary, setAssessmentSummary] = useState<{
    records: StudentAssessmentRecord[];
    totalAssessments: number;
    presentCount: number;
    avgPercentage: number;
  } | null>(null);

  const handleOpenApplicationForm = (company: Company) => {
    setSelectedCompanyForApp(company);
    setShowApplicationFormModal(true);
  };

  const loadData = async () => {
    try {
      // Synchronize latest student record from MongoDB Atlas
      let latestProfile = null;
      if (user.registerNumber) {
        latestProfile = await getStudentProfileByRegisterNumber(user.registerNumber);
      }
      const activeStudent = latestProfile || user;
      setCurrentUser(activeStudent);

      const coList = await getCompanies();
      const appList = getStudentApplications();
      setCompanies(coList);
      
      const filteredApps = appList.filter(
        a => a.studentId === activeStudent.id || (a.registerNumber && a.registerNumber === activeStudent.registerNumber)
      );
      setMyApplications(filteredApps);

      // Load published drives where this student is eligible
      const eligibleDrives = await getEligibleDrivesForStudent(activeStudent.id, activeStudent.registerNumber, activeStudent.email);
      setPublishedDrives(eligibleDrives);

      // Load faculty-uploaded assessment marks for student
      const assessSum = await getStudentAssessmentSummary(activeStudent.registerNumber, activeStudent.id);
      setAssessmentSummary(assessSum);

      // Evaluate eligibility for each company drive
      const eligibilityMap: Record<string, { isEligible: boolean; reasons: string[] }> = {};
      for (const co of coList) {
        const evalRes = await evaluateStudentEligibility(activeStudent, co);
        eligibilityMap[co.id] = {
          isEligible: evalRes.isEligible,
          reasons: evalRes.reasons
        };

        // Automatically dispatch header notification if student is eligible and hasn't been notified yet
        if (evalRes.isEligible && (co.status === 'Active' || !co.status)) {
          const alreadyNotified = notifications.some(
            n => n.companyId === co.id || (n.title && n.title.includes(co.name))
          );
          if (!alreadyNotified) {
            onAddNotification(
              `Eligible Company Requirement: ${co.name}`,
              `You meet all eligibility criteria for ${co.jobRole} (${co.salaryPackage}). Application Deadline: ${co.applicationDeadline || 'As per schedule'}.`,
              'info'
            );
          }
        }
      }
      setCompanyEligibilityMap(eligibilityMap);

      // Trigger automatic popup notification for newly published company announcements immediately upon dashboard load
      const activeAnnouncements = coList.filter(c => c.status === 'Active' || !c.status);
      const ackKey = `ack_announcements_${activeStudent.id}`;
      const ackSaved = localStorage.getItem(ackKey);
      const ackIds: string[] = ackSaved ? JSON.parse(ackSaved) : [];
      const unackAnnouncements = activeAnnouncements.filter(c => !ackIds.includes(c.id));

      if ((unackAnnouncements.length > 0 || activeAnnouncements.length > 0) && !hasAutoOpenedPopup) {
        setShowAnnouncementPopup(true);
        setHasAutoOpenedPopup(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApplyToCompany = (company: Company) => {
    // Open Google Form link in new tab if available
    if (company.googleFormLink) {
      window.open(company.googleFormLink, '_blank');
    }

    // Register Student Application in storage
    saveStudentApplication({
      studentId: user.id,
      studentName: user.name,
      registerNumber: user.registerNumber,
      department: user.department,
      year: user.year,
      cgpa: user.cgpa,
      companyId: company.id,
      companyName: company.name,
      jobRole: company.jobRole,
      salaryPackage: company.salaryPackage,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      googleFormSubmitted: true
    });

    onAddNotification(
      `Application Submitted: ${company.name}`,
      `Your application for ${company.jobRole} (${company.salaryPackage}) was submitted successfully.`,
      'success'
    );

    setApplySuccessToast(true);
    setTimeout(() => setApplySuccessToast(false), 4000);

    setShowCompanyModal(false);
    loadData();
  };

  // Status breakdown counters
  const appliedCount = myApplications.filter(a => a.status === 'Applied').length;
  const pendingCount = myApplications.filter(a => a.status === 'Pending').length;
  const selectedCount = myApplications.filter(a => a.status === 'Selected').length;
  const rejectedCount = myApplications.filter(a => a.status === 'Rejected').length;
  const notAppliedCount = Math.max(0, companies.length - myApplications.length);

  return (
    <div className="relative min-h-screen space-y-6 pb-12 font-sans">
      <WatermarkBackground opacity={0.05} />

      {/* Application Submitted Success Banner */}
      {applySuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 animate-slide-down">
          <CheckCircle2 size={20} />
          <div>
            <div className="font-extrabold text-xs">Application Submitted Successfully!</div>
            <div className="text-[11px] opacity-90">Google Form opened and application status updated to Applied.</div>
          </div>
        </div>
      )}

      {/* 1. STUDENT DASHBOARD OVERVIEW */}
      {(activeTab === 'student-dashboard' || activeTab === 'overview') && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative z-10 space-y-1.5">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                Adithya Institute of Technology
              </span>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Welcome back, {currentUser.name}!
              </h2>
              <p className="text-xs text-blue-100 max-w-xl">
                {currentUser.department} — Year {currentUser.year} Sec {currentUser.section || 'A'} | Register No: <strong className="font-mono text-white">{currentUser.registerNumber}</strong>
              </p>
            </div>

            {/* Profile Photo Display */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center space-x-3 text-white">
              <ProfilePhotoUploader
                currentAvatarUrl={currentUser?.avatarUrl}
                size="sm"
                showUploadButton={false}
              />
              <div className="text-left text-xs">
                <div className="font-bold">{currentUser.name}</div>
                <div className="text-[10px] text-blue-200 font-mono">{currentUser.registerNumber}</div>
              </div>
            </div>
          </div>

          {/* Status Tracker Bar (Applied, Not Applied, Rejected, Selected, Pending) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Application Status Tracker</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-2xl font-black text-blue-700">{appliedCount}</div>
                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Applied</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-700">{notAppliedCount}</div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Not Applied</div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-2xl font-black text-emerald-700">{selectedCount}</div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Selected</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="text-2xl font-black text-rose-700">{rejectedCount}</div>
                <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Rejected</div>
              </div>

            </div>
          </div>

          {/* Academic Details & Key Dataset Attributes Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Academic CGPA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic CGPA</div>
              <div className="text-2xl font-black text-slate-900 font-mono">CGPA: {currentUser.cgpa} / 10</div>
              <div className="text-[10px] text-emerald-600 font-bold">Official Uploaded Score</div>
            </div>

            {/* 10th & 12th Marks */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">10th / 12th Marks</div>
              <div className="text-sm font-black text-slate-900 pt-1">
                10th: <span className="text-blue-600 font-bold">{currentUser.tenthPercentage ? `${currentUser.tenthPercentage}%` : 'N/A'}</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                12th: <span className="text-indigo-600 font-bold">{currentUser.twelfthPercentage ? `${currentUser.twelfthPercentage}%` : 'N/A'}</span>
              </div>
            </div>

            {/* Current & History Arrears */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Arrears Standing</div>
              <div className="text-sm font-black text-slate-900 pt-1">
                Current: <span className={(currentUser.activeArrears || 0) > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{currentUser.activeArrears || 0}</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                History: <span className="text-slate-600 font-bold">{currentUser.historyArrears || 0}</span>
              </div>
            </div>

            {/* Weekly Assessment Average */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Assessment Avg</span>
                <FileSpreadsheet size={12} className="text-blue-600" />
              </div>
              <div className="text-3xl font-black text-blue-600">
                {assessmentSummary && assessmentSummary.presentCount > 0
                  ? `${assessmentSummary.avgPercentage}%`
                  : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                {assessmentSummary?.presentCount || 0} Faculty-Graded Tests
              </div>
            </div>

          </div>

          {/* STUDENT DATASET DETAILS (SKILLS, CERTIFICATIONS, INTERNSHIPS, PROJECTS & RESUME) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GraduationCap size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Dataset Credentials — {currentUser.name} ({currentUser.registerNumber})</h3>
                  <p className="text-[11px] text-slate-500">Official student record retrieved directly from MongoDB Atlas</p>
                </div>
              </div>
              {currentUser.resumeUrl && (
                <a
                  href={currentUser.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1.5 border border-blue-200"
                >
                  <ExternalLink size={13} />
                  <span>View Resume</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Technical Skills & Programming Languages */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="font-extrabold text-slate-700 flex items-center space-x-1.5">
                  <Wrench size={14} className="text-blue-600" />
                  <span>Technical Skills & Languages</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(currentUser.skills || []).length > 0 ? (
                    currentUser.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No skills specified in dataset.</span>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="font-extrabold text-slate-700 flex items-center space-x-1.5">
                  <Award size={14} className="text-emerald-600" />
                  <span>Certifications</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(currentUser.certifications || []).length > 0 ? (
                    currentUser.certifications.map((cert, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold">
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No certifications specified in dataset.</span>
                  )}
                </div>
              </div>

              {/* Internships */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="font-extrabold text-slate-700 flex items-center space-x-1.5">
                  <Briefcase size={14} className="text-amber-600" />
                  <span>Internship Experience</span>
                </div>
                <ul className="space-y-1 text-slate-700 pt-1 font-medium">
                  {(currentUser.internships || []).length > 0 ? (
                    currentUser.internships.map((intern, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{intern}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No internship records found in dataset.</li>
                  )}
                </ul>
              </div>

              {/* Academic Projects */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="font-extrabold text-slate-700 flex items-center space-x-1.5">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>Academic & Major Projects</span>
                </div>
                <ul className="space-y-1 text-slate-700 pt-1 font-medium">
                  {(currentUser.projects || []).length > 0 ? (
                    currentUser.projects.map((proj, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{proj}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No academic project records found in dataset.</li>
                  )}
                </ul>
              </div>

            </div>
          </div>

          {/* FACULTY UPLOADED ASSESSMENT MARKS BREAKDOWN */}
          {assessmentSummary && assessmentSummary.records.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet size={18} className="text-blue-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Faculty Uploaded Assessment Marks</h3>
                    <p className="text-[11px] text-slate-500">Official class weekly test scores uploaded by your professors</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Average: {assessmentSummary.avgPercentage}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-3">Test Title</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Attendance</th>
                      <th className="py-2.5 px-3 text-right">Marks Obtained</th>
                      <th className="py-2.5 px-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {(assessmentSummary?.records || []).map((rec, idx) => {
                      const pct = rec.maxMarks > 0 ? ((rec.marksObtained / rec.maxMarks) * 100).toFixed(1) : '0';
                      return (
                        <tr key={rec.assessmentId || `rec_${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-800">{rec.assessmentTitle}</td>
                          <td className="py-3 px-3 text-slate-600">{rec.subject}</td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{rec.date}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {rec.status === 'Present' ? `${rec.marksObtained} / ${rec.maxMarks}` : '0 / ' + rec.maxMarks}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-blue-600">
                            {rec.status === 'Present' ? `${pct}%` : '0%'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 6: PUBLISHED PLACEMENT OPPORTUNITIES (ELIGIBLE STUDENTS ONLY) */}
          {publishedDrives.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-indigo-500/30 relative overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-indigo-800/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                      <span>Placement Opportunities</span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-extrabold uppercase">
                        Matched & Verified
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Official recruitment drives published specifically for your academic profile & eligibility
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700">
                  {publishedDrives.length} Drives Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {(publishedDrives || []).map((drive, idx) => {
                  const company = drive.company || {};
                  const hasApplied = (myApplications || []).some(a => a.companyId === company.id);

                  return (
                    <div 
                      key={drive.id || `drive_${idx}`}
                      className="bg-slate-800/90 border border-indigo-400/20 rounded-2xl p-5 hover:border-indigo-400/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
                              {company.name}
                            </span>
                            <h4 className="text-lg font-black text-white group-hover:text-indigo-200 transition-colors">
                              {company.jobRole}
                            </h4>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-xs rounded-xl">
                            {company.salaryPackage}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          <div className="flex items-center space-x-1.5">
                            <MapPin size={14} className="text-indigo-400 shrink-0" />
                            <span className="truncate">{company.location || 'Coimbatore / Hybrid'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={14} className="text-indigo-400 shrink-0" />
                            <span>Deadline: <strong className="text-white">{company.applicationDeadline || 'Open'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-md uppercase">
                            Status: Eligible & Published
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS: VIEW FORM & REGISTER NOW */}
                      <div className="pt-3 border-t border-slate-700/60 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setViewFormDrive(drive)}
                          className="flex-1 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-600"
                        >
                          <Eye size={14} />
                          <span>View Form</span>
                        </button>

                        <a
                          href={drive.registrationFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            handleApplyToCompany(company);
                          }}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer border border-emerald-400/30"
                        >
                          <ExternalLink size={14} />
                          <span>{hasApplied ? 'Registered (Re-open)' : 'Register Now'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Placement Drives */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Company Recruitment Drives</h3>
              <button
                onClick={() => setActiveTab('company-notifications')}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                View Notifications &rarr;
              </button>
            </div>

            {companies.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs italic">
                No company drives available.
              </div>
            ) : (
              <div className="space-y-3">
                {(companies || []).map((c, idx) => {
                  const hasApplied = (myApplications || []).some(a => a.companyId === c.id);
                  const evalData = (companyEligibilityMap || {})[c.id] || { isEligible: true, reasons: [] };
                  return (
                    <div key={c.id || `comp_${idx}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                            {c.jobRole}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {c.salaryPackage}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evalData.isEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {evalData.isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                          <span>Location: <strong>{c.location}</strong></span>
                          <span>Min CGPA: <strong>{c.cgpaCutoff}</strong></span>
                          <span>Deadline: <strong>{c.applicationDeadline || 'N/A'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {hasApplied ? (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                            Applied ✓
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCompany(c);
                                setShowCompanyModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                            >
                              Details
                            </button>

                            <button
                              onClick={() => handleOpenApplicationForm(c)}
                              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-xs flex items-center space-x-1"
                            >
                              <Sparkles size={13} />
                              <span>Fill Application Form</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}


      {/* 2. CAREER READINESS ANALYZER TAB */}
      {activeTab === 'readiness-score' && (
        <div className="relative z-10 animate-fade-in">
          <CareerReadinessAnalyzer student={currentUser} />
        </div>
      )}

      {/* 3. COMPANY NOTIFICATIONS TAB (CORE PAGE) */}
      {activeTab === 'company-notifications' && (() => {
        const eligibleCompanies = companies.filter(co => companyEligibilityMap[co.id]?.isEligible === true);
        const displayedCompanies = notificationFilter === 'eligible' ? eligibleCompanies : companies;

        return (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Company Requirement Notifications</h2>
                <p className="text-xs text-slate-500">
                  Recruitment drive announcements dispatched for student profiles based on eligibility criteria.
                </p>
              </div>

              {/* Notification Filter Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold self-stretch sm:self-auto justify-center">
                <button
                  onClick={() => setNotificationFilter('eligible')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    notificationFilter === 'eligible'
                      ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eligible Notifications ({eligibleCompanies.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    notificationFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Requirements ({companies.length})
                </button>
              </div>
            </div>

            {displayedCompanies.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="text-slate-400 text-xs font-semibold">
                  {notificationFilter === 'eligible'
                    ? 'No company requirement notifications match your current eligibility criteria.'
                    : 'No Company Recruitment Notifications Available.'}
                </div>
                {notificationFilter === 'eligible' && companies.length > 0 && (
                  <button
                    onClick={() => setNotificationFilter('all')}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    View all company requirement announcements &rarr;
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(displayedCompanies || []).map((co, idx) => {
                  const hasApplied = (myApplications || []).some(a => a.companyId === co.id);
                  const evalData = (companyEligibilityMap || {})[co.id] || { isEligible: true, reasons: [] };
                  return (
                    <div key={co.id || `co_${idx}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-black text-slate-900">{co.name}</h3>
                            <p className="text-xs font-bold text-blue-600">{co.jobRole}</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl">
                            {co.salaryPackage}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{co.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                          <div>Location: <strong className="text-slate-800">{co.location}</strong></div>
                          <div>Min CGPA: <strong className="text-slate-800">{co.cgpaCutoff}</strong></div>
                          <div>Deadline: <strong className="text-slate-800">{co.applicationDeadline || 'N/A'}</strong></div>
                          <div>Eligibility: <strong className={evalData.isEligible ? 'text-emerald-700' : 'text-rose-700'}>{evalData.isEligible ? 'Eligible ✓' : 'Ineligible'}</strong></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          evalData.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {evalData.isEligible ? 'Eligible' : 'Not Eligible'}
                        </span>

                        <div className="flex items-center space-x-2">
                          {hasApplied ? (
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                              Applied ✓
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCompany(co);
                                  setShowCompanyModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1"
                              >
                                <span>Details</span>
                              </button>

                              <button
                                onClick={() => handleOpenApplicationForm(co)}
                                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
                              >
                                <Sparkles size={13} />
                                <span>Apply Now</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. APPLIED COMPANIES TAB */}
      {activeTab === 'applied-companies' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">Applied Companies</h2>
            <p className="text-xs text-slate-500">Track company applications submitted by you.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold">Company</th>
                  <th className="p-3.5 font-bold">Role</th>
                  <th className="p-3.5 font-bold">Package</th>
                  <th className="p-3.5 font-bold">Applied Date</th>
                  <th className="p-3.5 font-bold">Application Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(myApplications || []).map((app, idx) => (
                  <tr key={app.id || `app_${idx}`} className="hover:bg-slate-50 transition-all">
                    <td className="p-3.5 font-black text-slate-900">{app.companyName}</td>
                    <td className="p-3.5 text-slate-700 font-semibold">{app.jobRole}</td>
                    <td className="p-3.5 font-bold text-emerald-700">{app.salaryPackage}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{app.appliedDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        app.status === 'Selected' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {myApplications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                      No applications submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPANY DETAILS PAGE / MODAL */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider rounded">
                  Company Requirement Details
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedCompany.name}</h3>
                <p className="text-xs font-bold text-blue-600">{selectedCompany.jobRole} &bull; {selectedCompany.salaryPackage}</p>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Job Description</h4>
                <p className="text-slate-600 leading-relaxed">{selectedCompany.description || 'No detailed description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div><span className="text-slate-400 font-semibold">Location:</span> <strong className="text-slate-800 font-bold block">{selectedCompany.location}</strong></div>
                <div><span className="text-slate-400 font-semibold">Required CGPA:</span> <strong className="text-slate-800 font-bold block">{selectedCompany.cgpaCutoff}</strong></div>
                <div><span className="text-slate-400 font-semibold">Allowed Departments:</span> <strong className="text-slate-800 font-bold block">{selectedCompany.allowedDepartments?.join(', ') || 'All'}</strong></div>
                <div><span className="text-slate-400 font-semibold">Application Deadline:</span> <strong className="text-slate-800 font-bold block">{selectedCompany.applicationDeadline || 'N/A'}</strong></div>
              </div>

              {selectedCompany.selectionProcess && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Selection Process</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedCompany.selectionProcess}</p>
                </div>
              )}

              {selectedCompany.requiredSkills && selectedCompany.requiredSkills.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCompany.requiredSkills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowCompanyModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              
              {myApplications.some(a => a.companyId === selectedCompany.id) ? (
                <span className="px-6 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1">
                  <Check size={16} />
                  <span>Already Applied</span>
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  {selectedCompany.googleFormLink && (
                    <button
                      onClick={() => handleApplyToCompany(selectedCompany)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Google Form</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowCompanyModal(false);
                      handleOpenApplicationForm(selectedCompany);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer flex items-center space-x-2"
                  >
                    <Sparkles size={16} />
                    <span>Fill Application Form</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* View Official Company Recruitment Announcement Modal */}
      {viewFormDrive && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-5xl my-4 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Official Recruitment Announcement — {viewFormDrive.company.name}</h3>
                  <p className="text-xs text-slate-400">{viewFormDrive.company.jobRole} &bull; Published {new Date(viewFormDrive.publishedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => setViewFormDrive(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 flex justify-center">
              <GenerateForm
                company={viewFormDrive.company}
                student={currentUser}
                config={viewFormDrive.company.generatedFormConfig}
                onClose={() => setViewFormDrive(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Student Application Form Modal */}
      {selectedCompanyForApp && (
        <StudentApplicationFormModal
          company={selectedCompanyForApp}
          student={currentUser}
          eligibility={companyEligibilityMap[selectedCompanyForApp.id] || { isEligible: true, reasons: [] }}
          existingApplication={myApplications.find(a => a.companyId === selectedCompanyForApp.id)}
          isOpen={showApplicationFormModal}
          onClose={() => {
            setShowApplicationFormModal(false);
            setSelectedCompanyForApp(null);
          }}
          onApplicationSubmitted={() => {
            loadData();
          }}
          onAddNotification={onAddNotification}
        />
      )}

      {/* Automatic Company Recruitment Announcement Popup Modal */}
      {showAnnouncementPopup && companies.filter(c => c.status === 'Active' || !c.status).length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto transform transition-all animate-scale-up">
            
            {/* Modal Header Banner */}
            {(() => {
              const activeAnnouncements = companies.filter(c => c.status === 'Active' || !c.status);
              const currentAnn = activeAnnouncements[currentAnnouncementIndex] || activeAnnouncements[0];
              if (!currentAnn) return null;
              const eligibilityInfo = companyEligibilityMap[currentAnn.id] || { isEligible: true, reasons: [] };

              const acknowledgeCurrent = () => {
                try {
                  const ackKey = `ack_announcements_${currentUser.id}`;
                  const saved = localStorage.getItem(ackKey);
                  const list: string[] = saved ? JSON.parse(saved) : [];
                  if (!list.includes(currentAnn.id)) {
                    list.push(currentAnn.id);
                    localStorage.setItem(ackKey, JSON.stringify(list));
                  }
                } catch (e) {}
              };

              const handleCheckEmailClick = () => {
                acknowledgeCurrent();
                setShowAnnouncementPopup(false);
                onAddNotification(
                  'Check Email Inbox',
                  'Please check your inbox for the recruitment email. If you do not see it, please check your Spam or Promotions folder.',
                  'info'
                );
                window.open('https://mail.google.com', '_blank');
              };

              const handleViewDetailsClick = () => {
                acknowledgeCurrent();
                setSelectedCompany(currentAnn);
                setShowCompanyModal(true);
                setShowAnnouncementPopup(false);
              };

              const handleCloseClick = () => {
                acknowledgeCurrent();
                setShowAnnouncementPopup(false);
              };

              return (
                <>
                  <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center space-x-3.5 z-10">
                      <div className="p-3 bg-white/15 backdrop-blur-md text-amber-300 rounded-2xl border border-white/20 shadow-md">
                        <Megaphone size={24} className="animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">
                            📢 New Company Recruitment Notification
                          </span>
                          {activeAnnouncements.length > 1 && (
                            <span className="text-[11px] font-semibold text-blue-100/90">
                              {currentAnnouncementIndex + 1} of {activeAnnouncements.length}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black tracking-tight mt-1 text-white">
                          Company Recruitment Announcement
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 z-10">
                      {activeAnnouncements.length > 1 && (
                        <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl border border-white/15">
                          <button
                            onClick={() => setCurrentAnnouncementIndex(prev => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1))}
                            className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            title="Previous Announcement"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() => setCurrentAnnouncementIndex(prev => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0))}
                            className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            title="Next Announcement"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={handleCloseClick}
                        className="p-2 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
                        title="Close popup"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    
                    {/* Notice Message Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs font-semibold text-blue-900 leading-relaxed shadow-xs flex items-start space-x-3">
                      <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 font-bold text-xs mb-0.5">Recruitment Opportunity Available</strong>
                        A new company recruitment opportunity is available. Please check your email for complete details, eligibility criteria, and the application link.
                      </div>
                    </div>

                    {/* Company & Role Overview Banner */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Building2 size={20} className="text-blue-600" />
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">{currentAnn.name}</h4>
                        </div>
                        <p className="text-xs font-bold text-blue-600 flex items-center">
                          <Briefcase size={14} className="mr-1.5" />
                          {currentAnn.jobRole}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200/60 shadow-xs">
                          💵 Package: {currentAnn.salaryPackage}
                        </span>
                        {eligibilityInfo.isEligible ? (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/60 flex items-center">
                            <CheckCircle2 size={14} className="mr-1 text-blue-600" /> Eligible
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200/60 flex items-center">
                            <AlertCircle size={14} className="mr-1 text-rose-600" /> Not Eligible
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requirements & Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Eligibility Criteria Card */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                          <GraduationCap size={16} className="mr-1.5 text-indigo-600" /> Eligibility Summary
                        </h5>
                        <ul className="text-xs space-y-2 text-slate-700">
                          <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 font-medium">Minimum CGPA:</span>
                            <strong className="font-bold text-slate-900">{currentAnn.cgpaCutoff} CGPA</strong>
                          </li>
                          <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 font-medium">Max Active Arrears:</span>
                            <strong className="font-bold text-slate-900">{currentAnn.maxActiveArrears ?? 0} Backlogs</strong>
                          </li>
                          <li className="flex items-start justify-between">
                            <span className="text-slate-500 font-medium flex-shrink-0 mr-2">Allowed Depts:</span>
                            <strong className="font-bold text-slate-900 text-right">
                              {currentAnn.allowedDepartments?.join(', ') || 'All Departments'}
                            </strong>
                          </li>
                        </ul>
                      </div>

                      {/* Important Requirements Card */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                          <Sparkles size={16} className="mr-1.5 text-amber-500" /> Key Requirements
                        </h5>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px] font-medium">Required Technical Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentAnn.requiredSkills && currentAnn.requiredSkills.length > 0 ? (
                                currentAnn.requiredSkills.map((sk, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[10.5px] rounded-lg border border-slate-200/60">
                                    {sk}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 italic">As per job requirement</span>
                              )}
                            </div>
                          </div>
                          {currentAnn.description && (
                            <div className="border-t border-slate-100 pt-2">
                              <span className="text-slate-500 block text-[11px] font-medium">Guidelines & Description:</span>
                              <p className="text-slate-700 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                                {currentAnn.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email Dispatch Reminder */}
                    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-1">
                      <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                        <Mail size={16} className="text-amber-600 shrink-0" />
                        <span>Email Sent Reminder</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed pl-6">
                        A recruitment email has been sent to your registered email address (<strong>{currentUser.email}</strong>). Please check your inbox to view the complete company details and application link.
                      </p>
                    </div>

                    {/* Last Date to Apply */}
                    <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar size={20} className="text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Application Deadline</span>
                          <strong className="text-xs font-black text-amber-300">
                            {currentAnn.applicationDeadline || 'As per recruitment schedule'}
                          </strong>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30">
                        Official Drive
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCloseClick}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-center"
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckEmailClick}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 border border-emerald-400/30"
                      >
                        <Mail size={16} />
                        <span>Check Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleViewDetailsClick}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <Eye size={16} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
