import React, { useState } from 'react';
import { Sliders, X, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { bulkUpdateStudentsAPI } from '../api/students';

interface StudentBulkEditModalProps {
  selectedStudentIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export default function StudentBulkEditModal({
  selectedStudentIds,
  isOpen,
  onClose,
  onSuccess
}: StudentBulkEditModalProps) {
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Record<string, boolean>>({
    department: false,
    year: false,
    section: false,
    cgpa: false,
    placementStatus: false,
    attendance: false
  });

  const [department, setDepartment] = useState('Artificial Intelligence & Data Science');
  const [year, setYear] = useState('IV');
  const [section, setSection] = useState('A');
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [attendance, setAttendance] = useState<number | ''>('');
  const [placementStatus, setPlacementStatus] = useState<'Eligible' | 'Not Eligible' | 'Placed' | 'In Progress'>('Eligible');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleField = (field: string) => {
    setFieldsToUpdate(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApplyBulkEdit = async () => {
    setErrorMsg('');

    const activeFields = Object.keys(fieldsToUpdate).filter(k => fieldsToUpdate[k]);
    if (activeFields.length === 0) {
      setErrorMsg('Please check at least one field to bulk update.');
      return;
    }

    const updates: Partial<Student> = {};
    if (fieldsToUpdate.department) updates.department = department;
    if (fieldsToUpdate.year) updates.year = year as any;
    if (fieldsToUpdate.section) updates.section = section;
    if (fieldsToUpdate.cgpa && typeof cgpa === 'number') updates.cgpa = cgpa;
    if (fieldsToUpdate.attendance && typeof attendance === 'number') updates.attendance = attendance;
    if (fieldsToUpdate.placementStatus) updates.placementStatus = placementStatus;

    setLoading(true);

    try {
      const ok = await bulkUpdateStudentsAPI(selectedStudentIds, updates);
      if (ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg('Failed to apply bulk update.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating students.');
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
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider rounded">
              Bulk Student Batch Update
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <Sliders size={20} className="text-blue-600" />
              <span>Bulk Edit ({selectedStudentIds.length} Students Selected)</span>
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
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Check the fields you wish to update across all <strong>{selectedStudentIds.length}</strong> selected students. Unchecked fields will remain untouched.
          </p>

          {/* Department Field */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.department}
                onChange={() => toggleField('department')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update Department</span>
            </label>
            {fieldsToUpdate.department && (
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>

          {/* Academic Year */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.year}
                onChange={() => toggleField('year')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update Academic Year</span>
            </label>
            {fieldsToUpdate.year && (
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="I">I Year (First Year)</option>
                <option value="II">II Year (Second Year)</option>
                <option value="III">III Year (Third Year)</option>
                <option value="IV">IV Year (Final Year)</option>
              </select>
            )}
          </div>

          {/* Class Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.section}
                onChange={() => toggleField('section')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update Section</span>
            </label>
            {fieldsToUpdate.section && (
              <select
                value={section}
                onChange={e => setSection(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            )}
          </div>

          {/* Placement Status */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.placementStatus}
                onChange={() => toggleField('placementStatus')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update Placement Status</span>
            </label>
            {fieldsToUpdate.placementStatus && (
              <select
                value={placementStatus}
                onChange={e => setPlacementStatus(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Eligible">Eligible</option>
                <option value="Not Eligible">Not Eligible</option>
                <option value="Placed">Placed</option>
                <option value="In Progress">In Progress</option>
              </select>
            )}
          </div>

          {/* CGPA */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.cgpa}
                onChange={() => toggleField('cgpa')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update CGPA</span>
            </label>
            {fieldsToUpdate.cgpa && (
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.50"
                value={cgpa}
                onChange={e => setCgpa(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            )}
          </div>

          {/* Attendance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldsToUpdate.attendance}
                onChange={() => toggleField('attendance')}
                className="accent-blue-600 w-4 h-4"
              />
              <span>Update Attendance (%)</span>
            </label>
            {fieldsToUpdate.attendance && (
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 85.0"
                value={attendance}
                onChange={e => setAttendance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            )}
          </div>
        </div>

        {/* Modal Actions */}
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
            onClick={handleApplyBulkEdit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
          >
            {loading ? <span>Saving...</span> : <span>Apply Changes to {selectedStudentIds.length} Students</span>}
          </button>
        </div>

      </div>
    </div>
  );
}
