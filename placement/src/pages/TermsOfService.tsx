import React from 'react';
import { Shield, FileText, ArrowLeft, ExternalLink, CheckCircle2, AlertTriangle, UserCheck, Scale, Lock, Mail } from 'lucide-react';

interface TermsOfServiceProps {
  onBack?: () => void;
  onNavigateToPrivacy?: () => void;
}

export default function TermsOfService({ onBack, onNavigateToPrivacy }: TermsOfServiceProps) {
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

          {onNavigateToPrivacy && (
            <button
              onClick={onNavigateToPrivacy}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Privacy Policy</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
            <CheckCircle2 size={14} />
            <span>Google OAuth 2.0 Compliant Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Effective Date: <strong className="text-white">September 9, 2026</strong> | Last Updated: <strong className="text-white">September 9, 2026</strong>
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Please read these Terms of Service ("Terms") carefully before using Placement Readiness Analyzer ("Platform"), operated by Adithya Institute of Technology. By logging into or using the Platform, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Main Content Body */}
        <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
          
          {/* Section 1: Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, creating an account on, or logging into Placement Readiness Analyzer using credentials or Google Single Sign-On (SSO), you affirm that you are an authorized student, faculty member, placement coordinator, or institutional administrator of Adithya Institute of Technology and agree to comply with all rules and conditions set forth in these Terms.
            </p>
          </section>

          {/* Section 2: Platform Description */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UserCheck className="text-blue-400" size={20} />
              <span>2. Description of Platform & Services</span>
            </h2>
            <p>
              Placement Readiness Analyzer is an educational technology and placement management platform designed to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Analyze student academic metrics, skill sets, and interview readiness.</li>
              <li>Provide interactive mock assessments, technical evaluation feedback, and AI resume analysis.</li>
              <li>Coordinate campus recruitment drives, company eligibility filtering, and student application routing.</li>
              <li>Dispatch automated status emails and placement notifications via email integration.</li>
            </ul>
          </section>

          {/* Section 3: User Obligations & Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Lock className="text-blue-400" size={20} />
              <span>3. User Accounts & Security Obligations</span>
            </h2>
            <p>Users are subject to the following security obligations:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Accurate Information:</strong> You must provide accurate, current, and complete academic and personal information (including your official Register Number, CGPA, department, and email).
              </li>
              <li>
                <strong className="text-white">Credential Confidentiality:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account session.
              </li>
              <li>
                <strong className="text-white">Unauthorized Access Notification:</strong> You agree to immediately notify the placement administration team at <a href="mailto:padmapriya0128@gmail.com" className="text-blue-400 underline">padmapriya0128@gmail.com</a> if you suspect any unauthorized access to your account.
              </li>
            </ul>
          </section>

          {/* Section 4: Acceptable Use Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="text-amber-400" size={20} />
              <span>4. Acceptable Use Policy</span>
            </h2>
            <p>When using Placement Readiness Analyzer, you agree NOT to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 text-sm">No Misrepresentation</div>
                <div className="text-xs text-slate-400">Provide false Register Numbers, fake academic grades, forged arrear certificates, or impersonate other students or faculty.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 text-sm">No Automated Scraping</div>
                <div className="text-xs text-slate-400">Use bots, scrapers, or automated tools to extract data from student registries or company placement lists.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 text-sm">No Malicious Interference</div>
                <div className="text-xs text-slate-400">Upload viruses, malware, or attempt to compromise server security or database integrity.</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 text-sm">No Unauthorized Assessment Sharing</div>
                <div className="text-xs text-slate-400">Distribute proprietary assessment content, coding challenge answers, or company recruitment questions.</div>
              </div>
            </div>
          </section>

          {/* Section 5: Google OAuth & Third-Party Integration */}
          <section className="p-5 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-3">
            <h2 className="text-xl font-bold text-blue-300 flex items-center space-x-2">
              <Shield className="text-blue-400" size={20} />
              <span>5. Google OAuth & Third-Party Services Integration</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Placement Readiness Analyzer integrates Google Single Sign-On (OAuth 2.0) to provide secure user authentication. Your interaction with Google OAuth is governed by Google's Terms of Service and Privacy Policy.
            </p>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              We strictly adhere to the <strong>Google API Services User Data Policy</strong>, including the <strong>Limited Use</strong> requirements. Google account profile information is used exclusively for account verification and educational placement operations.
            </p>
          </section>

          {/* Section 6: Intellectual Property Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Scale className="text-blue-400" size={20} />
              <span>6. Intellectual Property Rights</span>
            </h2>
            <p>
              All software source code, user interface designs, database schemas, scoring algorithms, and branding assets associated with Placement Readiness Analyzer are the exclusive intellectual property of Placement Readiness Analyzer / Adithya Institute of Technology.
            </p>
            <p>
              Users retain ownership of their individual uploaded resumes and personal profile data submitted to the Platform.
            </p>
          </section>

          {/* Section 7: Limitation of Liability & Disclaimer of Warranties */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="text-amber-400" size={20} />
              <span>7. Disclaimer of Warranties & Limitation of Liability</span>
            </h2>
            <p>
              Placement Readiness Analyzer is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for maximum precision and uptime:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>We do not guarantee that the Platform will operate completely error-free or uninterrupted.</li>
              <li>Readiness analytics and mock assessment scores serve as evaluative tools and do not constitute a legal guarantee of employment with visiting companies.</li>
              <li>In no event shall Placement Readiness Analyzer or Adithya Institute of Technology be liable for indirect, incidental, or consequential damages resulting from service usage.</li>
            </ul>
          </section>

          {/* Section 8: Termination & Account Suspension */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>8. Termination & Account Suspension</span>
            </h2>
            <p>
              We reserve the right to terminate or suspend access to your account immediately, without prior notice, if you breach these Terms, submit falsified academic records, or engage in unauthorized access to the Platform.
            </p>
          </section>

          {/* Section 9: Governing Law & Jurisdiction */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Scale className="text-blue-400" size={20} />
              <span>9. Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, specifically the jurisdiction of courts in Tamil Nadu, India.
            </p>
          </section>

          {/* Section 10: Contact Information */}
          <section className="p-6 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Mail className="text-blue-400" size={20} />
              <span>10. Official Contact Information</span>
            </h2>
            <p className="text-slate-300">
              For any legal inquiries, terms compliance questions, or technical support, please contact us:
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
