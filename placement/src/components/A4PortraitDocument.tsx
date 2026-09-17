import React, { useRef } from 'react';
import { 
  Building2, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Briefcase, 
  Clock, 
  Calendar, 
  FileText, 
  UploadCloud, 
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Company, Student, CustomFormField, GeneratedFormConfig } from '../types';
import AdithyaLogo from './AdithyaLogo';
import { exportPlacementFormToPDF } from '../utils/pdfExport';

interface A4PortraitDocumentProps {
  company: Company;
  student?: Student;
  config?: GeneratedFormConfig;
  mode: 'faculty-preview' | 'student-apply' | 'submitted-view';
  onSubmit?: (e: React.FormEvent) => void;
  resumeUrl?: string;
  setResumeUrl?: (val: string) => void;
  skillsText?: string;
  setSkillsText?: (val: string) => void;
  certsText?: string;
  setCertsText?: (val: string) => void;
  customAnswers?: Record<string, string>;
  onCustomAnswerChange?: (fieldId: string, val: string) => void;
  submitting?: boolean;
  isEligible?: boolean;
  eligibilityReasons?: string[];
}

export default function A4PortraitDocument({
  company,
  student,
  config: providedConfig,
  mode,
  onSubmit,
  resumeUrl = '',
  setResumeUrl,
  skillsText = '',
  setSkillsText,
  certsText = '',
  setCertsText,
  customAnswers = {},
  onCustomAnswerChange,
  submitting = false,
  isEligible = true,
  eligibilityReasons = []
}: A4PortraitDocumentProps) {

  const printRef = useRef<HTMLDivElement>(null);

  const config: GeneratedFormConfig = providedConfig || company.generatedFormConfig || {
    isGenerated: true,
    isPublished: true,
    customInstructions: company.additionalInstructions || 'Verify your profile information before submitting application.',
    allowResumeUpload: true,
    collectCertifications: true,
    collectSkills: true,
    collectBacklogsDetail: true,
    customFields: [
      {
        id: 'cf_1',
        label: 'Why are you interested in joining ' + company.name + '?',
        type: 'textarea',
        required: true,
        placeholder: 'State your motivation and career goals...'
      }
    ]
  };

  const handlePrint = () => {
    exportPlacementFormToPDF(company, config);
  };

  // Sample fallback student data for faculty preview mode
  const previewStudent: Student = student || ({
    id: 'sample_std',
    name: 'JOHN DOE (APPLICANT PREVIEW)',
    registerNumber: '710122104088',
    department: 'Computer Science & Engineering',
    year: 4,
    cgpa: 8.5,
    activeArrears: 0,
    email: 'john.doe@college.edu',
    phone: '+91 98765 43210',
    skills: company.requiredSkills || ['Java', 'React', 'Python', 'Data Structures'],
    certifications: company.requiredCertifications || ['AWS Certified Cloud Practitioner'],
    section: 'A'
  } as unknown as Student);

  const currentStudent = student || previewStudent;
  const refNo = `REF/AIT/TPC/${company.id ? company.id.slice(-6).toUpperCase() : '2026'}/4920`;
  const batchYear = company.year ? `${parseInt(company.year) - 4} – ${company.year}` : '2022 – 2026';
  const generatedDateTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      
      {/* Top Printable Bar */}
      <div className="w-full max-w-[210mm] flex justify-between items-center bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md no-print border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 bg-blue-600 text-[10px] font-black tracking-wider uppercase rounded-full">
            A4 Portrait Layout
          </span>
          <span className="text-xs text-slate-300 font-semibold">
            {mode === 'faculty-preview' ? 'Official Faculty Preview & Printable Form' : 'Student Placement Application Sheet'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border border-blue-400/30"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-white/20"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Sheet Document Container */}
      <div 
        ref={printRef}
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 border-2 border-slate-900 shadow-2xl p-6 sm:p-10 rounded-sm font-sans space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:text-black"
        id="printable-a4-form"
      >
        
        {/* INSTITUTION & PLACEMENT CELL OFFICIAL HEADER */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5 relative">
          
          <div className="flex justify-between items-center border-b border-slate-300 pb-2 mb-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            <div>CENTRAL PLACEMENT & TRAINING CELL</div>
            <div className="font-extrabold text-slate-900">ANNOUNCEMENT REF: {refNo}</div>
            <div>ACADEMIC BATCH: {batchYear}</div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <AdithyaLogo size="sm" className="h-16 mx-auto mb-1" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                ADITHYA INSTITUTE OF TECHNOLOGY
              </h1>
              <p className="text-xs text-orange-600 font-extrabold tracking-widest uppercase">
                Central Placement & Training Cell
              </p>
              <p className="text-[10px] text-slate-700 font-bold tracking-wide uppercase mt-0.5">
                Directorate of Training & Placement Cell &bull; Official Campus Recruitment Guidelines & Announcement
              </p>
            </div>
          </div>

          <div className="mt-2 bg-slate-900 text-white py-2 px-4 rounded-xs text-center text-xs sm:text-sm font-black uppercase tracking-widest">
            COMPANY ANNOUNCEMENTS & RECRUITMENT GUIDELINES
          </div>
        </div>

        {/* SECTION 1: RECRUITMENT DRIVE OVERVIEW */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider">
            <span>Section 1 – Recruitment Drive Overview</span>
          </div>

          <div className="border border-slate-400 text-xs divide-y divide-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
              <div className="p-2.5 bg-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-600 text-[10px] uppercase">Company Name:</span>
                <strong className="text-slate-900 text-sm font-black">{company.name}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-600 text-[10px] uppercase">Job Role / Position:</span>
                <strong className="text-blue-900 font-extrabold text-sm">{company.jobRole}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 text-[11px]">
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Salary / CTC</span>
                <strong className="text-slate-900 font-bold">{company.salaryPackage}</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Job Location</span>
                <strong className="text-slate-900 font-bold">{company.location || 'Pan India'}</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Employment Type</span>
                <strong className="text-slate-900 font-bold">{company.employmentType || 'Full-Time'}</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Work Mode</span>
                <strong className="text-slate-900 font-bold">{company.workMode || 'Onsite'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-[11px]">
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Vacancies</span>
                <strong className="text-slate-900">{company.vacancies || 'As Per Requirement'}</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Recruitment Drive Date</span>
                <strong className="text-slate-900">{company.recruitmentDate || 'To Be Announced'}</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Application Deadline</span>
                <strong className="text-rose-800 font-bold">{company.applicationDeadline || 'Open'}</strong>
              </div>
            </div>

            {company.description && (
              <div className="p-2.5 text-[11px] text-slate-700 bg-slate-50/50">
                <strong className="font-bold text-slate-900 text-[10px] uppercase block mb-0.5">Additional Notes / Job Description:</strong>
                <p className="leading-relaxed text-slate-800">{company.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: STUDENT ELIGIBILITY */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider">
            <span>Section 2 – Student Eligibility</span>
          </div>

          <div className="border border-slate-400 text-xs divide-y divide-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 text-[11px]">
              <div className="p-2.5 bg-slate-50/80">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Minimum CGPA</span>
                <strong className="text-slate-900 font-black text-xs">{company.cgpaCutoff} CGPA</strong>
              </div>
              <div className="p-2.5 bg-slate-50/80">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Max Arrears</span>
                <strong className="text-slate-900 font-black text-xs">{company.maxActiveArrears ?? 0} Backlogs</strong>
              </div>
              <div className="p-2.5 bg-slate-50/80">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Year of Study</span>
                <strong className="text-slate-900 font-black text-xs">{company.year || '4th Year (2026 Batch)'}</strong>
              </div>
              <div className="p-2.5 bg-slate-50/80">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Internship Requirement</span>
                <strong className="text-slate-900 font-black text-xs">{company.internshipRequired || 'Optional'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-[11px]">
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Eligible Departments</span>
                <strong className="text-slate-900">{company.allowedDepartments?.join(', ')}</strong>
              </div>
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Required Technical Skills</span>
                <strong className="text-slate-900">{company.requiredSkills?.join(', ')}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-[11px]">
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Soft Skills</span>
                <strong className="text-slate-900">Professional Communication, Problem Solving, Analytical Thinking, Teamwork</strong>
              </div>
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Programming Languages</span>
                <strong className="text-slate-900">
                  {company.requiredSkills?.filter(s => ['Java', 'Python', 'C++', 'JavaScript', 'C', 'SQL', 'TypeScript'].some(p => s.toLowerCase().includes(p.toLowerCase()))).join(', ') || 'Java, Python, C++, SQL'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-[11px]">
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Preferred Certifications</span>
                <strong className="text-slate-900">
                  {company.requiredCertifications && company.requiredCertifications.length > 0 
                    ? company.requiredCertifications.join(', ') 
                    : 'NPTEL, AWS, Azure, Google Cloud or Industry Recognized Certifications'}
                </strong>
              </div>
              <div className="p-2.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Preferred Projects</span>
                <strong className="text-slate-900">
                  {company.requiredProjects ? `${company.requiredProjects}+ Major / Capstone Academic Projects` : '1+ Major Web / Software Academic Project'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: RECRUITMENT PROCESS */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider">
            <span>Section 3 – Recruitment Process</span>
          </div>

          <div className="border border-slate-400 text-xs divide-y divide-slate-300">
            <div className="p-2.5 bg-slate-50/80">
              <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Recruitment Stages:</span>
              <div className="flex flex-wrap gap-2 text-slate-900 font-bold text-[11px]">
                <span>1. Online Test</span> &bull;
                <span>2. Aptitude Test</span> &bull;
                <span>3. Coding Round</span> &bull;
                <span>4. Technical Interview</span> &bull;
                <span>5. HR Interview</span> &bull;
                <span>6. Final Selection</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-300 text-[11px]">
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Online Test</span>
                <strong className="text-slate-900">Aptitude & Technical MCQ</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Aptitude Test</span>
                <strong className="text-slate-900">Quantitative & Verbal</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Coding Round</span>
                <strong className="text-slate-900">Problem Solving & Algorithms</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 text-[11px]">
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Technical Interview</span>
                <strong className="text-slate-900">Domain & Project Review</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">HR Interview</span>
                <strong className="text-slate-900">Personality & Cultural Fit</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Offer Release Date</span>
                <strong className="text-slate-900">Within 7 Days of Drive</strong>
              </div>
              <div className="p-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Joining Date</span>
                <strong className="text-slate-900">Post Graduation (June 2026)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: IMPORTANT INSTRUCTIONS */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider">
            <span>Section 4 – Important Instructions</span>
          </div>

          <div className="border border-slate-400 p-3 bg-slate-50/30 text-xs">
            <ol className="list-decimal pl-5 space-y-1 text-slate-800 font-medium">
              <li>Carry your official College ID Card at all times during the recruitment drive.</li>
              <li>Bring an updated hard copy Resume and necessary academic credentials.</li>
              <li>Wear formal dress code strictly as mandated by institutional placement guidelines.</li>
              <li>Report 30 minutes before the scheduled time at the campus venue.</li>
              <li>Mobile phones and unauthorized electronic gadgets are strictly prohibited during tests.</li>
              <li>Follow all instructions issued by the Training & Placement Cell implicitly.</li>
            </ol>
          </div>
        </div>

        {/* STUDENT APPLICATION QUESTIONNAIRE (IF STUDENT APPLYING) */}
        {mode === 'student-apply' && (
          <form onSubmit={onSubmit} className="space-y-4 font-sans no-print-form">
            <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1 rounded-xs text-xs font-bold uppercase tracking-wider">
              <span>Candidate Particulars & Questionnaire</span>
            </div>

            <div className="border border-slate-400 text-xs p-4 space-y-4 bg-slate-50/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pb-2 border-b border-slate-300">
                <div>Candidate Name: <strong className="uppercase font-black text-slate-900">{currentStudent.name}</strong></div>
                <div>Reg No: <strong className="font-mono text-slate-900">{currentStudent.registerNumber}</strong></div>
                <div>Department: <strong>{currentStudent.department}</strong></div>
                <div>CGPA: <strong className="text-blue-900">{currentStudent.cgpa} CGPA</strong></div>
              </div>

              {config.allowResumeUpload && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    Resume / CV Google Drive URL <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={resumeUrl}
                    onChange={e => setResumeUrl?.(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              )}

              {config.customFields?.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block font-bold text-slate-900">
                    {field.label} {field.required && <span className="text-rose-600">*</span>}
                  </label>

                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      required={field.required}
                      placeholder={field.placeholder || 'Enter response...'}
                      value={customAnswers[field.id] || ''}
                      onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder || 'Enter text...'}
                      value={customAnswers[field.id] || ''}
                      onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      required={field.required}
                      placeholder={field.placeholder || '0'}
                      value={customAnswers[field.id] || ''}
                      onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      required={field.required}
                      value={customAnswers[field.id] || ''}
                      onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      required={field.required}
                      value={customAnswers[field.id] || ''}
                      onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    >
                      <option value="">Select option...</option>
                      {field.options?.map((opt, oi) => (
                        <option key={oi} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {field.options?.map((opt, oi) => (
                        <label key={oi} className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name={`field_${field.id}`}
                            required={field.required}
                            value={opt}
                            checked={customAnswers[field.id] === opt}
                            onChange={e => onCustomAnswerChange?.(field.id, e.target.value)}
                            className="text-slate-900 focus:ring-slate-900"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {field.options?.map((opt, oi) => {
                        const currentSelections = (customAnswers[field.id] || '').split(', ').filter(Boolean);
                        const isChecked = currentSelections.includes(opt);
                        return (
                          <label key={oi} className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                let updated: string[];
                                if (e.target.checked) {
                                  updated = [...currentSelections, opt];
                                } else {
                                  updated = currentSelections.filter(x => x !== opt);
                                }
                                onCustomAnswerChange?.(field.id, updated.join(', '));
                              }}
                              className="rounded text-slate-900 focus:ring-slate-900"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs rounded shadow-md cursor-pointer uppercase tracking-wider transition-all"
                >
                  {submitting ? 'Submitting Application Sheet...' : 'Submit Official Application'}
                </button>
              </div>

            </div>
          </form>
        )}

        {/* FOOTER & OFFICIAL SIGNATURES */}
        <div className="pt-6 border-t-2 border-slate-900 font-sans text-xs space-y-6">
          <div className="grid grid-cols-3 gap-4 items-end text-center">
            
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase">PREPARED BY</div>
              <div className="font-bold text-slate-900 pt-8 border-t border-slate-900">
                Placement Officer<br />
                <span className="text-[10px] font-normal text-slate-600">Training & Placement Cell</span>
              </div>
            </div>

            <div>
              <div className="border-2 border-dashed border-slate-800 p-2 text-center rounded bg-slate-50">
                <p className="text-[9px] font-extrabold text-slate-800 uppercase tracking-tight">
                  OFFICIAL SEAL & STAMP<br />ADITHYA INSTITUTE OF TECHNOLOGY
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase">VERIFIED & APPROVED BY</div>
              <div className="font-bold text-slate-900 pt-8 border-t border-slate-900">
                Head — Placement Cell<br />
                <span className="text-[10px] font-normal text-slate-600">Adithya Institute of Technology</span>
              </div>
            </div>

          </div>

          <div className="text-center text-[9px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
            Generated on: {generatedDateTime} &bull; Placement Readiness Analyzer Portal &bull; Adithya Institute of Technology
          </div>
        </div>

      </div>

    </div>
  );
}
