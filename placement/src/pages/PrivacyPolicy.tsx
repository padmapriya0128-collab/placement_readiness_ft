import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft, Mail, ExternalLink, CheckCircle2, Server, UserCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
  onNavigateToTerms?: () => void;
}

export default function PrivacyPolicy({ onBack, onNavigateToTerms }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center space-x-2 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-600 rounded-xl text-white">
                <Shield size={20} />
              </span>
              <span className="font-bold text-lg text-white">Placement Readiness Analyzer</span>
            </div>
          </div>

          {onNavigateToTerms && (
            <button
              onClick={onNavigateToTerms}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Terms of Service</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
            <CheckCircle2 size={14} />
            <span>Google OAuth 2.0 Compliant Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Effective Date: <strong className="text-white">September 9, 2026</strong> | Last Updated: <strong className="text-white">September 9, 2026</strong>
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            This Privacy Policy describes how Placement Readiness Analyzer ("we", "us", "our", or the "Platform"), operated by Adithya Institute of Technology, collects, uses, stores, and protects your personal information when you register, log in, or interact with our application.
          </p>
        </div>

        {/* Main Content Body */}
        <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
          
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>1. Overview & Service Scope</span>
            </h2>
            <p>
              Placement Readiness Analyzer is an educational technology application designed to evaluate student placement readiness, track skill assessments, analyze resume qualifications, manage campus recruitment drives, and deliver placement notifications for students, faculty coordinators, and placement officers.
            </p>
          </section>

          {/* Section 2: Mandatory Google User Data Policy Compliance */}
          <section className="p-5 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-3">
            <h2 className="text-xl font-bold text-blue-300 flex items-center space-x-2">
              <Shield className="text-blue-400" size={20} />
              <span>2. Google API Disclosure & Limited Use Requirement</span>
            </h2>
            <p className="text-blue-100 font-medium leading-relaxed">
              Placement Readiness Analyzer's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Google API Services User Data Policy
              </a>
              , including the <strong>Limited Use</strong> requirements.
            </p>
            <p className="text-slate-300 text-xs sm:text-sm">
              We do not transfer or disclose Google user data to third parties for advertising, marketing, or data broker operations. All data obtained through Google OAuth authentication is used strictly to authenticate user identity and facilitate authorized educational placement operations.
            </p>
          </section>

          {/* Section 3: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UserCheck className="text-blue-400" size={20} />
              <span>3. Information We Collect</span>
            </h2>
            <p>We collect the following categories of information when you access or use Placement Readiness Analyzer:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Google OAuth Account Information:</strong> Primary email address, display name, Google user ID, and profile picture URL provided during Google Single Sign-On (SSO).
              </li>
              <li>
                <strong className="text-white">Educational & Academic Profile Data:</strong> Student Register Number, department (e.g. AI&DS, CSE, IT, ECE, EEE, MECH, CIVIL), academic batch, CGPA, arrear/backlog status, resume information, and skill domain preferences.
              </li>
              <li>
                <strong className="text-white">Placement & Assessment Data:</strong> Scores from mock interviews, technical skill assessments, coding challenge results, company drive application history, and faculty evaluation notes.
              </li>
              <li>
                <strong className="text-white">Technical & Usage Logs:</strong> IP address, device type, browser characteristics, session timestamps, and authentication log records.
              </li>
            </ul>
          </section>

          {/* Section 4: How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Server className="text-blue-400" size={20} />
              <span>4. How We Use Your Information</span>
            </h2>
            <p>Your data is processed strictly for legitimate educational and placement purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white text-sm">Placement Readiness Analysis</div>
                <div className="text-xs text-slate-400">Calculating eligibility scores, identifying skill gaps, and generating placement analytics reports.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white text-sm">Recruitment Drive Matching</div>
                <div className="text-xs text-slate-400">Matching eligible students with visiting company criteria and notifying students of eligible drives.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white text-sm">Automated Email Notifications</div>
                <div className="text-xs text-slate-400">Sending application updates, assessment links, and placement announcements via Nodemailer/SMTP.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-white text-sm">Authentication & Platform Security</div>
                <div className="text-xs text-slate-400">Verifying authorized access for students, faculty, and placement officers.</div>
              </div>
            </div>
          </section>

          {/* Section 5: Data Protection & Zero Sale Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Lock className="text-blue-400" size={20} />
              <span>5. Data Sharing, Protection & Zero Sale Policy</span>
            </h2>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
              <div className="text-emerald-400 font-bold text-sm">STRICT NO-SALE GUARANTEE</div>
              <p className="text-slate-300 text-xs sm:text-sm">
                We do <strong>NOT</strong> sell, rent, trade, lease, or commercialize your personal information, academic data, or Google user profile data to any third-party advertisers, data brokers, or marketing networks under any circumstances.
              </p>
            </div>
            <p>
              Data is shared strictly with authorized personnel inside the educational institution (designated faculty advisors and placement officers) and trusted infrastructure providers required to operate the service (such as MongoDB Atlas for database hosting and SMTP email services).
            </p>
          </section>

          {/* Section 6: Data Security & Storage */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Eye className="text-blue-400" size={20} />
              <span>6. Data Security Protocols</span>
            </h2>
            <p>
              We implement industry-standard administrative, technical, and physical security measures to safeguard your information. All communications between your browser and our servers are encrypted in transit using SSL/TLS (HTTPS). Sensitive session credentials are secured with Json Web Tokens (JWT) and passwords are hashed using bcrypt. Database infrastructure is protected behind strict access control mechanisms.
            </p>
          </section>

          {/* Section 7: Data Retention & Deletion Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>7. Data Retention & Account Deletion Rights</span>
            </h2>
            <p>
              Your personal and academic data is retained for the duration of your educational enrollment or placement activity. You retain full control over your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Account & Data Deletion:</strong> You have the right to request full deletion of your account and associated personal records at any time. Submit your request to <a href="mailto:padmapriya0128@gmail.com" className="text-blue-400 underline">padmapriya0128@gmail.com</a>. Requests will be fulfilled within 30 days.
              </li>
              <li>
                <strong className="text-white">Revoking Google OAuth Access:</strong> You can disconnect Placement Readiness Analyzer’s access to your Google Account at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Account Security Settings</a>.
              </li>
              <li>
                <strong className="text-white">Data Rectification & Access:</strong> You may request a copy of your stored profile or request corrections to inaccurate academic records through your department faculty coordinator.
              </li>
            </ul>
          </section>

          {/* Section 8: Cookie & Session Token Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Shield className="text-blue-400" size={20} />
              <span>8. Session Tokens & Local Storage</span>
            </h2>
            <p>
              Placement Readiness Analyzer uses browser local storage (`auth_user`, `auth_token`, `auth_role`) exclusively to maintain your logged-in authentication state and user session preferences. We do not use third-party tracking cookies or advertising tracking pixels.
            </p>
          </section>

          {/* Section 9: Policy Revisions */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>9. Policy Revisions</span>
            </h2>
            <p>
              We reserve the right to update this Privacy Policy to reflect changes in regulatory requirements or platform capabilities. Material updates will be posted on this page with an updated "Last Updated" timestamp.
            </p>
          </section>

          {/* Section 10: Contact Us */}
          <section className="p-6 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Mail className="text-blue-400" size={20} />
              <span>10. Official Contact Information</span>
            </h2>
            <p className="text-slate-300">
              For any questions, privacy inquiries, data deletion requests, or Google OAuth compliance concerns, please contact our administrative team:
            </p>
            <div className="space-y-1 text-sm text-slate-200 font-mono pt-1">
              <div><strong>Platform Name:</strong> Placement Readiness Analyzer</div>
              <div><strong>Institution:</strong> Adithya Institute of Technology</div>
              <div><strong>Address:</strong> SF No. 564, Kurumbapalayam, SS Kulam Post, Coimbatore, Tamil Nadu 641107, India</div>
              <div><strong>Official Email:</strong> <a href="mailto:padmapriya0128@gmail.com" className="text-blue-400 underline">padmapriya0128@gmail.com</a></div>
              <div><strong>Google Client ID:</strong> 42082053527-gne4po151pucs66hqtima9ldavhi1nfp.apps.googleusercontent.com</div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 py-4">
          Placement Readiness Analyzer © 2026 Adithya Institute of Technology. All Rights Reserved.
        </div>

      </div>
    </div>
  );
}
