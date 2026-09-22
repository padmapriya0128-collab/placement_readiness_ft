import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, Loader2, KeyRound, GraduationCap, UserPlus } from 'lucide-react';
import { loginUser, registerUser, requestPasswordReset, verifyOTPAndReset, sendVerificationOTP, verifyLoginOTP } from '../api/auth';
import WatermarkBackground from '../components/WatermarkBackground';
import AdithyaLogo from '../components/AdithyaLogo';

interface LoginProps {
  onLoginSuccess: (user: any, role: 'Faculty' | 'Placement Faculty' | 'Student') => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
}

export default function Login({ onLoginSuccess, onNavigateToPrivacy, onNavigateToTerms }: LoginProps) {

  // Credentials
  const [role, setRole] = useState<'Faculty' | 'Placement Faculty' | 'Student'>('Faculty');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('AI&DS');
  const [regRole, setRegRole] = useState<'Faculty' | 'Placement Officer'>('Faculty');

  // Flow control states: 'login' | 'register' | 'forgot' | 'otp' | 'verify_gmail_otp'
  const [flow, setFlow] = useState<'login' | 'register' | 'forgot' | 'otp' | 'verify_gmail_otp'>('login');
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [gmailOtpValue, setGmailOtpValue] = useState('');

  // Password Recovery / OTP states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        roleSelected: role
      });

      if (result.requireOtp) {
        setPendingResult(result);
        setInfoMsg(result.message || `A 6-digit verification code has been sent to ${result.email || usernameOrEmail}.`);
        setFlow('verify_gmail_otp');
        setLoading(false);
        return;
      }

      // Secure local caching after successful login
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      localStorage.setItem('auth_role', result.role);
      localStorage.setItem('auth_token', result.token || '');

      setInfoMsg('Authenticated successfully! Opening dashboard...');
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(result.user, result.role);
      }, 500);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials and role.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        department: regDepartment,
        role: regRole
      });

      setPendingResult(result);
      setInfoMsg(result.message || `A 6-digit verification code has been dispatched to ${regEmail.trim()}.`);
      setUsernameOrEmail(regEmail.trim());
      setFlow('verify_gmail_otp');
      setLoading(false);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleVerifyGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!gmailOtpValue || gmailOtpValue.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const targetEmail = pendingResult?.user?.email || pendingResult?.email || usernameOrEmail.trim();
      const verifiedResult = await verifyLoginOTP(targetEmail, gmailOtpValue);

      const finalUser = verifiedResult.user || pendingResult?.user;
      const finalRole = verifiedResult.role || pendingResult?.role || role;
      const finalToken = verifiedResult.token || pendingResult?.token || '';

      // Secure local caching after successful OTP verification
      localStorage.setItem('auth_user', JSON.stringify(finalUser));
      localStorage.setItem('auth_role', finalRole);
      localStorage.setItem('auth_token', finalToken);

      setInfoMsg('Gmail Verified successfully! Opening dashboard...');
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(finalUser, finalRole);
      }, 800);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Gmail OTP Verification failed. Please check the code.');
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your registered email address or phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset({ emailOrPhone: emailOrPhone.trim() });
      setInfoMsg(response.message);
      setTimeout(() => {
        setLoading(false);
        setFlow('otp');
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to dispatch verification code.');
    }
  };

  const handleVerifyOTPAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otpValue || otpValue.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTPAndReset({
        emailOrPhone: emailOrPhone.trim(),
        otp: otpValue,
        newPassword
      });

      setInfoMsg(response.message);
      setTimeout(() => {
        setLoading(false);
        setFlow('login');
        setPassword('');
        setOtpValue('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Verification failed. Please check the OTP.');
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200/90 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      {/* Soft Ambient Background Radial Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <WatermarkBackground opacity={0.04} />

      {/* College & Portal Brand Header */}
      <div className="relative z-10 mb-5 flex flex-col items-center text-center space-y-2">
        <AdithyaLogo size="md" className="mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans leading-tight">
          Placement Readiness Analyzer
        </h1>
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-md bg-white/85 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-blue-900/10 p-8 space-y-6">
        
        {/* Mode Switcher Tabs (Sign In vs Register) */}
        {(flow === 'login' || flow === 'register') && (
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setFlow('login');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                flow === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setFlow('register');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                flow === 'register' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Status Messaging */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse flex-shrink-0"></span>
            <span>{infoMsg}</span>
          </div>
        )}

        {/* 1. STANDARD LOGIN FLOW */}
        {flow === 'login' && (
          <form onSubmit={handleStandardLogin} className="space-y-5">
            
            {/* Role Dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Authorized Role
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as any);
                  clearMessages();
                }}
                className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold"
              >
                <option value="Faculty">Placement Faculty</option>
                <option value="Placement Faculty">Placement Officer</option>
              </select>
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={role === 'Placement Faculty' ? 'placement@adithyatech.edu.in' : 'faculty@adithyatech.edu.in'}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setFlow('forgot');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 disabled:bg-slate-300 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}

        {/* 1B. NEW USER REGISTRATION FLOW */}
        {flow === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Target Role Dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Requested Role
              </label>
              <select
                value={regRole}
                onChange={(e) => {
                  setRegRole(e.target.value as any);
                  clearMessages();
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold"
              >
                <option value="Faculty">Placement Faculty</option>
                <option value="Placement Officer">Placement Officer</option>
              </select>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Prof. Alex Johnson"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Official Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder={regRole === 'Placement Officer' ? 'placement@adithyatech.edu.in' : 'faculty@adithyatech.edu.in'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Registration */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span>Processing Registration...</span>
                </>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <UserPlus size={16} />
                  <span>Register Account & Send Verification OTP</span>
                </span>
              )}
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD REQUEST FLOW */}
        {flow === 'forgot' && (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-950 flex items-center">
                <KeyRound size={18} className="mr-2 text-blue-600" />
                Reset Account Password
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide your registered Gmail ID or Mobile Number. We will transmit a secure 6-digit verification code.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Gmail or Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="faculty@gmail.com or +1 555-0100"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span>Transmitting security code...</span>
                </>
              ) : (
                <span>Send OTP Code</span>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setFlow('login');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                Cancel and Back
              </button>
            </div>
          </form>
        )}

        {/* 3. VERIFY OTP AND RESET CODE */}
        {flow === 'otp' && (
          <form onSubmit={handleVerifyOTPAndReset} className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-950 flex items-center">
                <KeyRound size={18} className="mr-2 text-blue-600" />
                Validate Verification Code
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter the 6-digit numeric security code transmitted to <strong className="text-slate-800 font-bold">{emailOrPhone}</strong>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 text-center text-lg font-bold tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                New Security Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span>Validating & Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setFlow('forgot');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                Re-request verification code
              </button>
            </div>
          </form>
        )}

        {/* 4. GMAIL OTP VERIFICATION FOR LOGIN */}
        {flow === 'verify_gmail_otp' && (
          <form onSubmit={handleVerifyGmailLogin} className="space-y-5">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Gmail Identity Verification
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                To complete sign in and open your page, enter the 6-digit verification code sent to <strong className="text-slate-800 font-bold">{pendingResult?.user?.email || usernameOrEmail}</strong>.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={gmailOtpValue}
                onChange={(e) => setGmailOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl font-black tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/10 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span>Verifying Gmail OTP...</span>
                </>
              ) : (
                <span>Verify Gmail & Open Dashboard</span>
              )}
            </button>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={async () => {
                  clearMessages();
                  setLoading(true);
                  const targetEmail = pendingResult?.user?.email || usernameOrEmail.trim();
                  try {
                    const res = await sendVerificationOTP(targetEmail);
                    setInfoMsg(res?.message || `A new 6-digit verification code has been sent to ${targetEmail}.`);
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to resend verification code.');
                  }
                  setLoading(false);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline focus:outline-none"
              >
                Resend OTP Code
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setFlow('login');
                  setPendingResult(null);
                  setGmailOtpValue('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Legal & Compliance Footer Links */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-center space-x-4 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={onNavigateToPrivacy}
            className="hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onNavigateToTerms}
            className="hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
          >
            Terms of Service
          </button>
        </div>

      </div>
    </div>
  );
}
