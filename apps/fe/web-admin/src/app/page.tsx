'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AuthUser,
  getStoredUser,
  clearStoredUser,
  setStoredUser,
  DEMO_CREDENTIALS,
} from '../lib/auth';
import { numberToVietnameseWords } from '@e-invoice/utils';

type Status = 'PENDING' | 'ISSUED' | 'PAID';

interface InvoiceCard {
  id: string;
  invoiceNumber: string;
  lookupCode: string;
  buyerName: string;
  buyerTaxCode: string;
  buyerEmail?: string;
  subTotal?: number;
  vatAmount?: number;
  totalAmount: number;
  status: Status;
  taxAuthorityCode?: string;
  signedAt?: string;
  signedBy?: string;
}

interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive?: boolean;
}

const INITIAL_INVOICES: InvoiceCard[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0001',
    lookupCode: 'EINV-DEMO01',
    buyerName: 'Công ty TNHH Công Nghệ FPT',
    buyerTaxCode: '0101248141',
    buyerEmail: 'ketoan@fpt.com',
    subTotal: 10000000,
    vatAmount: 800000,
    totalAmount: 10800000,
    status: 'ISSUED',
    taxAuthorityCode: 'CQT-0101248141-2601A98BC',
    signedAt: '2026-11-10T14:30:00.000Z',
    signedBy: 'Nguyễn Văn A (Kế toán trưởng)',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-0002',
    lookupCode: 'EINV-DEMO02',
    buyerName: 'Tập đoàn Viễn thông Viettel',
    buyerTaxCode: '0100109106',
    buyerEmail: 'billing@viettel.com.vn',
    subTotal: 24000000,
    vatAmount: 2400000,
    totalAmount: 26400000,
    status: 'PENDING',
  },
];

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [invoices, setInvoices] = useState<InvoiceCard[]>(INITIAL_INVOICES);
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'USERS'>('KANBAN');
  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxCode, setBuyerTaxCode] = useState('');
  const [amount, setAmount] = useState('5400000');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceCard | null>(
    null,
  );

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }

    fetch(`${API_URL}/invoices`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setInvoices(data);
      })
      .catch((err) => {
        console.warn('Invoices fetch fallback:', err);
      });

    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch((err) => {
        console.warn('Users fetch fallback:', err);
      });
  }, [API_URL]);

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
  };

  const handleSwitchDemoUser = (
    roleKey: 'ADMIN' | 'CHIEF_ACCOUNTANT' | 'ACCOUNTANT',
  ) => {
    const cred = DEMO_CREDENTIALS[roleKey];
    const newUser: AuthUser = {
      id: `demo-${roleKey.toLowerCase()}`,
      email: cred.email,
      fullName: cred.fullName,
      role: cred.role,
    };
    setStoredUser(newUser);
    setCurrentUser(newUser);
  };

  const moveStatus = (id: string, nextStatus: Status) => {
    const signer = currentUser?.fullName || 'Nguyễn Văn A (Kế toán trưởng)';
    const nowStr = new Date().toISOString();
    const mockCqt = `CQT-VN-${Date.now().toString(36).toUpperCase()}`;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: nextStatus,
              taxAuthorityCode:
                nextStatus === 'ISSUED'
                  ? inv.taxAuthorityCode || mockCqt
                  : inv.taxAuthorityCode,
              signedAt:
                nextStatus === 'ISSUED' ? inv.signedAt || nowStr : inv.signedAt,
              signedBy:
                nextStatus === 'ISSUED' ? inv.signedBy || signer : inv.signedBy,
            }
          : inv,
      ),
    );

    fetch(`${API_URL}/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: nextStatus,
        signedBy: signer,
      }),
    }).catch((err) => {
      console.warn('Status update API error:', err);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerTaxCode) return;
    const numAmount = Number(amount) || 0;
    const subTotal = Math.round(numAmount / 1.08);
    const vatAmount = numAmount - subTotal;
    const nextNum = String(invoices.length + 1).padStart(4, '0');

    const newInvoice: InvoiceCard = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${nextNum}`,
      lookupCode: `EINV-NEW${invoices.length + 1}`,
      buyerName,
      buyerTaxCode,
      buyerEmail: 'khachhang@company.vn',
      subTotal,
      vatAmount,
      totalAmount: numAmount,
      status: 'PENDING',
    };
    setInvoices([newInvoice, ...invoices]);
    setBuyerName('');
    setBuyerTaxCode('');

    fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName,
        buyerTaxCode,
        buyerEmail: 'khachhang@company.vn',
        items: [
          {
            name: 'Hóa đơn dịch vụ điện tử',
            unit: 'Gói',
            quantity: 1,
            unitPrice: subTotal,
            vatRate: 8,
          },
        ],
      }),
    }).catch((err) => {
      console.warn('Invoice create API error:', err);
    });
  };

  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const issuedCount = invoices.filter((i) => i.status === 'ISSUED').length;
  const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;

  const columns: {
    key: Status;
    label: string;
    color: string;
    badgeBg: string;
    badgeColor: string;
  }[] = [
    {
      key: 'PENDING',
      label: '1. Chờ Kế toán trưởng duyệt',
      color: '#d97706',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
    },
    {
      key: 'ISSUED',
      label: '2. Đã ký số & Phát hành',
      color: '#2563eb',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
    },
    {
      key: 'PAID',
      label: '3. Đã thanh toán',
      color: '#059669',
      badgeBg: '#d1fae5',
      badgeColor: '#047857',
    },
  ];

  const isChiefAccountant = currentUser?.role === 'CHIEF_ACCOUNTANT';
  const isAccountant = currentUser?.role === 'ACCOUNTANT';
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <main
      style={{
        padding: '24px 32px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        maxWidth: '1280px',
        margin: '0 auto',
        color: '#0f172a',
        background: '#ffffff',
      }}
    >
      {/* Top Application Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            ⚡
          </div>
          <div>
            <div
              style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}
            >
              E-INVOICE ENTERPRISE
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Chuẩn Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC
            </div>
          </div>
        </div>

        {/* User Auth Info / Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                data-testid="user-role-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background:
                    currentUser.role === 'ADMIN'
                      ? '#fee2e2'
                      : currentUser.role === 'CHIEF_ACCOUNTANT'
                        ? '#ede9fe'
                        : '#e0f2fe',
                  color:
                    currentUser.role === 'ADMIN'
                      ? '#b91c1c'
                      : currentUser.role === 'CHIEF_ACCOUNTANT'
                        ? '#6d28d9'
                        : '#0369a1',
                  border:
                    currentUser.role === 'ADMIN'
                      ? '1px solid #fecaca'
                      : currentUser.role === 'CHIEF_ACCOUNTANT'
                        ? '1px solid #ddd6fe'
                        : '1px solid #bae6fd',
                }}
              >
                <span>
                  {currentUser.role === 'ADMIN' && '🛡️'}
                  {currentUser.role === 'CHIEF_ACCOUNTANT' && '🟣'}
                  {currentUser.role === 'ACCOUNTANT' && '🔵'}
                </span>
                <span>{currentUser.role}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {currentUser.fullName}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {currentUser.email}
                </div>
              </div>

              {/* Quick switch test pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderLeft: '1px solid #cbd5e1',
                  paddingLeft: '10px',
                  marginLeft: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchDemoUser('ACCOUNTANT')}
                  title="Chuyển sang quyền Kế toán viên"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #0284c7',
                    background: isAccountant ? '#0284c7' : '#ffffff',
                    color: isAccountant ? '#ffffff' : '#0284c7',
                    cursor: 'pointer',
                  }}
                >
                  Kế toán viên
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchDemoUser('CHIEF_ACCOUNTANT')}
                  title="Chuyển sang quyền Kế toán trưởng"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #7c3aed',
                    background: isChiefAccountant ? '#7c3aed' : '#ffffff',
                    color: isChiefAccountant ? '#ffffff' : '#7c3aed',
                    cursor: 'pointer',
                  }}
                >
                  Kế toán trưởng
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchDemoUser('ADMIN')}
                  title="Chuyển sang quyền Quản trị viên"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #dc2626',
                    background: isAdmin ? '#dc2626' : '#ffffff',
                    color: isAdmin ? '#ffffff' : '#dc2626',
                    cursor: 'pointer',
                  }}
                >
                  Admin
                </button>
              </div>

              <button
                data-testid="btn-logout"
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  marginLeft: '4px',
                }}
              >
                Đăng xuất ⎋
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                data-testid="nav-login-accountant"
                href="/login/accountant"
                style={{
                  padding: '7px 14px',
                  background: '#0d9488',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>💼 Cổng Kế toán</span>
              </Link>
              <Link
                data-testid="nav-login-admin"
                href="/login/admin"
                style={{
                  padding: '7px 14px',
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid #334155',
                }}
              >
                <span>🛡️ Cổng Admin</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Title & Key Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h1
            data-testid="admin-title"
            style={{
              margin: '0 0 4px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            E-Invoice Admin & Kanban Portal
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Hệ thống Quản trị & Phát hành Hóa đơn điện tử chuẩn Production
          </p>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            Chờ KTT Duyệt
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#d97706',
              marginTop: '2px',
            }}
          >
            {pendingCount}{' '}
            <span
              style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}
            >
              hóa đơn
            </span>
          </div>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            Đã Ký & Thanh toán
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#059669',
              marginTop: '2px',
            }}
          >
            {issuedCount + paidCount}{' '}
            <span
              style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}
            >
              hóa đơn
            </span>
          </div>
        </div>

        <div
          data-testid="total-revenue"
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#1e40af',
              textTransform: 'uppercase',
            }}
          >
            Tổng giá trị Hóa đơn
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              color: '#1d4ed8',
              marginTop: '2px',
            }}
          >
            {totalRevenue.toLocaleString('vi-VN')} VNĐ
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher if user is ADMIN */}
      {isAdmin && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '10px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('KANBAN')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'KANBAN' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'KANBAN' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📋</span> Bảng Tiến trình Hóa đơn (Kanban)
          </button>
          <button
            type="button"
            data-testid="tab-user-management"
            onClick={() => setActiveTab('USERS')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'USERS' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'USERS' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👥</span> Quản lý Người dùng & Phân quyền Hệ thống
            (PostgreSQL)
          </button>
        </div>
      )}

      {/* Admin User Management Section */}
      {isAdmin && activeTab === 'USERS' ? (
        <section
          data-testid="admin-users-section"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                Danh sách Tài khoản Phân quyền Hệ thống
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                Đồng bộ trực tiếp từ cơ sở dữ liệu phân quyền PostgreSQL (bảng
                users)
              </p>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#059669',
                background: '#ecfdf5',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
              }}
            >
              ● Database Online (PostgreSQL)
            </span>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                }}
              >
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>
                  Họ và tên
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>
                  Email Đăng nhập
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>
                  Vai trò (Role)
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>
                  Cổng Đăng nhập Phụ trách
                </th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {(usersList.length > 0
                ? usersList
                : Object.values(DEMO_CREDENTIALS)
              ).map((u, idx) => (
                <tr
                  key={u.email || idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s',
                  }}
                >
                  <td
                    style={{
                      padding: '14px 18px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background:
                            u.role === 'ADMIN'
                              ? '#fee2e2'
                              : u.role === 'CHIEF_ACCOUNTANT'
                                ? '#ede9fe'
                                : '#e0f2fe',
                          color:
                            u.role === 'ADMIN'
                              ? '#b91c1c'
                              : u.role === 'CHIEF_ACCOUNTANT'
                                ? '#6d28d9'
                                : '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {u.fullName.slice(0, 1)}
                      </div>
                      <span>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    <code>{u.email}</code>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          u.role === 'ADMIN'
                            ? '#fee2e2'
                            : u.role === 'CHIEF_ACCOUNTANT'
                              ? '#ede9fe'
                              : '#e0f2fe',
                        color:
                          u.role === 'ADMIN'
                            ? '#b91c1c'
                            : u.role === 'CHIEF_ACCOUNTANT'
                              ? '#6d28d9'
                              : '#0369a1',
                        border:
                          u.role === 'ADMIN'
                            ? '1px solid #fecaca'
                            : u.role === 'CHIEF_ACCOUNTANT'
                              ? '1px solid #ddd6fe'
                              : '1px solid #bae6fd',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {u.role === 'ADMIN' ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        🛡️ Cổng Admin (/login/admin)
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        💼 Cổng Kế toán (/login/accountant)
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '14px 18px',
                      color: '#059669',
                      fontWeight: 700,
                    }}
                  >
                    ● Hoạt động
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Invoice Creation Form and Kanban Board */}
      {(!isAdmin || activeTab === 'KANBAN') && (
        <>
          {/* Create Invoice Form */}
          <form
            onSubmit={handleCreate}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1fr auto',
              gap: '12px',
              marginBottom: '24px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              borderRadius: '12px',
              alignItems: 'end',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Đơn vị Mua hàng
              </label>
              <input
                data-testid="input-buyer-name"
                placeholder="Tên công ty hoặc khách hàng..."
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Mã Số Thuế (MST)
              </label>
              <input
                data-testid="input-tax-code"
                placeholder="10 hoặc 13 số (VD: 0101248141)"
                value={buyerTaxCode}
                onChange={(e) => setBuyerTaxCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Tổng tiền (VNĐ)
              </label>
              <input
                data-testid="input-amount"
                type="number"
                placeholder="Tổng tiền VNĐ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              data-testid="btn-create-invoice"
              type="submit"
              style={{
                padding: '10px 18px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                height: '38px',
                transition: 'background 0.2s',
              }}
            >
              + Lập Hóa Đơn
            </button>
          </form>

          {/* Kanban Board */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '18px',
            }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                data-testid={`kanban-col-${col.key}`}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `2px solid ${col.color}`,
                    paddingBottom: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    {col.label}
                  </h3>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: col.badgeBg,
                      color: col.badgeColor,
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {invoices.filter((i) => i.status === col.key).length}
                  </span>
                </div>

                {/* Cards List */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {invoices
                    .filter((i) => i.status === col.key)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        data-testid={`invoice-card-${inv.invoiceNumber}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          padding: '14px 16px',
                          borderRadius: '10px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {/* Invoice Number & Code */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '13px',
                              color: '#0f172a',
                            }}
                          >
                            {inv.invoiceNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                            }}
                          >
                            MÃ: {inv.lookupCode}
                          </span>
                        </div>

                        {/* Buyer Name */}
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#1e293b',
                            lineHeight: 1.3,
                          }}
                        >
                          {inv.buyerName}
                        </div>

                        {/* Buyer Tax Code */}
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          MST: <b>{inv.buyerTaxCode}</b>
                        </div>

                        {/* CQT code if issued */}
                        {inv.taxAuthorityCode && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#059669',
                              fontFamily: 'monospace',
                            }}
                          >
                            ✓ CQT: {inv.taxAuthorityCode}
                          </div>
                        )}

                        {/* Total Amount */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginTop: '4px',
                            paddingTop: '6px',
                            borderTop: '1px dashed #f1f5f9',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Tổng thanh toán:
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '15px',
                              color: '#059669',
                            }}
                          >
                            {inv.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          {col.key === 'PENDING' && (
                            <button
                              data-testid={`btn-issue-${inv.invoiceNumber}`}
                              onClick={() => {
                                if (isAccountant) {
                                  alert(
                                    'Chỉ Kế toán trưởng (CHIEF_ACCOUNTANT) mới có thẩm quyền ký số & duyệt phát hành hóa đơn!',
                                  );
                                  return;
                                }
                                moveStatus(inv.id, 'ISSUED');
                              }}
                              style={{
                                width: '100%',
                                padding: '7px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: isAccountant
                                  ? '#94a3b8'
                                  : '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isAccountant
                                  ? 'not-allowed'
                                  : 'pointer',
                                transition: 'background 0.15s',
                              }}
                              title={
                                isAccountant
                                  ? 'Chỉ Kế toán trưởng có thẩm quyền duyệt'
                                  : 'Ký số & Phát hành'
                              }
                            >
                              {isAccountant
                                ? '⏳ Chờ KTT Ký duyệt'
                                : 'Ký số & Phát hành (TT78) →'}
                            </button>
                          )}

                          {col.key === 'ISSUED' && (
                            <button
                              data-testid={`btn-paid-${inv.invoiceNumber}`}
                              onClick={() => moveStatus(inv.id, 'PAID')}
                              style={{
                                width: '100%',
                                padding: '7px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                            >
                              Xác nhận Thanh toán ✓
                            </button>
                          )}

                          {/* Preview VAT Invoice & Print Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>👁️ Xem Hóa đơn GTGT / In PDF</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* OFFICIAL VAT INVOICE PREVIEW MODAL (Chuẩn Thông tư 78/2021/TT-BTC) */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Actions Header */}
            <div
              style={{
                padding: '12px 24px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                BẢN THỂ HIỆN HÓA ĐƠN ĐIỆN TỬ • THÔNG TƯ 78/2021/TT-BTC
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🖨️ In Hóa Đơn / Lưu PDF
                </button>
                <a
                  href={`${API_URL}/invoices/${selectedInvoice.id}/xml`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '6px 12px',
                    background: '#059669',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ⬇️ Tải XML Gốc (TT78)
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    padding: '6px 12px',
                    background: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Official Invoice Sheet */}
            <div
              id="printable-invoice"
              style={{
                padding: '36px 40px',
                color: '#0f172a',
                fontFamily: 'serif',
                lineHeight: 1.4,
              }}
            >
              {/* Header Box */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '16px',
                      textTransform: 'uppercase',
                    }}
                  >
                    CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    Mã số thuế: <b>0108999888</b>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Địa chỉ: Tòa nhà Công Nghệ FPT, Cầu Giấy, TP. Hà Nội
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Điện thoại: 1900 6868 | Email: contact@einvoice.vn
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '220px' }}>
                  <div style={{ fontSize: '13px' }}>
                    Mẫu số: <b>1C26TAA</b>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    Ký hiệu: <b>C26TAA</b>
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#dc2626',
                    }}
                  >
                    Số: {selectedInvoice.invoiceNumber}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: '4px',
                    }}
                  >
                    Mã tra cứu: <b>{selectedInvoice.lookupCode}</b>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                </h2>
                <div
                  style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: '#64748b',
                    marginTop: '4px',
                  }}
                >
                  (Bản thể hiện của hóa đơn điện tử khởi tạo từ hệ thống
                  E-Invoice)
                </div>
                {selectedInvoice.taxAuthorityCode && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#059669',
                      fontWeight: 700,
                      marginTop: '6px',
                      fontFamily: 'monospace',
                    }}
                  >
                    Mã của Cơ quan Thuế: {selectedInvoice.taxAuthorityCode}
                  </div>
                )}
              </div>

              {/* Buyer Info */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  Đơn vị mua hàng: <b>{selectedInvoice.buyerName}</b>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Mã số thuế: <b>{selectedInvoice.buyerTaxCode}</b>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Email nhận hóa đơn:{' '}
                  {selectedInvoice.buyerEmail || 'khachhang@company.vn'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  Hình thức thanh toán: <b>Chuyển khoản (CK)</b> | Đồng tiền:{' '}
                  <b>VND</b>
                </div>
              </div>

              {/* Items Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        width: '40px',
                        textAlign: 'center',
                      }}
                    >
                      STT
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'left',
                      }}
                    >
                      Tên hàng hóa, dịch vụ
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        width: '70px',
                        textAlign: 'center',
                      }}
                    >
                      ĐVT
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        width: '60px',
                        textAlign: 'center',
                      }}
                    >
                      Số lượng
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        width: '110px',
                        textAlign: 'right',
                      }}
                    >
                      Đơn giá
                    </th>
                    <th
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        width: '120px',
                        textAlign: 'right',
                      }}
                    >
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                      }}
                    >
                      1
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600,
                      }}
                    >
                      Dịch vụ Hóa đơn điện tử E-Invoice Enterprise
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                      }}
                    >
                      Gói
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'center',
                      }}
                    >
                      1
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'right',
                      }}
                    >
                      {(
                        selectedInvoice.subTotal ||
                        Math.round(selectedInvoice.totalAmount / 1.08)
                      ).toLocaleString('vi-VN')}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #cbd5e1',
                        textAlign: 'right',
                        fontWeight: 700,
                      }}
                    >
                      {(
                        selectedInvoice.subTotal ||
                        Math.round(selectedInvoice.totalAmount / 1.08)
                      ).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '13px',
                  borderTop: '2px solid #0f172a',
                  paddingTop: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Cộng tiền hàng (tiền trước thuế):</span>
                  <b>
                    {(
                      selectedInvoice.subTotal ||
                      Math.round(selectedInvoice.totalAmount / 1.08)
                    ).toLocaleString('vi-VN')}{' '}
                    VND
                  </b>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>
                    Thuế suất GTGT: <b>8%</b> | Tiền thuế GTGT:
                  </span>
                  <b>
                    {(
                      selectedInvoice.vatAmount ||
                      selectedInvoice.totalAmount -
                        Math.round(selectedInvoice.totalAmount / 1.08)
                    ).toLocaleString('vi-VN')}{' '}
                    VND
                  </b>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    fontWeight: 900,
                    color: '#0f172a',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '8px',
                  }}
                >
                  <span>Tổng cộng tiền thanh toán:</span>
                  <span style={{ color: '#16a34a' }}>
                    {selectedInvoice.totalAmount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontStyle: 'italic',
                    marginTop: '4px',
                  }}
                >
                  Số tiền viết bằng chữ:{' '}
                  <b>{numberToVietnameseWords(selectedInvoice.totalAmount)}</b>
                </div>
              </div>

              {/* Signatures Footer */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginTop: '32px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Người mua hàng
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    (Ký, ghi rõ họ tên)
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Người bán hàng
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    (Ký số điện tử)
                  </div>

                  {/* Stamp Digital Signature Box */}
                  {selectedInvoice.status !== 'PENDING' ? (
                    <div
                      style={{
                        margin: '16px auto 0',
                        maxWidth: '260px',
                        border: '2px solid #dc2626',
                        borderRadius: '8px',
                        padding: '10px',
                        color: '#dc2626',
                        fontSize: '11px',
                        lineHeight: 1.3,
                        textAlign: 'left',
                        background: '#fef2f2',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        ✓ KÝ SỐ ĐIỆN TỬ HỢP LỆ
                      </div>
                      <div>
                        Được ký bởi:{' '}
                        <b>
                          {selectedInvoice.signedBy ||
                            'Nguyễn Văn A (Kế toán trưởng)'}
                        </b>
                      </div>
                      <div>
                        Cơ quan: <b>CÔNG TY CP CÔNG NGHỆ E-INVOICE</b>
                      </div>
                      <div>
                        Ngày ký:{' '}
                        {selectedInvoice.signedAt
                          ? new Date(
                              selectedInvoice.signedAt,
                            ).toLocaleDateString('vi-VN')
                          : '10/11/2026'}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#991b1b',
                          marginTop: '2px',
                        }}
                      >
                        Chứng thư số Viettel-CA / SHA-256
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '20px',
                        fontSize: '12px',
                        color: '#d97706',
                        fontStyle: 'italic',
                      }}
                    >
                      (Chưa ký số - Chờ Kế toán trưởng phê duyệt)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
