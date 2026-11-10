'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEMO_CREDENTIALS, loginUser } from '../../../lib/auth';

export default function AccountantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.CHIEF_ACCOUNTANT.email);
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, 'ACCOUNTANT', password);
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập không thành công';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (role: 'CHIEF_ACCOUNTANT' | 'ACCOUNTANT') => {
    setEmail(DEMO_CREDENTIALS[role].email);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, #e2e8f0 0%, #f8fafc 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Top Status Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#059669',
              }}
            />
            <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
              ACCOUNTING PORTAL • TỔNG CỤC THUẾ KẾT NỐI
            </span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#ecfdf5',
              color: '#047857',
              fontWeight: 700,
              fontSize: '10px',
              border: '1px solid #a7f3d0',
            }}
          >
            HỆ THỐNG NỘI BỘ
          </span>
        </div>

        {/* Header */}
        <div style={{ padding: '32px 28px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
            }}
          >
            💼
          </div>

          <h1
            data-testid="accountant-login-title"
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
            }}
          >
            Cổng Đăng Nhập Kế Toán
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
            Dùng chung cho Kế toán viên (Lập hóa đơn) & Kế toán trưởng (Ký số &
            Duyệt phát hành)
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '0 28px 32px' }}>
          {error && (
            <div
              data-testid="accountant-login-error"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: 1.4,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <span>⚠️</span>
              <div>
                <b>Lỗi đăng nhập:</b> {error}
              </div>
            </div>
          )}

          {/* Quick Role Selection Cards */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              ⚡ Chọn nhanh tài khoản mẫu:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <button
                type="button"
                data-testid="btn-demo-chief"
                onClick={() => handleSelectDemo('CHIEF_ACCOUNTANT')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '10px',
                  border: email.includes('ketoantruong')
                    ? '2px solid #7c3aed'
                    : '1px solid #e2e8f0',
                  background: email.includes('ketoantruong')
                    ? '#f5f3ff'
                    : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
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
                  Quyền Ký số & Duyệt HĐ
                </div>
              </button>

              <button
                type="button"
                data-testid="btn-demo-accountant"
                onClick={() => handleSelectDemo('ACCOUNTANT')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '10px',
                  border: email.includes('ketoanvien')
                    ? '2px solid #0284c7'
                    : '1px solid #e2e8f0',
                  background: email.includes('ketoanvien')
                    ? '#f0f9ff'
                    : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
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
                  Quyền Lập hóa đơn mới
                </div>
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Email Tài khoản Kế toán
              </label>
              <input
                data-testid="accountant-input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ketoan@einvoice.vn"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: '#0f172a',
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
                  color: '#334155',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Mật khẩu
              </label>
              <input
                data-testid="accountant-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <button
              data-testid="btn-accountant-login-submit"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                background: loading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                transition: 'opacity 0.2s',
              }}
            >
              {loading
                ? 'Đang xác thực hệ thống...'
                : 'Đăng nhập vào Hệ thống Kế toán →'}
            </button>
          </form>

          {/* Switch to Admin Portal */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            Bạn là Quản trị viên hệ thống?{' '}
            <Link
              data-testid="link-to-admin-login"
              href="/login/admin"
              style={{
                color: '#dc2626',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Chuyển sang Cổng Admin →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
