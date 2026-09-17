import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  Edit3, 
  Send, 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  Briefcase, 
  MapPin, 
  CircleDollarSign, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  UploadCloud, 
  HelpCircle,
  AlertCircle,
  Lock,
  Layers,
  Download,
  Printer,
  ArrowLeft
} from 'lucide-react';
import { Company, CustomFormField, GeneratedFormConfig } from '../types';
import GenerateForm from './GenerateForm';
import { exportPlacementFormToPDF } from '../utils/pdfExport';

interface CompanyFormGeneratorModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onSaveFormConfig: (companyId: string, config: GeneratedFormConfig, formStatus: 'Draft' | 'Published' | 'Closed') => void;
}

export default function CompanyFormGeneratorModal({
  company,
  isOpen,
  onClose,
  onSaveFormConfig
}: CompanyFormGeneratorModalProps) {
  if (!isOpen || !company) return null;

  // Initial configuration from company or defaults
  const existingConfig = company.generatedFormConfig || {
    isGenerated: true,
    isPublished: company.formStatus === 'Published',
    customInstructions: company.additionalInstructions || 'Please verify all your academic and personal information carefully before submitting.',
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
        placeholder: 'Mention your motivation and aligned career goals...'
      }
    ]
  };

  // Default to 'preview' mode so clicking "Generate Form" immediately shows the official A4 document
  const [activeMode, setActiveMode] = useState<'editor' | 'preview'>('preview');
  const [formStatusState, setFormStatusState] = useState<'Draft' | 'Published' | 'Closed'>(
    company.formStatus || (existingConfig.isPublished ? 'Published' : 'Draft')
  );

  const [allowResumeUpload, setAllowResumeUpload] = useState<boolean>(existingConfig.allowResumeUpload ?? true);
  const [collectCertifications, setCollectCertifications] = useState<boolean>(existingConfig.collectCertifications ?? true);
  const [collectSkills, setCollectSkills] = useState<boolean>(existingConfig.collectSkills ?? true);
  const [collectBacklogsDetail, setCollectBacklogsDetail] = useState<boolean>(existingConfig.collectBacklogsDetail ?? true);
  const [customInstructions, setCustomInstructions] = useState<string>(existingConfig.customInstructions || '');

  const [customFields, setCustomFields] = useState<CustomFormField[]>(existingConfig.customFields || []);

  // New Question Form State
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date'>('text');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);
  const [newQuestionOptions, setNewQuestionOptions] = useState('');

  const handleAddCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;

    const newField: CustomFormField = {
      id: `cf_${Date.now()}`,
      label: newQuestionLabel.trim(),
      type: newQuestionType,
      required: newQuestionRequired,
      placeholder: newQuestionType === 'number' ? 'Enter numerical value...' : newQuestionType === 'date' ? 'Select date...' : 'Enter response...',
      options: (newQuestionType === 'select' || newQuestionType === 'radio' || newQuestionType === 'checkbox') 
        ? newQuestionOptions.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    };

    setCustomFields(prev => [...prev, newField]);
    setNewQuestionLabel('');
    setNewQuestionOptions('');
    setNewQuestionType('text');
    setNewQuestionRequired(true);
  };

  const handleRemoveQuestion = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const currentConfig: GeneratedFormConfig = {
    isGenerated: true,
    isPublished: formStatusState === 'Published',
    customInstructions,
    allowResumeUpload,
    collectCertifications,
    collectSkills,
    collectBacklogsDetail,
    customFields
  };

  const handleSave = (targetStatus: 'Draft' | 'Published' | 'Closed') => {
    const updatedConfig: GeneratedFormConfig = {
      ...currentConfig,
      isPublished: targetStatus === 'Published',
      generatedAt: existingConfig.generatedAt || new Date().toISOString(),
      publishedAt: targetStatus === 'Published' ? new Date().toISOString() : existingConfig.publishedAt
    };

    setFormStatusState(targetStatus);
    onSaveFormConfig(company.id, updatedConfig, targetStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 animate-fade-in overflow-hidden w-screen h-screen">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        
        {/* Full Big Screen Page Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-extrabold mr-2 border border-white/20"
              title="Back to Placement Module"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Requirements</span>
            </button>

            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">{company.name} — Company Recruitment Announcement</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  formStatusState === 'Published' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  formStatusState === 'Closed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {formStatusState}
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Official announcement & recruitment guidelines format for Adithya Institute of Technology Central Placement Cell.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toggle Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMode('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === 'preview' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Eye size={15} />
              <span>Generated Form Preview</span>
            </button>

            <button
              onClick={() => setActiveMode('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === 'editor' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Edit3 size={15} />
              <span>Configure Questions & Rules</span>
            </button>
          </div>

          {/* Save Draft & Publish Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSave('Draft')}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <Save size={15} />
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => handleSave('Published')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Send size={15} />
              <span>Publish to Student Drive</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/50">

          {/* PREVIEW MODE - OFFICIAL A4 DOCUMENT */}
          {activeMode === 'preview' && (
            <div className="animate-fade-in flex flex-col items-center">
              <GenerateForm
                company={company}
                config={currentConfig}
                onClose={onClose}
              />
            </div>
          )}

          {/* EDITOR MODE */}
          {activeMode === 'editor' && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              
              {/* Source Requirements Summary Banner */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Source Recruitment Data
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {company.name} — {company.jobRole} ({company.salaryPackage})
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-800 bg-white/80 border border-slate-200 px-3 py-1 rounded-xl">
                      Min CGPA: {company.cgpaCutoff}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <strong className="text-slate-800">{company.location || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Max Backlogs</span>
                    <strong className="text-slate-800">{company.maxActiveArrears ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Batch</span>
                    <strong className="text-slate-800">{company.year || '2026'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Deadline</span>
                    <strong className="text-slate-800">{company.applicationDeadline || 'Open'}</strong>
                  </div>
                </div>
              </div>

              {/* Form Controls & Switches */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Layers size={16} className="text-blue-600" />
                  <span>Student Application Settings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-all">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Require Resume Upload</div>
                      <div className="text-[11px] text-slate-500 font-medium">Students attach drive resume link</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowResumeUpload}
                      onChange={e => setAllowResumeUpload(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-all">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Collect Technical Skills</div>
                      <div className="text-[11px] text-slate-500 font-medium">Prompt students for verified skills</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={collectSkills}
                      onChange={e => setCollectSkills(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Special Instructions for Applicants</label>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="Provide additional guidelines for students submitting this registration..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Questions Builder */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <HelpCircle size={16} className="text-indigo-600" />
                      <span>Custom Application Questions ({customFields.length})</span>
                    </h3>
                  </div>
                </div>

                {customFields.length > 0 ? (
                  <div className="space-y-3">
                    {customFields.map((field, index) => (
                      <div key={field.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">
                              {index + 1}. {field.label}
                            </span>
                            {field.required && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                              {field.type}
                            </span>
                          </div>
                          {field.options && field.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5 items-center">
                              <span className="text-[10px] text-slate-400 font-semibold">Options:</span>
                              {field.options.map((opt, oi) => (
                                <span key={oi} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveQuestion(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Remove question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-100">
                    No custom questions added. Click below to add.
                  </div>
                )}

                {/* Add New Question Section */}
                <div className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                      <Plus size={14} className="text-blue-600" />
                      <span>Add Custom Question / Input Field</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Supports Text, Number, Dropdown, Checkbox, Radio, & Date
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-700">Question Title / Field Name *</label>
                      <input
                        type="text"
                        value={newQuestionLabel}
                        onChange={e => setNewQuestionLabel(e.target.value)}
                        placeholder="e.g. Expected Joining Date, CGPA Verification, Willing to Relocate?"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Input Type</label>
                      <select
                        value={newQuestionType}
                        onChange={e => setNewQuestionType(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none font-medium text-xs"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Paragraph / Long Text</option>
                        <option value="number">Number (Spin Arrows)</option>
                        <option value="select">Dropdown Selection</option>
                        <option value="checkbox">Checkbox Options</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="date">Date Picker</option>
                      </select>
                    </div>
                  </div>

                  {(newQuestionType === 'select' || newQuestionType === 'radio' || newQuestionType === 'checkbox') && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Options (Comma separated) *
                      </label>
                      <input
                        type="text"
                        value={newQuestionOptions}
                        onChange={e => setNewQuestionOptions(e.target.value)}
                        placeholder="e.g. Option 1, Option 2, Option 3"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none text-xs font-medium"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newQuestionRequired}
                        onChange={e => setNewQuestionRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Mark field as Required for students</span>
                    </label>

                    <button
                      onClick={handleAddCustomQuestion}
                      disabled={!newQuestionLabel.trim() || ((newQuestionType === 'select' || newQuestionType === 'radio' || newQuestionType === 'checkbox') && !newQuestionOptions.trim())}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Add Question</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
