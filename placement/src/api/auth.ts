import { Student } from '../types';
import { normalizeRowToStudent, isMatchingDatasetRow } from '../utils/studentNormalizer';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password?: string;
  department?: string;
  role?: 'Faculty' | 'Placement Faculty' | 'Placement Officer';
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const data = await response.json();
    return {
      token: data.token,
      user: data.user,
      role: data.role || payload.role,
      requireOtp: data.requireOtp,
      email: data.email || payload.email,
      message: data.message
    };
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Registration failed.');
  }
}

export async function loginUser(payload: {
  usernameOrEmail: string;
  password?: string;
  isFirstTime?: boolean;
  roleSelected?: 'Faculty' | 'Placement Faculty' | 'Placement Officer' | 'Student';
}) {
  const usernameOrEmail = payload.usernameOrEmail.trim();
  const password = payload.password || '';
  const roleSelected = payload.roleSelected || 'Faculty';

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
      role: data.role || data.user?.role || roleSelected,
      requireOtp: data.requireOtp,
      email: data.email || usernameOrEmail,
      message: data.message
    };
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Authentication failed. Please verify your credentials and role.');
  }
}

export async function sendVerificationOTP(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/send-verification-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to send verification code.');
  }
}

export async function verifyLoginOTP(email: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Invalid or expired verification code.');
  }
}

export async function requestPasswordReset(payload: { emailOrPhone: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to dispatch password reset code.');
  }
}

export async function verifyOTPAndReset(payload: {
  emailOrPhone: string;
  otp: string;
  newPassword?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Invalid or expired OTP verification code.');
  }
}

export async function getCurrentUserSession(token: string) {
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Session verification endpoint unavailable');
  }
  return null;
}

export async function logoutUser(token?: string) {
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (err) {
    // Ignore error on logout
  }
}
