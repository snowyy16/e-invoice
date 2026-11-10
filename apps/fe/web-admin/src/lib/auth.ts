export type UserRole = 'ADMIN' | 'CHIEF_ACCOUNTANT' | 'ACCOUNTANT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export const DEMO_CREDENTIALS = {
  ADMIN: {
    email: 'admin@einvoice.vn',
    password: 'password123',
    role: 'ADMIN' as UserRole,
    fullName: 'Quản trị viên Hệ thống',
    description:
      'Toàn quyền cấu hình, quản lý người dùng & giám sát luồng hóa đơn',
  },
  CHIEF_ACCOUNTANT: {
    email: 'ketoantruong@einvoice.vn',
    password: 'password123',
    role: 'CHIEF_ACCOUNTANT' as UserRole,
    fullName: 'Nguyễn Văn A (Kế toán trưởng)',
    description: 'Duyệt hóa đơn, Ký số phát hành, Xác nhận thanh toán',
  },
  ACCOUNTANT: {
    email: 'ketoanvien@einvoice.vn',
    password: 'password123',
    role: 'ACCOUNTANT' as UserRole,
    fullName: 'Trần Thị B (Kế toán viên)',
    description: 'Lập hóa đơn mới, nhập thông tin thuế, gửi chờ duyệt',
  },
};

const STORAGE_KEY = 'einvoice_auth_user';
const TOKEN_KEY = 'einvoice_auth_token';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser, token?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginUser(
  email: string,
  portalType: 'ADMIN' | 'ACCOUNTANT',
  password?: string,
): Promise<{ user: AuthUser; token: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, portalType, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setStoredUser(data.user, data.token);
      return data;
    }

    const errorData = await res.json().catch(() => ({}));
    if (errorData.message) {
      throw new Error(errorData.message);
    }
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // Client-side fallback if backend service is offline
  const clean = email.trim().toLowerCase();
  let matched: {
    email: string;
    role: UserRole;
    fullName: string;
    id: string;
  } | null = null;

  if (clean === DEMO_CREDENTIALS.ADMIN.email.toLowerCase()) {
    matched = { ...DEMO_CREDENTIALS.ADMIN, id: 'user-admin-1' };
  } else if (clean === DEMO_CREDENTIALS.CHIEF_ACCOUNTANT.email.toLowerCase()) {
    matched = { ...DEMO_CREDENTIALS.CHIEF_ACCOUNTANT, id: 'user-chief-1' };
  } else if (clean === DEMO_CREDENTIALS.ACCOUNTANT.email.toLowerCase()) {
    matched = { ...DEMO_CREDENTIALS.ACCOUNTANT, id: 'user-acc-1' };
  }

  if (!matched) {
    throw new Error(`Không tìm thấy tài khoản với email: ${email}`);
  }

  if (portalType === 'ADMIN' && matched.role !== 'ADMIN') {
    throw new Error(
      'Tài khoản này thuộc bộ phận Kế toán. Vui lòng đăng nhập qua Cổng Kế toán!',
    );
  }

  if (portalType === 'ACCOUNTANT' && matched.role === 'ADMIN') {
    throw new Error(
      'Tài khoản Quản trị viên (ADMIN) vui lòng đăng nhập qua Cổng Quản trị viên!',
    );
  }

  const result = {
    user: {
      id: matched.id,
      email: matched.email,
      fullName: matched.fullName,
      role: matched.role,
    },
    token: `mock-token-${matched.role.toLowerCase()}-${Date.now()}`,
  };

  setStoredUser(result.user, result.token);
  return result;
}
