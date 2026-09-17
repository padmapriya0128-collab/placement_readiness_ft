import React, { useState } from 'react';
import { Download, Printer, ShieldCheck, Building2, Calendar, MapPin, Briefcase, FileText, Send, Save } from 'lucide-react';
import { Company, Student, GeneratedFormConfig, CustomFormField } from '../types';
import AdithyaLogo from './AdithyaLogo';
import { exportPlacementFormToPDF } from '../utils/pdfExport';
import PublishPlacementDriveModal from './PublishPlacementDriveModal';
import { PlacementDriveRecord } from '../api/placementDrives';

interface GenerateFormProps {
  company: Company;
  student?: Student;
  config?: GeneratedFormConfig;
  onClose?: () => void;
  onDrivePublished?: (drive: PlacementDriveRecord) => void;
}

export default function GenerateForm({ company, student, config, onClose, onDrivePublished }: GenerateFormProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [localCustomFields, setLocalCustomFields] = useState<CustomFormField[]>([]);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const refNo = company.circularRefNo || `42 / ${new Date().getFullYear()}-${new Date().getFullYear() + 1} / TPC`;
  const circularDate = company.circularDate || company.recruitmentDate || '29.12.2025';
  const batchYear = company.year || '2026';
  const generatedDateTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const handleDownloadPDF = () => {
    exportPlacementFormToPDF(company, config);
  };

  // Compile all custom fields (from company object or config + local inline added)
  const baseCustomFields = company.customFields || config?.customFields || [];
  const allCustomFields = [...baseCustomFields, ...localCustomFields];

  return (
    <div className="w-full flex flex-col items-center space-y-4 print:p-0">
      
      {/* Top Action Control Bar (Hidden when printed) */}
      <div className="w-full max-w-[210mm] flex flex-wrap gap-2 justify-between items-center bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-lg border border-slate-800 no-print">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Campus Drive Circular — {company.name}</h3>
            <p className="text-xs text-slate-300">
              Adithya Institute of Technology &bull; Training & Placement Cell (TPC)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-700"
          >
            <Save size={15} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-md cursor-pointer border border-emerald-400/40"
          >
            <Send size={15} />
            <span>Publish to Student Drive</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-700"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Publish Placement Drive Modal */}
      {showPublishModal && (
        <PublishPlacementDriveModal
          company={company}
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onSuccess={(drive) => {
            if (onDrivePublished) onDrivePublished(drive);
          }}
        />
      )}

      {/* Official Printable A4 Circular Document */}
      <div 
        id="placement-registration-document"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 border-2 border-slate-900 shadow-2xl p-6 sm:p-10 rounded-sm font-sans space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:text-black"
      >
        
        {/* TOP HEADER SECTION WITH COLLEGE LOGO & NAME */}
        <div className="border-b-2 border-slate-900 pb-4 space-y-3">
          
          {/* Institution Header with Official College Logo */}
          <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <AdithyaLogo size="sm" className="h-16 mx-auto mb-1" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
              ADITHYA INSTITUTE OF TECHNOLOGY
            </h1>
            <p className="text-xs text-orange-600 font-extrabold tracking-widest uppercase">
              Central Placement & Training Cell
            </p>
          </div>

          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 pt-2 border-t border-slate-300">
            <span className="text-xs tracking-wide">CAMPUS DRIVE – CIRCULAR</span>
            <div className="flex items-center space-x-4">
              <span>Ref No : <strong className="font-extrabold">{refNo}</strong></span>
              <span>Date : <strong className="font-extrabold">{circularDate}</strong></span>
            </div>
          </div>

          <div className="bg-slate-900 text-white text-center py-2.5 px-4 rounded-xs font-black uppercase text-sm tracking-widest mt-2 shadow-xs">
            {company.name} RECRUITMENT FOR THE BATCH OF {batchYear}
          </div>
        </div>

        {/* 2-COLUMN KEY-VALUE CIRCULAR TABLE MATCHING DOCX TEMPLATE */}
        <div className="border-2 border-slate-900 overflow-hidden text-xs">
          <table className="w-full border-collapse divide-y-2 divide-slate-900">
            <tbody className="divide-y divide-slate-900">
              
              {/* 1. ELIGIBILITY */}
              <tr className="divide-x divide-slate-900">
                <th className="w-1/4 p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  Eligibility
                </th>
                <td className="w-3/4 p-3 font-extrabold text-slate-900 leading-relaxed text-xs">
                  {company.educationalQualification || company.allowedDepartments?.join(' / ') || 'B.E ( ECE / CSE / IT )'} 
                  {company.tenthCutoff && ` ${company.tenthCutoff}% in 10th & 12th, `}
                  CGPA: {company.cgpaCutoff} & ABOVE 
                  {company.maxActiveArrears === 0 ? ' WITHOUT ANY STANDING ARREARS' : ` MAX ${company.maxActiveArrears} ARREARS`}
                </td>
              </tr>

              {/* 2. ROLE */}
              <tr className="divide-x divide-slate-900">
                <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  Role
                </th>
                <td className="p-3 font-bold text-blue-900 text-xs">
                  {company.jobRole}
                </td>
              </tr>

              {/* 3. WORK LOCATION */}
              <tr className="divide-x divide-slate-900">
                <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  Work Location
                </th>
                <td className="p-3 font-extrabold text-slate-900 text-xs">
                  {company.location || 'Chennai'}
                </td>
              </tr>

              {/* 4. DRIVE VENUE */}
              <tr className="divide-x divide-slate-900">
                <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  Drive Venue
                </th>
                <td className="p-3 font-extrabold text-slate-900 text-xs">
                  {company.driveVenue || 'Bannari Amman Institute of Technology, Sathyamangalam'}
                </td>
              </tr>

              {/* 5. POSITION OVERVIEW */}
              {(company.positionOverview || company.description) && (
                <tr className="divide-x divide-slate-900">
                  <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                    Position Overview
                  </th>
                  <td className="p-3 font-medium text-slate-900 whitespace-pre-line leading-relaxed text-[11.5px]">
                    {company.positionOverview || company.description}
                  </td>
                </tr>
              )}

              {/* 6. REQUIRED SKILL SETS */}
              {company.requiredSkills && company.requiredSkills.length > 0 && (
                <tr className="divide-x divide-slate-900">
                  <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                    Required Skill Sets
                  </th>
                  <td className="p-3 font-medium text-slate-900 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {company.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-bold rounded text-[11px] text-slate-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {/* 7. COMPENSATION */}
              <tr className="divide-x divide-slate-900">
                <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  Compensation
                </th>
                <td className="p-3 font-black text-emerald-900 text-xs">
                  {company.salaryPackage}
                </td>
              </tr>

              {/* 8. BOND */}
              {company.bond && (
                <tr className="divide-x divide-slate-900">
                  <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                    Bond
                  </th>
                  <td className="p-3 font-extrabold text-slate-900 text-xs">
                    {company.bond}
                  </td>
                </tr>
              )}

              {/* 9. SELECTION PROCESS */}
              {company.selectionProcess && (
                <tr className="divide-x divide-slate-900">
                  <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                    Selection Process
                  </th>
                  <td className="p-3 font-bold text-slate-900 whitespace-pre-line leading-relaxed text-xs">
                    {company.selectionProcess}
                  </td>
                </tr>
              )}

              {/* 10. ABOUT COMPANY */}
              {company.description && (
                <tr className="divide-x divide-slate-900">
                  <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                    About Company
                  </th>
                  <td className="p-3 font-medium text-slate-900 leading-relaxed text-xs">
                    {company.description}
                  </td>
                </tr>
              )}

              {/* 11. LINK TO REGISTER */}
              <tr className="divide-x divide-slate-900">
                <th className="p-3 bg-slate-100 text-left font-black uppercase text-slate-900 text-[11px] align-top">
                  LINK TO REGISTER
                </th>
                <td className="p-3 space-y-1.5">
                  <a
                    href={company.googleFormLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold text-blue-700 underline text-xs break-all hover:text-blue-900"
                  >
                    {company.googleFormLink || 'https://docs.google.com/forms/register'}
                  </a>
                  {company.applicationDeadline && (
                    <div className="font-black text-rose-800 text-[11px] uppercase tracking-wide">
                      LINK WILL CLOSE BY {company.applicationDeadline}
                    </div>
                  )}
                </td>
              </tr>

              {/* 12. DYNAMIC CUSTOM FIELDS / CUSTOM OPTIONS AT THE END */}
              {allCustomFields.map((field) => (
                <tr key={field.id} className="divide-x divide-slate-900">
                  <th className="p-3 bg-indigo-50/80 text-left font-black uppercase text-indigo-950 text-[11px] align-top">
                    {field.label}
                  </th>
                  <td className="p-3 font-bold text-slate-900 text-xs">
                    {field.value !== undefined && field.value !== '' ? (
                      <span>{String(field.value)}</span>
                    ) : field.options && field.options.length > 0 ? (
                      <span className="font-semibold text-slate-800">{field.options.join(' / ')}</span>
                    ) : (
                      <span className="text-slate-500 italic">[{field.placeholder || `Enter ${field.label}`}]</span>
                    )}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* INLINE QUICK ADD CUSTOM DETAIL OPTION AT END (Hidden when printed) */}
        <div className="no-print border border-dashed border-indigo-300 bg-indigo-50/50 p-3 rounded-xl space-y-2">
          {!showInlineAdd ? (
            <button
              type="button"
              onClick={() => setShowInlineAdd(true)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>+ Add Custom Option / Detail Row at End</span>
            </button>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-indigo-950 font-bold">
                <span>Add Custom Detail Row at End of Circular</span>
                <button
                  type="button"
                  onClick={() => setShowInlineAdd(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Detail Label (e.g. Passport Required, Shift Time)"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg bg-white outline-none font-medium"
                />
                <input
                  type="text"
                  placeholder="Detail Value / Requirements (e.g. Mandatory, Day Shift)"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg bg-white outline-none font-medium"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newLabel.trim()) {
                      const newField: CustomFormField = {
                        id: `cf_${Date.now()}`,
                        label: newLabel.trim(),
                        type: 'text',
                        value: newValue.trim() || undefined,
                        required: false,
                        placeholder: 'Enter response...'
                      };
                      setLocalCustomFields(prev => [...prev, newField]);
                      setNewLabel('');
                      setNewValue('');
                      setShowInlineAdd(false);
                    }
                  }}
                  disabled={!newLabel.trim()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save Custom Option
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER & OFFICIAL SIGNATORIES MATCHING DOCX TEMPLATE */}
        <div className="pt-12 font-sans text-xs space-y-4">
          <div className="flex justify-between items-end px-6">
            
            <div className="text-center space-y-8">
              <div className="font-black text-slate-900 uppercase text-xs tracking-wider">
                HEAD – T&P
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Training & Placement Cell
              </div>
            </div>

            <div className="text-center space-y-8">
              <div className="font-black text-slate-900 uppercase text-xs tracking-wider">
                PRINCIPAL
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Adithya Institute of Technology
              </div>
            </div>

          </div>

          <div className="text-center text-[9px] text-slate-500 border-t border-slate-300 pt-3 font-mono">
            Generated on: {generatedDateTime} &bull; Campus Drive Circular System &bull; Adithya Institute of Technology
          </div>
        </div>

      </div>

    </div>
  );
}
