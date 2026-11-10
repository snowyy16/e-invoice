'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEMO_CREDENTIALS, loginUser } from '../../../lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.ADMIN.email);
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, 'ADMIN', password);
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập không thành công';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail(DEMO_CREDENTIALS.ADMIN.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.7) 0%, rgba(9, 13, 22, 1) 75%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        color: '#f8fafc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          boxShadow:
            '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Top Security Status Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#0b1120',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
              ADMIN CONSOLE • SSL SECURED
            </span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            TIÊU CHUẨN NỘI BỘ
          </span>
        </div>

        {/* Header Branding */}
        <div style={{ padding: '32px 28px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.4) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
            }}
          >
            🛡️
          </div>

          <h1
            data-testid="admin-login-title"
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            Đăng nhập Quản Trị Viên
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            Hệ thống Quản lý Phân quyền, Hạ tầng & Giám sát E-Invoice
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '0 28px 32px' }}>
          {error && (
            <div
              data-testid="admin-login-error"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
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
                <b style={{ color: '#ffffff' }}>Lỗi xác thực:</b> {error}
              </div>
            </div>
          )}

          {/* Quick Demo Credentials Pill */}
          <div
            style={{
              background: '#131d31',
              border: '1px dashed #2d3b55',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ⚡ Tài khoản Thử nghiệm Admin:
              </span>
              <button
                type="button"
                onClick={handleQuickFill}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Tự động điền ↵
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Email: <code style={{ color: '#93c5fd' }}>admin@einvoice.vn</code>{' '}
              | Mật khẩu: <code style={{ color: '#93c5fd' }}>password123</code>
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
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Email Quản trị viên
              </label>
              <input
                data-testid="admin-input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@einvoice.vn"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Mật khẩu
                </label>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Bảo mật cấp cao
                </span>
              </div>
              <input
                data-testid="admin-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              data-testid="btn-admin-login-submit"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                background: loading
                  ? '#475569'
                  : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                transition: 'opacity 0.2s',
              }}
            >
              {loading
                ? 'Đang xác thực hệ thống...'
                : 'Truy cập Admin Console →'}
            </button>
          </form>

          {/* Switcher to Accountant Portal */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #1e293b',
              textAlign: 'center',
              fontSize: '13px',
              color: '#94a3b8',
            }}
          >
            Bạn là nhân sự phòng Kế toán?{' '}
            <Link
              data-testid="link-to-accountant-login"
              href="/login/accountant"
              style={{
                color: '#38bdf8',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Cổng Đăng nhập Kế toán →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
