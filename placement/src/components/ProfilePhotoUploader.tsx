import React, { useState, useRef } from 'react';
import { User, Upload, Trash2, Camera, Check, X } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  label?: string;
}

export default function ProfilePhotoUploader({
  currentAvatarUrl,
  onAvatarChange,
  size = 'lg',
  showUploadButton = true,
  label = 'Profile Photo'
}: ProfilePhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine size classes
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  }[size];

  const iconSizes = {
    sm: 18,
    md: 28,
    lg: 40,
    xl: 56
  }[size];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (previewUrl && onAvatarChange) {
      onAvatarChange(previewUrl);
      setIsModalOpen(false);
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    if (onAvatarChange) {
      onAvatarChange('');
    }
    setPreviewUrl(null);
    setIsModalOpen(false);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const activeImage = currentAvatarUrl && currentAvatarUrl.trim() !== '' ? currentAvatarUrl : null;

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Avatar Container */}
      <div className="relative group">
        <div className={`${sizeClasses} rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-xs text-slate-400 font-bold transition-all group-hover:border-blue-500`}>
          {activeImage ? (
            <img
              src={activeImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={iconSizes} className="text-slate-400" />
          )}
        </div>

        {showUploadButton && (
          <button
            type="button"
            onClick={triggerFileSelect}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all transform hover:scale-110 cursor-pointer"
            title="Upload Profile Photo"
          >
            <Camera size={14} />
          </button>
        )}
      </div>

      {showUploadButton && (
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={triggerFileSelect}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Upload size={14} />
            <span>{activeImage ? 'Replace Photo' : 'Upload Profile Photo'}</span>
          </button>

          {activeImage && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl flex items-center space-x-1 cursor-pointer transition-all"
              title="Remove Photo"
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {isModalOpen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5 animate-scale-up text-center">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Preview Profile Photo</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <div className="w-36 h-36 rounded-full border-4 border-blue-100 overflow-hidden shadow-md">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={triggerFileSelect}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Choose Another
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>Save Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
