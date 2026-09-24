import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Users, 
  Mail, 
  FileText, 
  ExternalLink, 
  Loader2,
  Check,
  ShieldCheck,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Company, Student } from '../types';
import { getStudents } from '../api/students';
import { getEligibleStudentsForCompany } from '../api/placement';
import { publishPlacementDriveAPI, PlacementDriveRecord } from '../api/placementDrives';

interface PublishPlacementDriveModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  pdfDataUrl?: string;
  onSuccess?: (drive: PlacementDriveRecord) => void;
}

export default function PublishPlacementDriveModal({
  company,
  isOpen,
  onClose,
  pdfDataUrl,
  onSuccess
}: PublishPlacementDriveModalProps) {
  if (!isOpen || !company) return null;

  const [registrationFormUrl, setRegistrationFormUrl] = useState<string>(
    company.googleFormLink || (company as any).registrationFormUrl || 'https://forms.google.com/adithya-placement-drive'
  );

  const [loadingEligible, setLoadingEligible] = useState<boolean>(true);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [ineligibleStudents, setIneligibleStudents] = useState<{ student: Student; reason: any }[]>([]);

  const [publishing, setPublishing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [publishResult, setPublishResult] = useState<PlacementDriveRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoadingEligible(true);
      try {
        const students = await getStudents();
        setAllStudents(students);

        const { eligibleStudents: matched, ineligibleStudents: unMatched } = await getEligibleStudentsForCompany(company);
        setEligibleStudents(matched);
        setIneligibleStudents(unMatched);
      } catch (err) {
        console.error('Failed to load eligible students for publish', err);
      } finally {
        setLoadingEligible(false);
      }
    }
    loadData();
  }, [company]);

  const handlePublish = async () => {
    if (!registrationFormUrl.trim()) {
      setErrorMessage('Please enter a valid Google Form or Google Sheet registration link.');
      return;
    }

    setErrorMessage(null);
    setPublishing(true);
    setCurrentStep(1); // Step 1: Matching students

    try {
      setTimeout(() => setCurrentStep(2), 600); // Step 2: Generating eligible student list
      setTimeout(() => setCurrentStep(3), 1200); // Step 3: Sending Emails with attached PDF

      const res = await publishPlacementDriveAPI({
        company,
        registrationFormUrl: registrationFormUrl.trim(),
        pdfDataUrl,
        eligibleStudents,
        allStudents,
        publisherName: 'Placement Officer'
      });

      setCurrentStep(4); // Step 4: Save in MongoDB Atlas

      setTimeout(() => {
        setPublishing(false);
        setPublishResult(res.drive);
        if (onSuccess) onSuccess(res.drive);
      }, 1000);

    } catch (err: any) {
      console.error('Error during placement drive publication:', err);
      setErrorMessage(err?.message || 'Failed to publish placement drive.');
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 animate-fade-in overflow-hidden w-screen h-screen">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        
        {/* Full Big Screen Page Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-extrabold mr-2 border border-white/20"
              title="Back to Requirements"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Requirements</span>
            </button>

            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-300">
              <Send size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Publish Placement Drive</h2>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-extrabold uppercase">
                  Official Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {company.name} &bull; {company.jobRole} ({company.salaryPackage})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* PUBLISHED SUCCESS STATE */}
          {publishResult ? (
            <div className="space-y-6 text-slate-900 animate-fade-in">
              <div className="p-6 bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  Placement Drive Published Successfully!
                </h3>
                <p className="text-xs text-emerald-800 max-w-lg mx-auto font-medium">
                  The official Company Recruitment Announcement PDF and application link have been automatically dispatched to all eligible student email inboxes via Resend.
                </p>
              </div>

              {/* STATS SUMMARY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">Total Students Evaluated</span>
                  <p className="text-2xl font-black text-slate-900">{publishResult.totalStudentsCount}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-blue-700">Eligible Students</span>
                  <p className="text-2xl font-black text-blue-900">{publishResult.eligibleStudentsCount}</p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700">Emails Sent</span>
                  <p className="text-2xl font-black text-emerald-900">{publishResult.emailSentCount}</p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-700">Failed / Pending</span>
                  <p className="text-2xl font-black text-amber-900">{publishResult.emailFailedCount}</p>
                </div>
              </div>

              {/* DETAILS BOX */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 font-bold text-slate-700">
                  <span>Published Date & Time</span>
                  <span className="text-slate-900 font-extrabold">
                    {new Date(publishResult.publishedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 font-bold text-slate-700">
                  <span>Delivery Status</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-extrabold">
                    {publishResult.deliveryStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-slate-700">
                  <span>Registration Link</span>
                  <a 
                    href={publishResult.registrationFormUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                  >
                    <span>{publishResult.registrationFormUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* ELIGIBLE STUDENTS TABLE LOG */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Eligible Students Email Dispatch Log
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] uppercase font-extrabold text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Reg Number</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">CGPA</th>
                        <th className="p-2.5">Email Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {publishResult.studentsList.map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{log.name}</td>
                          <td className="p-2.5 font-mono text-slate-600">{log.registerNumber}</td>
                          <td className="p-2.5">{log.department}</td>
                          <td className="p-2.5 font-bold text-blue-900">{log.cgpa}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] inline-flex items-center space-x-1">
                              <Check size={10} />
                              <span>{log.emailStatus}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* PRE-PUBLISH WORKFLOW FORM */
            <div className="space-y-6 text-slate-900">

              {/* STEP 5 REQUIREMENT: Google Form / Google Sheet Link Input */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <ExternalLink size={16} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-900 tracking-wider block">
                      Registration Form Link (Google Form / Google Sheet URL)
                    </label>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Paste the Google Form or Google Sheet URL where students will submit their responses. This link will be embedded in all dispatched emails and student dashboard portals.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={registrationFormUrl}
                    onChange={(e) => setRegistrationFormUrl(e.target.value)}
                    placeholder="https://forms.google.com/... or https://docs.google.com/..."
                    className="w-full pl-4 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-900 shadow-xs"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400">
                    <ExternalLink size={16} />
                  </div>
                </div>
              </div>

              {/* STEP 1 & 2: AUTOMATIC ELIGIBILITY MATCHING SUMMARY */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center space-x-2">
                    <Users size={16} className="text-blue-600" />
                    <span>Eligible Student List ({eligibleStudents.length} Students Matched)</span>
                  </h3>
                  {loadingEligible && (
                    <span className="text-xs text-blue-600 font-bold flex items-center space-x-1">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Evaluating criteria...</span>
                    </span>
                  )}
                </div>

                {/* ELIGIBILITY CRITERIA BADGES SUMMARY */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex flex-wrap gap-2 text-slate-700">
                  <span className="font-bold text-slate-900 uppercase text-[10px] self-center mr-1">Applied Cutoffs:</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold">
                    CGPA: <strong className="text-blue-900 font-extrabold">{company.cgpaCutoff}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold">
                    Max Arrears: <strong className="font-extrabold">{company.maxActiveArrears ?? 0}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold">
                    Batch: <strong className="font-extrabold">{company.year || '2026'}</strong>
                  </span>
                  {company.requiredSkills && company.requiredSkills.length > 0 && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold">
                      Skills: <strong className="text-indigo-900">{company.requiredSkills.join(', ')}</strong>
                    </span>
                  )}
                </div>

                {/* TABLE OF ELIGIBLE STUDENTS */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] uppercase font-extrabold text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Reg Number</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">CGPA</th>
                        <th className="p-2.5">Skills</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {eligibleStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 font-bold text-xs">
                            No students currently match the published eligibility criteria.
                          </td>
                        </tr>
                      ) : (
                        eligibleStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                            <td className="p-2.5 font-mono text-slate-600 text-[11px]">{s.registerNumber}</td>
                            <td className="p-2.5 font-mono text-slate-600 text-[11px]">{s.email}</td>
                            <td className="p-2.5">{s.department}</td>
                            <td className="p-2.5 font-bold text-blue-900">{s.cgpa}</td>
                            <td className="p-2.5 text-[11px] text-slate-600 max-w-[140px] truncate">{s.skills?.join(', ') || 'N/A'}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold rounded-md text-[10px]">
                                Eligible
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUTOMATIC EMAIL STEPS PROGRESS INDICATOR */}
              {publishing && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fade-in shadow-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Publishing Placement Drive in Progress...</span>
                  </div>

                  <div className="space-y-2 text-xs font-medium">
                    <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={14} />
                      <span>STEP 1: Matching students against company eligibility requirements in MongoDB</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={14} />
                      <span>STEP 2: Generating verified eligible student roster ({eligibleStudents.length} Candidates)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={14} />
                      <span>STEP 3: Dispatching Nodemailer emails with Placement Form PDF attachment</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${currentStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      <CheckCircle2 size={14} />
                      <span>STEP 4: Saving PlacementDrive collection record in MongoDB Atlas</span>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishing}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || loadingEligible || eligibleStudents.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50 border border-blue-400/30"
                >
                  {publishing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Publishing & Sending Emails...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Publish Drive & Send Emails ({eligibleStudents.length} Students)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
