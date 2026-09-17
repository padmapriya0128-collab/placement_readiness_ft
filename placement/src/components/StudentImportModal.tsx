import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  ArrowRight, 
  Sliders, 
  Layers,
  Database,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { previewStudentImportAPI, confirmStudentImportAPI } from '../api/students';
import { exportToCSV } from '../utils/export';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  uploadedBy?: string;
}

const SYSTEM_FIELDS = [
  { key: 'registerNumber', label: 'Register Number *', required: true },
  { key: 'fullName', label: 'Student Name *', required: true },
  { key: 'cgpa', label: 'CGPA' },
  { key: 'department', label: 'Department' },
  { key: 'year', label: 'Year' },
  { key: 'section', label: 'Section' },
  { key: 'email', label: 'Email (Gmail Required) *', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'attendance', label: 'Attendance (%)' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'internships', label: 'Internships' },
  { key: 'placementStatus', label: 'Placement Status' },
  { key: 'ignore', label: '-- Ignore Column --' }
];

const DEPARTMENTS_LIST = [
  'AI&DS',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Engineering',
  'Robotics & Automation'
];

export default function StudentImportModal({ isOpen, onClose, onSuccess, uploadedBy }: StudentImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [defaultDepartment, setDefaultDepartment] = useState<string>('AI&DS');
  const [duplicateMode, setDuplicateMode] = useState<'update' | 'skip' | 'new'>('update');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preview & Validation State
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Result Stats
  const [importStats, setImportStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const autoDetectColumns = (headerList: string[]) => {
    const mapping: Record<string, string> = {};
    headerList.forEach(h => {
      const norm = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm.includes('reg') && (norm.includes('no') || norm.includes('num') || norm.includes('id'))) mapping[h] = 'registerNumber';
      else if (norm.includes('student') && norm.includes('name')) mapping[h] = 'fullName';
      else if (norm === 'name' || norm === 'fullname') mapping[h] = 'fullName';
      else if (norm.includes('cgpa') || norm === 'gpa') mapping[h] = 'cgpa';
      else if (norm.includes('dept') || norm.includes('branch') || norm === 'department') mapping[h] = 'department';
      else if (norm.includes('year') || norm.includes('batch')) mapping[h] = 'year';
      else if (norm.includes('sec')) mapping[h] = 'section';
      else if (norm.includes('mail')) mapping[h] = 'email';
      else if (norm.includes('mobile') || norm.includes('phone') || norm.includes('contact')) mapping[h] = 'phone';
      else if (norm.includes('attend')) mapping[h] = 'attendance';
      else if (norm.includes('skill')) mapping[h] = 'skills';
      else if (norm.includes('project')) mapping[h] = 'projects';
      else if (norm.includes('certif') || norm.includes('course')) mapping[h] = 'certifications';
      else if (norm.includes('intern')) mapping[h] = 'internships';
      else if (norm.includes('status')) mapping[h] = 'placementStatus';
      else mapping[h] = 'ignore';
    });
    setColumnMapping(mapping);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg('');
    setLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const parsedData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (parsedData.length === 0) {
        setErrorMsg('Unable to read this file. The Excel worksheet contains no data rows.');
        setLoading(false);
        return;
      }

      const extractedHeaders = Object.keys(parsedData[0] || {});
      setRawRows(parsedData);
      setHeaders(extractedHeaders);
      autoDetectColumns(extractedHeaders);
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg('Unable to parse file. Please verify it is a valid .xlsx, .xls or .csv file.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // Validate mapping has required fields
      const mappedFields = Object.values(columnMapping);
      if (!mappedFields.includes('registerNumber')) {
        setErrorMsg('Column Mapping Error: Please map an Excel column to "Register Number *".');
        setLoading(false);
        return;
      }
      if (!mappedFields.includes('fullName')) {
        setErrorMsg('Column Mapping Error: Please map an Excel column to "Student Name *".');
        setLoading(false);
        return;
      }

      // Try server preview API first
      const serverRes = await previewStudentImportAPI({ rows: rawRows, defaultDepartment });

      if (serverRes && serverRes.success) {
        setPreviewRows(serverRes.previewRows);
        setValidationErrors(serverRes.validationErrors || []);
        setValidCount(serverRes.validRowsCount);
        setErrorCount(serverRes.errorRowsCount);
        setDuplicateCount(serverRes.duplicateCount);
      } else {
        // High fidelity client-side validation
        const errors: any[] = [];
        const seenRegs = new Set<string>();
        let valid = 0;
        let dup = 0;

        const previewList = rawRows.map((row, idx) => {
          const rowNum = idx + 1;
          const mappedData: any = {};
          headers.forEach(h => {
            const field = columnMapping[h];
            if (field && field !== 'ignore') mappedData[field] = row[h];
          });

          const reg = String(mappedData.registerNumber || '').trim().toUpperCase();
          const name = String(mappedData.fullName || '').trim();
          const rawCgpa = mappedData.cgpa;

          let isRowValid = true;

          if (!reg) {
            errors.push({ row: rowNum, field: 'Register Number', value: 'Empty', problem: 'Register Number is required' });
            isRowValid = false;
          }

          if (!name) {
            errors.push({ row: rowNum, field: 'Student Name', value: 'Empty', problem: 'Student Name is required' });
            isRowValid = false;
          }

          const email = String(mappedData.email || '').trim();
          if (!email || !email.includes('@')) {
            errors.push({ row: rowNum, field: 'Gmail / Email', value: email || 'Missing', problem: 'Need Gmail / Enter Mail: Valid student email is required' });
            isRowValid = false;
          }

          if (rawCgpa !== undefined && rawCgpa !== null && rawCgpa !== '') {
            const num = parseFloat(String(rawCgpa).replace(/[^0-9.]/g, ''));
            if (isNaN(num) || num < 0 || num > 10) {
              errors.push({ row: rowNum, field: 'CGPA', value: String(rawCgpa), problem: 'CGPA must be between 0 and 10' });
              isRowValid = false;
            }
          }

          if (reg) {
            if (seenRegs.has(reg)) {
              dup++;
              errors.push({ row: rowNum, field: 'Register Number', value: reg, problem: `Duplicate Register Number "${reg}" in file` });
            } else {
              seenRegs.add(reg);
            }
          }

          if (isRowValid) valid++;

          return {
            rowNum,
            mappedData,
            registerNumber: reg || 'Not Available',
            fullName: name || 'Not Available',
            cgpa: mappedData.cgpa || 'Not Available',
            department: mappedData.department || defaultDepartment || 'AI&DS',
            year: mappedData.year || 'Not Available',
            section: mappedData.section || 'Not Available',
            isValid: isRowValid
          };
        });

        setPreviewRows(previewList);
        setValidationErrors(errors);
        setValidCount(valid);
        setErrorCount(rawRows.length - valid);
        setDuplicateCount(dup);
      }

      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate import preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await confirmStudentImportAPI({
        rows: rawRows,
        columnMapping,
        defaultDepartment,
        duplicateMode,
        fileName: file?.name || 'students.xlsx',
        uploadedBy: uploadedBy || 'Faculty'
      });

      if (res && res.success) {
        setImportStats(res.stats);
        setStep('result');
        onSuccess();
      } else {
        setErrorMsg('Unable to save student data. Please check database connection and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import student data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (validationErrors.length === 0) return;
    const exportRows = validationErrors.map(e => ({
      'Row Number': e.row,
      'Field': e.field,
      'Cell Value': e.value,
      'Problem Description': e.problem
    }));
    exportToCSV(`Import_Validation_Errors_${Date.now()}`, exportRows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-6 my-8 animate-scale-up">

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider rounded">
              Excel / CSV Student Data Import System
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={24} />
              <span>Import Student Registry Data</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center space-x-2">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: FILE UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-950 transition-all space-y-4">
              <FileSpreadsheet size={48} className="mx-auto text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  Select Excel or CSV File to Upload
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supported Formats: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-import-file-input"
              />
              <label
                htmlFor="excel-import-file-input"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg cursor-pointer transition-all"
              >
                <span>Browse File</span>
              </label>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">ℹ️ Import Guidelines:</p>
              <p>&bull; The Excel file will be parsed directly as the <strong>source of truth</strong>.</p>
              <p>&bull; No fake student names or dummy register numbers will be generated.</p>
              <p>&bull; You will be able to review column mapping & validate student rows before saving to database.</p>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl">
              <div>
                <p className="font-extrabold text-xs text-blue-900 dark:text-blue-100">
                  File: <span className="font-mono">{file?.name}</span> ({rawRows.length} Total Rows)
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Verify or adjust automatic column mapping below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => autoDetectColumns(headers)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Auto Detect Columns</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res: Record<string, string> = {};
                    headers.forEach(h => res[h] = 'ignore');
                    setColumnMapping(res);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Reset Mapping
                </button>
              </div>
            </div>

            {/* Column Mapping Grid */}
            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="grid grid-cols-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
                <span>Excel Column Name</span>
                <span>System Student Field</span>
              </div>
              {headers.map(header => (
                <div key={header} className="grid grid-cols-2 items-center gap-4 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate">
                    {header}
                  </div>
                  <select
                    value={columnMapping[header] || 'ignore'}
                    onChange={e => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {SYSTEM_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Target Batch Department Selector */}
            <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/60 space-y-1.5 text-xs">
              <label className="font-extrabold text-blue-900 dark:text-blue-200 block">
                Target Department for this Upload Batch:
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                If your Excel sheet doesn't contain a Department column, all students in this batch will be assigned to this department.
              </p>
              <select
                value={defaultDepartment}
                onChange={e => setDefaultDepartment(e.target.value)}
                className="w-full p-2.5 border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 outline-none"
              >
                {DEPARTMENTS_LIST.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
              >
                {loading ? (
                  <span>Parsing Data...</span>
                ) : (
                  <>
                    <span>Preview & Validate Data</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATION SUMMARY */}
        {step === 'preview' && (
          <div className="space-y-6">
            
            {/* Validation Summary Cards */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">Total Rows</span>
                <div className="text-xl font-black text-blue-900 dark:text-blue-100">{rawRows.length}</div>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">Valid Rows</span>
                <div className="text-xl font-black text-emerald-900 dark:text-emerald-100">{validCount}</div>
              </div>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider">Error Rows</span>
                <div className="text-xl font-black text-rose-900 dark:text-rose-100">{errorCount}</div>
              </div>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 uppercase tracking-wider">Duplicates</span>
                <div className="text-xl font-black text-amber-900 dark:text-amber-100">{duplicateCount}</div>
              </div>
            </div>

            {/* Validation Errors Table if any */}
            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    <span>Validation Summary Errors ({validationErrors.length})</span>
                  </span>
                  <button
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-[11px] hover:bg-rose-200 cursor-pointer flex items-center space-x-1"
                  >
                    <Download size={12} />
                    <span>Download Error Report</span>
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-rose-200 dark:border-rose-900/60 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold border-b border-rose-200 dark:border-rose-900">
                      <tr>
                        <th className="p-2">Row #</th>
                        <th className="p-2">Field</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Problem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 dark:divide-rose-950">
                      {validationErrors.slice(0, 20).map((err, i) => (
                        <tr key={i} className="hover:bg-rose-50/50">
                          <td className="p-2 font-mono font-bold">{err.row}</td>
                          <td className="p-2 font-bold">{err.field}</td>
                          <td className="p-2 font-mono">{String(err.value)}</td>
                          <td className="p-2 font-medium text-rose-700 dark:text-rose-400">{err.problem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Duplicate Handling Options */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                Duplicate Register Number Handling Mode:
              </label>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="dupMode"
                    value="update"
                    checked={duplicateMode === 'update'}
                    onChange={() => setDuplicateMode('update')}
                    className="accent-blue-600"
                  />
                  <span><strong>Update Existing</strong> (Overwrite fields while preserving DB ID)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="dupMode"
                    value="skip"
                    checked={duplicateMode === 'skip'}
                    onChange={() => setDuplicateMode('skip')}
                    className="accent-blue-600"
                  />
                  <span><strong>Skip Existing</strong> (Ignore duplicate register numbers)</span>
                </label>
              </div>
            </div>

            {/* Real Data Preview Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Actual Excel File Data Preview ({previewRows.length} Rows Extracted)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Source of truth preview</span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Register Number</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">CGPA</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Year</th>
                      <th className="p-2.5">Section</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-850 ${!r.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                        <td className="p-2.5 font-mono text-slate-400">{r.rowNum || i + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">{r.registerNumber || r.mappedData?.registerNumber || 'Not Available'}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{r.fullName || r.mappedData?.fullName || 'Not Available'}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-700 dark:text-blue-400">{r.cgpa !== undefined ? r.cgpa : (r.mappedData?.cgpa || 'Not Available')}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.department || r.mappedData?.department || 'Not Available'}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.year || r.mappedData?.year || 'Not Available'}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.section || r.mappedData?.section || 'Not Available'}</td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold">Valid</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded text-[10px] font-bold">Invalid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Back to Column Mapping
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel Import
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
                >
                  {loading ? (
                    <span>Importing & Saving to MongoDB...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Import Students to Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: IMPORT COMPLETED SUMMARY */}
        {step === 'result' && importStats && (
          <div className="space-y-6 text-center py-6 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                IMPORT COMPLETED
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Student Excel dataset has been parsed and synced to MongoDB Atlas.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Rows</span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200">{importStats.totalRows}</div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] text-emerald-600 uppercase font-bold">Successful</span>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">{importStats.successfulRows}</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] text-blue-600 uppercase font-bold">Updated</span>
                <div className="text-lg font-black text-blue-700 dark:text-blue-300">{importStats.updatedRows}</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900">
                <span className="text-[10px] text-amber-600 uppercase font-bold">Skipped</span>
                <div className="text-lg font-black text-amber-700 dark:text-amber-300">{importStats.skippedRows}</div>
              </div>
            </div>

            <div className="pt-4 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccess();
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-lg cursor-pointer"
              >
                View Student Registry
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
