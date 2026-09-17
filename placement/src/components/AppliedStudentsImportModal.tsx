import React, { useState } from 'react';
import { FileSpreadsheet, X, CheckCircle2, AlertCircle, UploadCloud, RefreshCw, Send, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Company, StudentApplication } from '../types';
import { getStudents } from '../api/students';
import { saveBulkStudentApplications } from '../api/placement';

interface AppliedStudentsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companies: Company[];
  preselectedCompanyId?: string;
}

export default function AppliedStudentsImportModal({
  isOpen,
  onClose,
  onSuccess,
  companies,
  preselectedCompanyId
}: AppliedStudentsImportModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    preselectedCompanyId || (companies[0]?.id || '')
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusOverride, setStatusOverride] = useState<'Applied' | 'Selected' | 'Pending' | 'Rejected'>('Applied');
  const [importStats, setImportStats] = useState<{ total: number; success: number; companyName: string } | null>(null);

  if (!isOpen) return null;

  const targetCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleProcessAppliedExcel = async () => {
    if (!targetCompany) {
      setErrorMsg('Please select a target placement drive/company first.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select an Excel or CSV file to import.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      if (parsedRows.length === 0) {
        setErrorMsg('The selected Excel file has no data rows.');
        setLoading(false);
        return;
      }

      const allStudents = await getStudents();

      // Extract applied student application payloads
      const applicationsToSave: Omit<StudentApplication, 'id'>[] = [];

      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];

        // Fuzzy match register number / name / email
        let regNum = '';
        let studentName = '';
        let dept = '';
        let email = '';
        let rowStatus: 'Applied' | 'Selected' | 'Pending' | 'Rejected' = statusOverride;

        for (const [key, val] of Object.entries(row)) {
          const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          const valStr = String(val || '').trim();

          if (normKey.includes('reg') && (normKey.includes('no') || normKey.includes('num') || normKey.includes('id') || normKey.includes('code'))) {
            regNum = valStr.toUpperCase();
          } else if (normKey.includes('student') || normKey === 'name' || normKey === 'fullname') {
            studentName = valStr;
          } else if (normKey.includes('dept') || normKey.includes('branch')) {
            dept = valStr;
          } else if (normKey.includes('mail')) {
            email = valStr;
          } else if (normKey.includes('status')) {
            const s = valStr.toLowerCase();
            if (s.includes('select')) rowStatus = 'Selected';
            else if (s.includes('reject')) rowStatus = 'Rejected';
            else if (s.includes('pend')) rowStatus = 'Pending';
            else if (s.includes('apply')) rowStatus = 'Applied';
          }
        }

        // Match existing student
        const matchStudent = allStudents.find(
          s => (regNum && s.registerNumber?.toUpperCase() === regNum) ||
               (email && s.email?.toLowerCase() === email.toLowerCase()) ||
               (studentName && s.name?.toLowerCase() === studentName.toLowerCase())
        );

        const finalReg = regNum || matchStudent?.registerNumber || `REG_${i + 1}`;
        const finalName = studentName || matchStudent?.name || matchStudent?.fullName || `Student ${finalReg}`;
        const finalDept = dept || matchStudent?.department || 'AI&DS';
        const finalCgpa = matchStudent?.cgpa || 0;

        applicationsToSave.push({
          studentId: matchStudent?.id || `std_${finalReg}`,
          studentName: finalName,
          registerNumber: finalReg,
          department: finalDept,
          year: matchStudent?.year || 4,
          cgpa: finalCgpa,
          companyId: targetCompany.id,
          companyName: targetCompany.name,
          jobRole: targetCompany.jobRole || 'Software Development Engineer',
          salaryPackage: targetCompany.salaryPackage || '5.0 LPA',
          status: rowStatus,
          appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          googleFormSubmitted: true
        });
      }

      const savedApps = saveBulkStudentApplications(applicationsToSave);

      setImportStats({
        total: parsedRows.length,
        success: savedApps.length,
        companyName: targetCompany.name
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing applied students file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6 animate-scale-up">

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider rounded">
              Excel Import
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <FileSpreadsheet size={22} className="text-indigo-600" />
              <span>Import Applied Students List</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center space-x-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {importStats ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 text-center">
            <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-base">
              Successfully Imported Applied Records!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Updated <strong>{importStats.success}</strong> student applications for <strong>{importStats.companyName}</strong>.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportStats(null);
                  onClose();
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">

            {/* Target Placement Drive / Company */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-600" />
                <span>Select Target Placement Drive / Company</span>
              </label>
              <select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.jobRole} ({c.salaryPackage})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Override */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Application Status to Assign
              </label>
              <select
                value={statusOverride}
                onChange={e => setStatusOverride(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Applied">Applied (Student Applied for Drive)</option>
                <option value="Selected">Selected (Shortlisted / Hired)</option>
                <option value="Pending">Pending (Under Assessment Review)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* File Upload Box */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Upload Excel / CSV File (.xlsx, .csv)
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50 transition-colors relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud size={32} className="mx-auto text-indigo-500 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {file ? file.name : 'Click or Drag & Drop Applied Students Excel File'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  File should contain Register Number, Student Name, Department columns.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Modal Actions */}
        {!importStats && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessAppliedExcel}
              disabled={loading || !file}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Import & Mark Applied</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
