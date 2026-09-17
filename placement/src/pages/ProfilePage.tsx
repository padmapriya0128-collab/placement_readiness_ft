import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Shield, Edit3, Save, Award, BookOpen, Wrench } from 'lucide-react';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import { getStudents, getStudentProfileByRegisterNumber } from '../api/students';

interface ProfilePageProps {
  user: any;
  role: 'Faculty' | 'Placement Faculty' | 'Student';
  onUpdateUser: (updatedUser: any) => void;
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

export default function ProfilePage({ user, role, onUpdateUser }: ProfilePageProps) {
  const canEdit = role === 'Faculty' || role === 'Placement Faculty';
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<any>({
    ...user,
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || DEPARTMENTS[1],
    registerNumber: user?.registerNumber || '',
    avatarUrl: user?.avatarUrl || '',
    cgpa: user?.cgpa !== undefined ? user?.cgpa : '',
    year: user?.year || '',
    skills: user?.skills || [],
    section: user?.section || 'A',
    tenthPercentage: user?.tenthPercentage || '',
    twelfthPercentage: user?.twelfthPercentage || '',
    activeArrears: user?.activeArrears ?? 0,
    historyArrears: user?.historyArrears ?? 0,
    readinessScore: user?.readinessScore || 82,
    certifications: user?.certifications || [],
    projects: user?.projects || [],
    internships: user?.internships || []
  });

  // For Students: Automatically fetch the latest student record from MongoDB Atlas
  useEffect(() => {
    async function loadLatestData() {
      if (role === 'Student' && user?.registerNumber) {
        try {
          const match = await getStudentProfileByRegisterNumber(user.registerNumber);
          if (match) {
            setFormData({
              ...user,
              ...match,
              name: match.name || user?.name || '',
              email: match.email || user?.email || '',
              phone: match.phone || user?.phone || '',
              department: match.department || user?.department || DEPARTMENTS[1],
              registerNumber: match.registerNumber || user?.registerNumber || '',
              avatarUrl: match.avatarUrl || user?.avatarUrl || '',
              cgpa: match.cgpa !== undefined ? String(match.cgpa) : user?.cgpa || '',
              year: match.year || user?.year || '',
              section: match.section || user?.section || 'A',
              tenthPercentage: match.tenthPercentage || user?.tenthPercentage || '',
              twelfthPercentage: match.twelfthPercentage || user?.twelfthPercentage || '',
              activeArrears: match.activeArrears ?? user?.activeArrears ?? 0,
              historyArrears: match.historyArrears ?? user?.historyArrears ?? 0,
              readinessScore: match.readinessScore || user?.readinessScore || 82,
              skills: match.skills || user?.skills || [],
              certifications: match.certifications || user?.certifications || [],
              projects: match.projects || user?.projects || [],
              internships: match.internships || user?.internships || []
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadLatestData();
  }, [user, role]);

  const handleSave = () => {
    if (!canEdit) return;
    const updated = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      avatarUrl: formData.avatarUrl
    };
    onUpdateUser(updated);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleAvatarChange = (newUrl: string) => {
    if (!canEdit) return;
    const updated = {
      ...user,
      avatarUrl: newUrl
    };
    setFormData(prev => ({ ...prev, avatarUrl: newUrl }));
    onUpdateUser(updated);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative z-10">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            {/* Profile Photo Display / Uploader */}
            <ProfilePhotoUploader
              currentAvatarUrl={formData.avatarUrl}
              onAvatarChange={handleAvatarChange}
              size="xl"
              showUploadButton={canEdit}
            />

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">{formData.name || 'User Name'}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-extrabold uppercase tracking-wider border border-blue-100">
                  {role === 'Placement Faculty' ? 'Placement Officer' : role === 'Faculty' ? 'Placement Faculty' : role}
                </span>
                {!canEdit && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                    Read-Only Database Record
                  </span>
                )}
              </div>
              {formData.registerNumber && (
                <p className="text-xs text-slate-500 font-mono font-semibold pt-1">
                  Register No: <span className="text-slate-800">{formData.registerNumber}</span>
                </p>
              )}
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold mt-1">
                {formData.department || 'Department N/A'}
              </span>
            </div>
          </div>

          {/* Edit Buttons only for Faculty and Placement Officer */}
          {canEdit && (
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Info Form / Read-only Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Full Name</label>
            {isEditing && canEdit ? (
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-900"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                <User size={16} className="text-slate-400" />
                <span>{formData.name || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Email Address</label>
            {isEditing && canEdit ? (
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-900"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                <Mail size={16} className="text-slate-400" />
                <span>{formData.email || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Phone Number</label>
            {isEditing && canEdit ? (
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-900"
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                <Phone size={16} className="text-slate-400" />
                <span>{formData.phone || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Department</label>
            {isEditing && canEdit ? (
              <select
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-900"
              >
                {DEPARTMENTS.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                <Building size={16} className="text-slate-400" />
                <span>{formData.department || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Role & Access</label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
              <Shield size={16} className="text-blue-600" />
              <span>{role === 'Placement Faculty' ? 'Placement Officer' : role === 'Faculty' ? 'Placement Faculty' : role}</span>
            </div>
          </div>

          {/* Additional Read-Only Fields for Student Records */}
          {role === 'Student' && (
            <>
              {/* Academic Year & Section */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Year & Section</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  <span>Year {formData.year || '4'} - Section {formData.section || 'A'}</span>
                </div>
              </div>

              {/* CGPA */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Academic CGPA</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <Award size={16} className="text-amber-500" />
                  <span>{formData.cgpa ?? 'N/A'}</span>
                </div>
              </div>

              {/* 10th Percentage */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">10th Grade Percentage</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <Award size={16} className="text-blue-500" />
                  <span>{formData.tenthPercentage ? `${formData.tenthPercentage}%` : 'N/A'}</span>
                </div>
              </div>

              {/* 12th / Diploma Percentage */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">12th / Diploma Percentage</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <Award size={16} className="text-teal-500" />
                  <span>{formData.twelfthPercentage ? `${formData.twelfthPercentage}%` : formData.diplomaPercentage ? `${formData.diplomaPercentage}%` : 'N/A'}</span>
                </div>
              </div>

              {/* Current Active Arrears */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Current Standing Arrears</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <Shield size={16} className={formData.activeArrears > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                  <span className={formData.activeArrears > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {formData.activeArrears !== undefined ? `${formData.activeArrears} Standing` : '0 Standing'}
                  </span>
                </div>
              </div>

              {/* History of Arrears */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">History of Arrears</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800 flex items-center space-x-2">
                  <Shield size={16} className="text-slate-400" />
                  <span>{formData.historyArrears !== undefined ? `${formData.historyArrears} Total` : '0 Total'}</span>
                </div>
              </div>

              {/* Readiness Score */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Placement Readiness Score</label>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 font-black text-blue-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award size={18} className="text-blue-600" />
                    <span>Career Readiness Rating</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-black">
                    {formData.readinessScore || 80}/100
                  </span>
                </div>
              </div>

              {/* Recorded Technical Skills */}
              {formData.skills && formData.skills.length > 0 && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Recorded Technical Skills</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-1.5">
                    <Wrench size={16} className="text-slate-400 mr-1 my-auto" />
                    {formData.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {formData.certifications && formData.certifications.length > 0 && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Certifications</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-1.5">
                    {formData.certifications.map((cert: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {formData.projects && formData.projects.length > 0 && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-600 uppercase text-[10px] tracking-wider">Academic Projects</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-1.5">
                    {formData.projects.map((proj: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[11px] font-bold">
                        {proj}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
