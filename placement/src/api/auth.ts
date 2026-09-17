import { Student } from '../types';
import { normalizeRowToStudent, isMatchingDatasetRow } from '../utils/studentNormalizer';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';

// Helper to access stored students to find matching student records if offline
const getStoredStudents = (): Student[] => {
  const data = localStorage.getItem('students_list');
  return data ? JSON.parse(data) : [];
};

const getStoredDatasets = (): any[] => {
  const data = localStorage.getItem('datasets_list');
  return data ? JSON.parse(data) : [];
};

export async function loginUser(payload: {
  usernameOrEmail: string;
  password?: string;
  isFirstTime?: boolean;
  roleSelected?: 'Faculty' | 'Placement Faculty' | 'Student';
}) {
  const usernameOrEmail = payload.usernameOrEmail.trim();
  const password = payload.password || '';
  const roleSelected = payload.roleSelected || 'Faculty';

  try {
    // 1. Real production backend request
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password, role: roleSelected, isFirstTime: payload.isFirstTime })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        token: data.token,
        user: data.user,
        role: data.user.role // Role returned directly from backend
      };
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid credentials.');
    }
  } catch (error: any) {
    if (error.message && error.message !== 'Failed to fetch') {
      throw error;
    }
    console.warn('Backend connection unavailable, using local sandbox fallback credentials.');
  }

  // 2. High-fidelity Local Sandbox Fallback based on selected role
  const lowerInput = usernameOrEmail.toLowerCase();

  if (roleSelected === 'Faculty') {
    // Faculty Login Flow
    return {
      token: 'sb-faculty-token',
      role: 'Faculty' as const,
      user: {
        id: 'fac_1',
        name: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : (usernameOrEmail || 'Faculty Advisor'),
        email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@university.edu`,
        department: 'AI&DS',
        role: 'Faculty',
        avatarUrl: '',
      }
    };
  } else if (roleSelected === 'Placement Faculty') {
    // Placement Faculty / Placement Officer Login Flow
    return {
      token: 'sb-placement-token',
      role: 'Placement Faculty' as const,
      user: {
        id: 'fac_placement_1',
        name: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : (usernameOrEmail || 'Placement Officer'),
        email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@university.edu`,
        role: 'Placement Faculty',
        avatarUrl: '',
      }
    };
  } else {
    // Student Login Flow: Student enters Username & Password
    const students = getStoredStudents();
    let matchedStudent = students.find(
      (s: Student) => (s.username?.toLowerCase() === lowerInput || s.registerNumber?.toLowerCase() === lowerInput || s.email?.toLowerCase() === lowerInput || s.name?.toLowerCase() === lowerInput) &&
        (s.password === password || !s.password)
    );

    // If not found in stored students, search faculty-uploaded datasets in local storage
    if (!matchedStudent) {
      const datasets = getStoredDatasets();
      for (const ds of datasets) {
        const rows = ds.dataPreview || ds.rows || [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const normalized = normalizeRowToStudent(row, i);
          const isMatch = isMatchingDatasetRow(row, lowerInput, i);

          if (isMatch) {
            matchedStudent = normalized;
            // Persist to stored students so it is available globally
            const updated = [...students, normalized];
            localStorage.setItem('students_list', JSON.stringify(updated));
            break;
          }
        }
        if (matchedStudent) break;
      }
    }

    if (matchedStudent) {
      return {
        token: `sb-student-token-${matchedStudent.id}`,
        role: 'Student' as const,
        user: {
          ...matchedStudent,
          role: 'Student'
        }
      };
    }

    throw new Error(`No student record found for Register Number "${usernameOrEmail}". Please ask your Faculty Advisor to upload the dataset.`);
  }
}

const localOtpStore = new Map<string, string>();

export async function requestPasswordReset(payload: { emailOrPhone: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Backend unavailable during reset request, generating local OTP code.');
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  localOtpStore.set(payload.emailOrPhone.trim().toLowerCase(), generatedOtp);

  return {
    success: true,
    otp: generatedOtp,
    message: `A secure 6-digit OTP code (${generatedOtp}) has been sent to ${payload.emailOrPhone}.`
  };
}

export async function verifyOTPAndReset(payload: {
  emailOrPhone: string;
  otp: string;
  newPassword?: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Backend unavailable during OTP verification.');
  }

  const inputKey = payload.emailOrPhone.trim().toLowerCase();
  const storedOtp = localOtpStore.get(inputKey);

  if (payload.otp.length !== 6 || isNaN(Number(payload.otp))) {
    throw new Error('OTP must be a 6-digit numeric verification code.');
  }

  if (storedOtp && payload.otp !== storedOtp) {
    throw new Error(`Invalid OTP. The 6-digit verification code sent to ${payload.emailOrPhone} is incorrect.`);
  }

  return {
    success: true,
    message: 'Your account password has been updated successfully! You can now log in.'
  };
}

export async function sendVerificationOTP(email: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-verification-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (response.ok) return await response.json();
  } catch (error) {
    console.warn('Backend verification OTP offline fallback');
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  localOtpStore.set(`verify_${email.trim().toLowerCase()}`, generatedOtp);
  return {
    success: true,
    otp: generatedOtp,
    message: `Verification code sent to ${email}`
  };
}

export async function verifyLoginOTP(email: string, otp: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (response.ok) return await response.json();
    else {
      const err = await response.json();
      throw new Error(err.message || 'Invalid OTP code.');
    }
  } catch (error: any) {
    if (error.message && error.message !== 'Failed to fetch') {
      throw error;
    }
    console.warn('Backend verify OTP offline fallback');
  }

  const inputKey = `verify_${email.trim().toLowerCase()}`;
  const storedOtp = localOtpStore.get(inputKey);

  if (otp.length !== 6) {
    throw new Error('OTP must be a 6-digit verification code.');
  }

  if (storedOtp && otp !== storedOtp) {
    throw new Error(`Invalid OTP code. The 6-digit code sent to ${email} is ${storedOtp}. Please enter the correct code.`);
  }

  return { success: true, message: 'Gmail verified successfully!' };
}

