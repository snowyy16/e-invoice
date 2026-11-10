'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_CREDENTIALS, loginUser } from '../../lib/auth';

function LoginPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [activeTab, setActiveTab] = useState<'ACCOUNTANT' | 'ADMIN'>(
    roleParam === 'admin' ? 'ADMIN' : 'ACCOUNTANT',
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'ADMIN') {
      setEmail(DEMO_CREDENTIALS.ADMIN.email);
    } else {
      setEmail(DEMO_CREDENTIALS.CHIEF_ACCOUNTANT.email);
    }
    setError('');
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, activeTab, password);
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập không thành công';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (
    type: 'ADMIN' | 'CHIEF_ACCOUNTANT' | 'ACCOUNTANT',
  ) => {
    setEmail(DEMO_CREDENTIALS[type].email);
    setPassword('password123');
    setError('');
  };

  const isAdmin = activeTab === 'ADMIN';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isAdmin ? '#090d16' : '#f8fafc',
        backgroundImage: isAdmin
          ? 'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.7) 0%, rgba(9, 13, 22, 1) 75%)'
          : 'radial-gradient(circle at 50% 0%, #e2e8f0 0%, #f8fafc 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: isAdmin ? '#0f172a' : '#ffffff',
          border: isAdmin ? '1px solid #1e293b' : '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: isAdmin
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Portal Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: isAdmin ? '#090d16' : '#f1f5f9',
            borderBottom: isAdmin ? '1px solid #1e293b' : '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            data-testid="tab-accountant"
            onClick={() => setActiveTab('ACCOUNTANT')}
            style={{
              padding: '16px 12px',
              border: 'none',
              background:
                activeTab === 'ACCOUNTANT'
                  ? isAdmin
                    ? '#0f172a'
                    : '#ffffff'
                  : 'transparent',
              color:
                activeTab === 'ACCOUNTANT'
                  ? '#059669'
                  : isAdmin
                    ? '#64748b'
                    : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom:
                activeTab === 'ACCOUNTANT'
                  ? '3px solid #059669'
                  : '3px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ letterSpacing: '0.02em' }}>💼 CỔNG KẾ TOÁN</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: activeTab === 'ACCOUNTANT' ? '#10b981' : '#94a3b8',
              }}
            >
              Kế toán viên & Kế toán trưởng
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-admin"
            onClick={() => setActiveTab('ADMIN')}
            style={{
              padding: '16px 12px',
              border: 'none',
              background:
                activeTab === 'ADMIN'
                  ? isAdmin
                    ? '#0f172a'
                    : '#ffffff'
                  : 'transparent',
              color:
                activeTab === 'ADMIN'
                  ? '#ef4444'
                  : isAdmin
                    ? '#64748b'
                    : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom:
                activeTab === 'ADMIN'
                  ? '3px solid #ef4444'
                  : '3px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ letterSpacing: '0.02em' }}>🛡️ CỔNG QUẢN TRỊ</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: activeTab === 'ADMIN' ? '#f87171' : '#94a3b8',
              }}
            >
              Dành riêng cho ADMIN
            </span>
          </button>
        </div>

        {/* Header Description */}
        <div
          style={{
            padding: '24px 28px 16px',
            textAlign: 'center',
            color: isAdmin ? '#f8fafc' : '#0f172a',
          }}
        >
          <h2
            data-testid="login-portal-title"
            style={{
              margin: '0 0 6px',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {isAdmin
              ? 'Đăng nhập Quản Trị Viên (Admin Portal)'
              : 'Đăng nhập Bộ Phận Kế Toán (Accountant Portal)'}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: isAdmin ? '#94a3b8' : '#64748b',
              lineHeight: 1.5,
            }}
          >
            {isAdmin
              ? 'Hệ thống Quản lý Phân quyền, Cấu hình & Giám sát E-Invoice'
              : 'Dùng chung cho Kế toán viên (Lập hóa đơn) & Kế toán trưởng (Ký số & Duyệt)'}
          </p>
        </div>

        {/* Content Form */}
        <div style={{ padding: '0 28px 28px' }}>
          {error && (
            <div
              data-testid="login-error-message"
              style={{
                background: isAdmin ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                border: isAdmin
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid #fecaca',
                color: isAdmin ? '#fca5a5' : '#b91c1c',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              ⚠️ <b>Lỗi xác thực:</b> {error}
            </div>
          )}

          {/* Quick Demo Selection */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isAdmin ? '#94a3b8' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              ⚡ Đăng nhập nhanh tài khoản thử nghiệm:
            </div>

            {isAdmin ? (
              <button
                type="button"
                data-testid="btn-quick-admin"
                onClick={() => handleSelectDemo('ADMIN')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#131d31',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#f87171',
                    }}
                  >
                    🔴 Tài khoản Quản trị viên (ADMIN)
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '2px',
                    }}
                  >
                    admin@einvoice.vn | Mật khẩu: password123
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#60a5fa',
                    fontWeight: 600,
                  }}
                >
                  Điền mẫu ↵
                </span>
              </button>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  data-testid="btn-quick-chief"
                  onClick={() => handleSelectDemo('CHIEF_ACCOUNTANT')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: email.includes('ketoantruong')
                      ? '2px solid #7c3aed'
                      : '1px solid #e2e8f0',
                    background: email.includes('ketoantruong')
                      ? '#f5f3ff'
                      : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#6d28d9',
                    }}
                  >
                    🟣 Kế toán trưởng
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    ketoantruong@einvoice.vn
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="btn-quick-accountant"
                  onClick={() => handleSelectDemo('ACCOUNTANT')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: email.includes('ketoanvien')
                      ? '2px solid #0284c7'
                      : '1px solid #e2e8f0',
                    background: email.includes('ketoanvien')
                      ? '#f0f9ff'
                      : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#0369a1',
                    }}
                  >
                    🔵 Kế toán viên
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    ketoanvien@einvoice.vn
                  </div>
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isAdmin ? '#cbd5e1' : '#334155',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Email Đăng nhập ({isAdmin ? 'Admin' : 'Kế toán'})
              </label>
              <input
                data-testid="portal-input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isAdmin ? 'admin@einvoice.vn' : 'ketoan@einvoice.vn'
                }
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: isAdmin ? '1px solid #334155' : '1px solid #cbd5e1',
                  background: isAdmin ? '#090d16' : '#ffffff',
                  color: isAdmin ? '#ffffff' : '#0f172a',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isAdmin ? '#cbd5e1' : '#334155',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Mật khẩu
              </label>
              <input
                data-testid="portal-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: isAdmin ? '1px solid #334155' : '1px solid #cbd5e1',
                  background: isAdmin ? '#090d16' : '#ffffff',
                  color: isAdmin ? '#ffffff' : '#0f172a',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              data-testid="btn-portal-submit"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '12px 16px',
                background: loading
                  ? '#94a3b8'
                  : isAdmin
                    ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: isAdmin
                  ? '0 4px 14px rgba(220, 38, 38, 0.4)'
                  : '0 4px 14px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {loading
                ? 'Đang xác thực hệ thống...'
                : isAdmin
                  ? 'Đăng nhập vào Hệ thống Admin →'
                  : 'Đăng nhập vào Hệ thống Kế toán →'}
            </button>
          </form>

          {/* Direct Link Shortcuts */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: isAdmin ? '1px solid #1e293b' : '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <Link
              href="/login/accountant"
              style={{
                color: '#059669',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              🔗 Trang riêng Kế toán
            </Link>
            <Link
              href="/login/admin"
              style={{
                color: '#dc2626',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              🔗 Trang riêng Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <LoginPortalContent />
    </Suspense>
  );
}
