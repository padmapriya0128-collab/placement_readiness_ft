import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Briefcase, 
  MapPin, 
  Clock, 
  Send, 
  AlertCircle, 
  FileText, 
  UploadCloud, 
  Sparkles,
  ShieldAlert,
  Award,
  Check
} from 'lucide-react';
import { Student, Company, StudentApplication, GeneratedFormConfig } from '../types';
import { saveStudentApplication } from '../api/placement';
import A4PortraitDocument from './A4PortraitDocument';

interface StudentApplicationFormModalProps {
  company: Company;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  eligibility: { isEligible: boolean; reasons: string[] };
  existingApplication?: StudentApplication | null;
  onApplicationSubmitted: () => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function StudentApplicationFormModal({
  company,
  student,
  isOpen,
  onClose,
  eligibility,
  existingApplication,
  onApplicationSubmitted,
  onAddNotification
}: StudentApplicationFormModalProps) {
  if (!isOpen || !company || !student) return null;

  const config: GeneratedFormConfig = company.generatedFormConfig || {
    isGenerated: true,
    isPublished: true,
    customInstructions: company.additionalInstructions || 'Verify your profile information before submitting application.',
    allowResumeUpload: true,
    collectCertifications: true,
    collectSkills: true,
    collectBacklogsDetail: true,
    customFields: []
  };

  const [resumeUrl, setResumeUrl] = useState(student.resumeUrl || '');
  const [skillsText, setSkillsText] = useState((student.skills || []).join(', '));
  const [certsText, setCertsText] = useState((student.certifications || []).join(', '));
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleCustomAnswerChange = (fieldId: string, val: string) => {
    setCustomAnswers(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Check custom required fields
    if (config.customFields && config.customFields.length > 0) {
      for (const field of config.customFields) {
        if (field.required && (!customAnswers[field.id] || !customAnswers[field.id].trim())) {
          setValidationError(`Please answer the required question: "${field.label}"`);
          return;
        }
      }
    }

    if (config.allowResumeUpload && !resumeUrl.trim()) {
      setValidationError('Please provide a link to your resume / CV document.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      saveStudentApplication({
        studentId: student.id,
        studentName: student.name,
        registerNumber: student.registerNumber,
        department: student.department,
        year: student.year,
        cgpa: student.cgpa,
        companyId: company.id,
        companyName: company.name,
        jobRole: company.jobRole,
        salaryPackage: company.salaryPackage,
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        googleFormSubmitted: true,
        email: student.email,
        phone: student.phone,
        backlogs: student.activeArrears || 0,
        passingYear: String(student.year || '2026'),
        degree: 'B.E / B.Tech',
        resumeUrl,
        skillsSubmitted: skillsText.split(',').map(s => s.trim()).filter(Boolean),
        certificationsSubmitted: certsText.split(',').map(c => c.trim()).filter(Boolean),
        customAnswers
      });

      onAddNotification(
        `Application Submitted: ${company.name}`,
        `Your application for ${company.jobRole} (${company.salaryPackage}) has been registered successfully.`,
        'success'
      );

      setSubmitting(false);
      onApplicationSubmitted();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-300">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{company.name}</h2>
              <p className="text-xs text-slate-300">{company.jobRole} &bull; {company.salaryPackage}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* CASE 1: ALREADY APPLIED */}
          {existingApplication ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl w-max mx-auto shadow-md">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-emerald-950">Application Already Submitted!</h3>
                <p className="text-xs text-emerald-800 mt-1">
                  You submitted your application for <strong>{company.jobRole}</strong> on <strong>{existingApplication.appliedDate}</strong>.
                </p>
              </div>

              <div className="p-4 bg-white/80 rounded-2xl border border-emerald-200 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Application Status:</span>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-black ${
                    existingApplication.status === 'Selected' ? 'bg-emerald-100 text-emerald-800' :
                    existingApplication.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                    existingApplication.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {existingApplication.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Registered Register No:</span>
                  <span className="font-mono font-bold text-slate-900">{existingApplication.registerNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Registered CGPA:</span>
                  <span className="font-bold text-slate-900">{existingApplication.cgpa} CGPA</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Close Application Window
              </button>
            </div>
          ) : !eligibility.isEligible ? (
            /* CASE 2: NOT ELIGIBLE */
            <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center space-x-3 text-rose-900">
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-950">You are not eligible to apply for this recruitment based on the company's eligibility criteria.</h3>
                  <p className="text-xs text-rose-700 mt-0.5">Your student profile does not satisfy all required conditions for this drive.</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-rose-200 space-y-2 text-xs">
                <strong className="block text-slate-900 font-bold">Unmet Requirements:</strong>
                <ul className="space-y-1.5 text-rose-800">
                  {eligibility.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <XCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>If you believe your profile data or CGPA is inaccurate, please contact Placement Faculty.</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* CASE 3: ELIGIBLE & APPLYING - A4 PORTRAIT FORMAT */
            <div className="space-y-4 animate-fade-in flex flex-col items-center">
              
              {/* Verified Eligibility Badge */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-extrabold w-full max-w-[210mm]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>You are Fully Eligible to Apply for this Drive!</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] shrink-0">
                  Verified Match
                </span>
              </div>

              {/* Error Banner */}
              {validationError && (
                <div className="p-3 bg-rose-100 text-rose-900 border border-rose-200 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-shake w-full max-w-[210mm]">
                  <XCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* A4 Portrait Official Document Component */}
              <A4PortraitDocument
                company={company}
                student={student}
                config={config}
                mode="student-apply"
                onSubmit={handleSubmit}
                resumeUrl={resumeUrl}
                setResumeUrl={setResumeUrl}
                skillsText={skillsText}
                setSkillsText={setSkillsText}
                certsText={certsText}
                setCertsText={setCertsText}
                customAnswers={customAnswers}
                onCustomAnswerChange={handleCustomAnswerChange}
                submitting={submitting}
                isEligible={true}
              />

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
