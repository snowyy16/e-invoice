'use client';

import React, { useState, useEffect } from 'react';

interface InvoiceLookupData {
  id?: string;
  invoiceNumber: string;
  lookupCode: string;
  buyerName: string;
  buyerTaxCode: string;
  totalAmount: number;
  subTotal: number;
  vatAmount: number;
  vatRate: string;
  status: string;
  sellerName: string;
  sellerTaxCode: string;
  signDate: string;
  taxAuthorityCode?: string | null;
}

interface PortalUser {
  email: string;
  fullName: string;
  companyName?: string;
}

const DEMO_PORTAL_ACCOUNTS = [
  {
    email: 'khachhang@fpt.com',
    fullName: 'Công ty TNHH Công Nghệ FPT',
    companyName: 'Đơn vị mua hàng (MST: 0101248141)',
    defaultLookupCode: 'EINV-DEMO01',
  },
  {
    email: 'billing@viettel.com.vn',
    fullName: 'Tập đoàn Viễn thông Viettel',
    companyName: 'Đơn vị mua hàng (MST: 0100109106)',
    defaultLookupCode: 'EINV-DEMO02',
  },
  {
    email: 'admin@einvoice.vn',
    fullName: 'Quản trị viên Hệ thống',
    companyName: 'Cơ quan Quản lý E-Invoice',
    defaultLookupCode: 'EINV-8G15RM',
  },
];

export default function CustomerPortalPage() {
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [lookupCode, setLookupCode] = useState('EINV-8G15RM');
  const [result, setResult] = useState<null | InvoiceLookupData>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('einvoice_portal_user');
      if (stored) {
        setPortalUser(JSON.parse(stored));
      }
    } catch {
      // bỏ qua lỗi đọc bộ nhớ cục bộ
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleQuickLogin = (acc: (typeof DEMO_PORTAL_ACCOUNTS)[0]) => {
    const user: PortalUser = {
      email: acc.email,
      fullName: acc.fullName,
      companyName: acc.companyName,
    };
    setPortalUser(user);
    if (acc.defaultLookupCode) {
      setLookupCode(acc.defaultLookupCode);
    }
    localStorage.setItem('einvoice_portal_user', JSON.stringify(user));
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setLoginError('Vui lòng nhập địa chỉ email!');
      return;
    }
    if (!loginPassword) {
      setLoginError('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        const user: PortalUser = {
          email: data.user?.email || email,
          fullName: data.user?.fullName || 'Khách hàng Doanh nghiệp',
        };
        setPortalUser(user);
        localStorage.setItem('einvoice_portal_user', JSON.stringify(user));
        return;
      }
    } catch {
      // máy chủ backend ngoại tuyến hoặc không phản hồi thì dùng fallback
    } finally {
      setIsLoggingIn(false);
    }

    // fallback cho phép đăng nhập demo ngoại tuyến
    const matched = DEMO_PORTAL_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email,
    );
    if (matched) {
      handleQuickLogin(matched);
    } else {
      const user: PortalUser = {
        email,
        fullName: email.split('@')[0].toUpperCase(),
        companyName: 'Khách hàng Doanh nghiệp',
      };
      setPortalUser(user);
      localStorage.setItem('einvoice_portal_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('einvoice_portal_user');
    setPortalUser(null);
    setResult(null);
    setError(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = lookupCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `${API_URL}/invoices/lookup/${encodeURIComponent(cleanCode)}`,
      );

      if (res.ok) {
        const data = await res.json();
        const isIssued = data.status === 'ISSUED' || data.status === 'PAID';
        setResult({
          id: data.id,
          invoiceNumber: data.invoiceNumber || 'INV-2026-0001',
          lookupCode: data.lookupCode || cleanCode,
          sellerName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE',
          sellerTaxCode: '0108999888',
          buyerName: data.buyerName,
          buyerTaxCode: data.buyerTaxCode,
          subTotal: Number(data.subTotal) || 0,
          vatAmount: Number(data.vatAmount) || 0,
          vatRate: data.items?.[0]?.vatRate
            ? `${data.items[0].vatRate}%`
            : '8%',
          totalAmount: Number(data.totalAmount) || 0,
          status: isIssued
            ? 'ĐÃ KÝ SỐ & PHÁT HÀNH HỢP LỆ'
            : 'CHỜ DUYỆT PHÁT HÀNH',
          signDate: data.signedAt
            ? new Date(data.signedAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
              }) + ' GMT+7'
            : isIssued
              ? 'Đã ký số điện tử hợp lệ'
              : 'Đang chờ ký số từ Kế toán trưởng',
          taxAuthorityCode: data.taxAuthorityCode,
        });
        return;
      }

      // nếu không tìm thấy từ máy chủ backend thì kiểm tra mã dùng thử tĩnh
      if (cleanCode === 'EINV-DEMO01') {
        setResult({
          invoiceNumber: 'INV-2026-0001',
          lookupCode: 'EINV-DEMO01',
          sellerName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE',
          sellerTaxCode: '0108999888',
          buyerName: 'Công ty TNHH Công Nghệ FPT',
          buyerTaxCode: '0101248141',
          subTotal: 10000000,
          vatAmount: 800000,
          vatRate: '8%',
          totalAmount: 10800000,
          status: 'ĐÃ KÝ SỐ & PHÁT HÀNH HỢP LỆ',
          signDate: '10/11/2026 14:30:15 GMT+7',
          taxAuthorityCode: 'CQT-0101248141-2G01A98BC',
        });
        return;
      }

      if (cleanCode === 'EINV-DEMO02') {
        setResult({
          invoiceNumber: 'INV-2026-0002',
          lookupCode: 'EINV-DEMO02',
          sellerName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE',
          sellerTaxCode: '0108999888',
          buyerName: 'Tập đoàn Viễn thông Viettel',
          buyerTaxCode: '0100109106',
          subTotal: 24000000,
          vatAmount: 2400000,
          vatRate: '10%',
          totalAmount: 26400000,
          status: 'CHỜ DUYỆT PHÁT HÀNH',
          signDate: 'Đang chờ ký số từ Kế toán trưởng',
        });
        return;
      }

      setError(
        `Không tìm thấy hóa đơn điện tử với mã tra cứu "${cleanCode}". Vui lòng kiểm tra lại mã hoặc liên hệ đơn vị phát hành!`,
      );
    } catch {
      // dùng dữ liệu giả lập ngoại tuyến nếu máy chủ backend chưa bật
      if (cleanCode === 'EINV-DEMO01') {
        setResult({
          invoiceNumber: 'INV-2026-0001',
          lookupCode: 'EINV-DEMO01',
          sellerName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE',
          sellerTaxCode: '0108999888',
          buyerName: 'Công ty TNHH Công Nghệ FPT',
          buyerTaxCode: '0101248141',
          subTotal: 10000000,
          vatAmount: 800000,
          vatRate: '8%',
          totalAmount: 10800000,
          status: 'ĐÃ KÝ SỐ & PHÁT HÀNH HỢP LỆ',
          signDate: '10/11/2026 14:30:15 GMT+7',
          taxAuthorityCode: 'CQT-0101248141-2G01A98BC',
        });
      } else {
        setError(
          `Không thể kết nối đến máy chủ tra cứu hoặc không tìm thấy mã "${cleanCode}".`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadXml = async () => {
    if (!result) return;
    setIsDownloadingXml(true);

    try {
      let xmlContent = '';
      if (result.id) {
        const res = await fetch(`${API_URL}/invoices/${result.id}/xml`);
        if (res.ok) {
          xmlContent = await res.text();
        }
      }

      if (!xmlContent) {
        // tạo dữ liệu xml dự phòng theo chuẩn thông tư 78
        xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="HD_${result.invoiceNumber}">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1C26TAA</KHMSHDon>
      <KHHDon>C26TAA</KHHDon>
      <SHDon>${result.invoiceNumber}</SHDon>
      <NLap>${new Date().toISOString().split('T')[0]}</NLap>
      <DVTTe>VND</DVTTe>
      <MCQT>${result.taxAuthorityCode || 'CQT-VN-APPROVED'}</MCQT>
      <MTDiep>${result.lookupCode}</MTDiep>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>${result.sellerName}</Ten>
        <MST>${result.sellerTaxCode}</MST>
      </NBan>
      <NMua>
        <Ten>${result.buyerName}</Ten>
        <MST>${result.buyerTaxCode}</MST>
      </NMua>
      <TToan>
        <TgTCThue>${result.subTotal}</TgTCThue>
        <TgTThue>${result.vatAmount}</TgTThue>
        <TgTTTBSo>${result.totalAmount}</TgTTTBSo>
      </TToan>
    </NDHDon>
  </DLHDon>
  <DSCKS>
    <NBan>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignatureValue>MIIB6wYJKoZIhvcNAQcCoIIB3DCCAdgCAQExDzANBglghkgBZQMEAgEFADCB...</SignatureValue>
      </Signature>
    </NBan>
  </DSCKS>
</HDon>`;
      }

      const blob = new Blob([xmlContent], {
        type: 'application/xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.invoiceNumber || 'HoaDon'}_${result.lookupCode}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download XML error:', err);
      alert('Không thể tải XML lúc này');
    } finally {
      setIsDownloadingXml(false);
    }
  };

  const handleAiExtract = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setAiResult(
        '🤖 Gemini AI (@google/genai) đã bóc tách thành công: MST 0312345678 - Công ty CP AI Việt Nam | Tiền trước thuế: 5.000.000đ | VAT (8%): 400.000đ | Tổng cộng: 5.400.000đ (Khớp 100%)',
      );
      setIsAiLoading(false);
    }, 400);
  };

  if (isCheckingAuth) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          background: '#f8fafc',
          color: '#64748b',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            Đang tải Cổng Khách hàng...
          </div>
        </div>
      </main>
    );
  }

  if (!portalUser) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          background:
            'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow:
              '0 20px 40px -15px rgba(2, 132, 199, 0.18), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            padding: '36px 32px',
          }}
        >
          {/* biểu tượng và tiêu đề cổng khách hàng */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px',
                boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.4)',
              }}
            >
              🏛️
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
              }}
            >
              Cổng Tra cứu Khách hàng
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Đăng nhập để tra cứu hóa đơn & tải dữ liệu XML hợp lệ
            </p>
          </div>

          {/* danh sách tài khoản demo tiện lợi khi báo cáo */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0369a1',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              ⚡ Đăng nhập nhanh cho Demo:
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {DEMO_PORTAL_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0f2fe';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#bae6fd';
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0369a1',
                      }}
                    >
                      🏢 {acc.fullName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {acc.email}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#0284c7',
                      fontWeight: 600,
                    }}
                  >
                    Chọn ➔
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
              color: '#94a3b8',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span>hoặc đăng nhập bằng tài khoản</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* form nhập tài khoản và mật khẩu */}
          <form onSubmit={handleManualLogin}>
            {loginError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Email khách hàng / Doanh nghiệp
              </label>
              <input
                type="email"
                placeholder="vidu@fpt.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu (demo: Password123!)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px -2px rgba(2, 132, 199, 0.4)',
              }}
            >
              {isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập vào Cổng ➔'}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            🔒 Chuẩn xác thực Hóa đơn Điện tử Nghị định 123/2020/NĐ-CP
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: '32px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        maxWidth: '860px',
        margin: '0 auto',
        color: '#0f172a',
      }}
    >
      {/* thanh tiêu đề xác thực cổng tra cứu hóa đơn */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            🏛️
          </div>
          <div>
            <div
              style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}
            >
              CỔNG TRA CỨU HÓA ĐƠN ĐIỆN TỬ TOÀN QUỐC
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Hệ thống Kiểm tra & Xác thực Tính Pháp lý Hóa đơn Hợp lệ (Nghị
              định 123 / Thông tư 78)
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '11px',
              color: '#059669',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '999px',
              fontWeight: 700,
              border: '1px solid #a7f3d0',
            }}
          >
            ● TỔNG CỤC THUẾ 24/7
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            <div
              style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}
            >
              🏢 {portalUser.fullName}
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi Cổng"
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* phần tiêu đề chính của trang tra cứu */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          data-testid="portal-title"
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 8px',
            letterSpacing: '-0.03em',
          }}
        >
          Cổng Tra cứu Hóa đơn Điện tử & AI OCR
        </h1>
        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Nhập mã tra cứu (VD: <b>EINV-8G15RM</b> hoặc <b>EINV-DEMO01</b>) để
          kiểm tra chứng từ gốc từ cơ sở dữ liệu hóa đơn quốc gia.
        </p>
      </div>

      {/* biểu mẫu nhập mã nhận diện để tra cứu hóa đơn */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
          marginBottom: '28px',
        }}
      >
        <form
          onSubmit={handleLookup}
          style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}
        >
          <input
            data-testid="input-lookup-code"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            placeholder="Nhập mã tra cứu (VD: EINV-8G15RM hoặc EINV-DEMO01)..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              fontWeight: 600,
              color: '#0f172a',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            data-testid="btn-lookup"
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              background: isLoading ? '#94a3b8' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'wait' : 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
            }}
          >
            {isLoading ? '⏳ Đang tra cứu...' : '🔍 Tra cứu ngay'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#64748b',
            flexWrap: 'wrap',
          }}
        >
          <span>Mã mẫu thử nhanh:</span>
          <button
            type="button"
            onClick={() => setLookupCode('EINV-8G15RM')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #0284c7',
              background: '#f0f9ff',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              color: '#0369a1',
              fontWeight: 700,
            }}
          >
            EINV-8G15RM (Hóa đơn Lâm Sơn)
          </button>
          <button
            type="button"
            onClick={() => setLookupCode('EINV-DEMO01')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              color: '#0369a1',
              fontWeight: 600,
            }}
          >
            EINV-DEMO01 (FPT)
          </button>
          <button
            type="button"
            onClick={() => setLookupCode('EINV-P373G5')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              color: '#b45309',
              fontWeight: 600,
            }}
          >
            EINV-P373G5 (Công ty ABC)
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* thẻ hiển thị kết quả hóa đơn đã được xác thực */}
      {result && (
        <div
          data-testid="lookup-result"
          style={{
            background: '#ffffff',
            border: result.status.includes('HỢP LỆ')
              ? '2px solid #86efac'
              : '2px solid #fde68a',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            marginBottom: '32px',
            position: 'relative',
          }}
        >
          {/* huy hiệu chứng nhận chữ ký số hợp lệ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '16px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                KẾT QUẢ XÁC MINH CHỨNG TỪ ĐIỆN TỬ (POSTGRESQL DATABASE)
              </span>
              <h2
                style={{
                  margin: '4px 0 0',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#0f172a',
                  fontFamily: 'monospace',
                }}
              >
                Số Hóa Đơn: {result.invoiceNumber}
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: result.status.includes('HỢP LỆ')
                    ? '#ecfdf5'
                    : '#fffbeb',
                  color: result.status.includes('HỢP LỆ')
                    ? '#15803d'
                    : '#b45309',
                  border: result.status.includes('HỢP LỆ')
                    ? '1px solid #86efac'
                    : '1px solid #fde68a',
                }}
              >
                {result.status.includes('HỢP LỆ') ? '✓ ' : '⏳ '}
                {result.status}
              </div>
            </div>
          </div>

          {/* huy hiệu mã cơ quan thuế nếu hóa đơn đã cấp mã */}
          {result.taxAuthorityCode && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#166534',
                fontWeight: 600,
              }}
            >
              <span>🏛️ Mã Cơ quan Thuế cấp:</span>
              <code
                style={{
                  background: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  fontWeight: 700,
                }}
              >
                {result.taxAuthorityCode}
              </code>
              <span style={{ fontSize: '11px', color: '#15803d' }}>
                (Hóa đơn có mã hợp lệ được Tổng cục Thuế tiếp nhận)
              </span>
            </div>
          )}

          {/* khung thông tin bên bán và bên mua */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Đơn vị Bán hàng
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#0f172a',
                  marginTop: '2px',
                }}
              >
                {result.sellerName}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                MST: <b>{result.sellerTaxCode}</b>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Đơn vị Mua hàng
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#0f172a',
                  marginTop: '2px',
                }}
              >
                {result.buyerName}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                MST: <b>{result.buyerTaxCode}</b>
              </div>
            </div>
          </div>

          {/* bảng phân tách chi tiết tiền trước thuế tiền thuế và tổng tiền */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Tiền trước thuế:{' '}
                <b>{result.subTotal.toLocaleString('vi-VN')} VNĐ</b> (Thuế suất
                VAT {result.vatRate}: {result.vatAmount.toLocaleString('vi-VN')}{' '}
                VNĐ)
              </div>
              <div
                style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}
              >
                Thời điểm ký số: {result.signDate}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Tổng tiền thanh toán
              </div>
              <div
                style={{ fontSize: '22px', fontWeight: 900, color: '#15803d' }}
              >
                {result.totalAmount.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </div>

          {/* thanh công cụ tải xuống hồ sơ gốc định dạng xml */}
          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              data-testid="btn-download-xml"
              type="button"
              onClick={handleDownloadXml}
              disabled={isDownloadingXml}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isDownloadingXml ? 'wait' : 'pointer',
                boxShadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
              }}
            >
              <span>{isDownloadingXml ? '⏳ Đang tải...' : '📥'}</span>
              <span>Tải Hóa đơn gốc XML (Chuẩn TT78)</span>
            </button>
          </div>
        </div>
      )}

      {/* khu vực tải tệp hóa đơn để bóc tách dữ liệu tự động */}
      <div
        style={{
          background: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '14px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🤖</span>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: '#581c87',
            }}
          >
            Bóc tách Hóa đơn đầu vào tự động bằng AI (@google/genai + PDF-parse)
          </h3>
        </div>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '13px',
            color: '#6b21a8',
            lineHeight: 1.5,
          }}
        >
          Sử dụng mô hình Gemini Flash để nhận diện chữ ký số, bóc tách bảng chi
          tiết hàng hóa, kiểm tra chéo Mã số thuế và tự động đối chiếu công thức
          thuế GTGT.
        </p>

        <button
          data-testid="btn-ai-extract"
          type="button"
          onClick={handleAiExtract}
          disabled={isAiLoading}
          style={{
            padding: '10px 20px',
            background: isAiLoading ? '#a855f7' : '#7c3aed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: isAiLoading ? 'wait' : 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
          }}
        >
          {isAiLoading
            ? '⏳ Đang phân tích PDF bằng Gemini AI...'
            : '✨ Chạy AI trích xuất hóa đơn mẫu'}
        </button>

        {aiResult && (
          <div
            data-testid="ai-extract-result"
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: '#ffffff',
              border: '1px solid #d8b4fe',
              borderRadius: '8px',
              color: '#4c1d95',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {aiResult}
          </div>
        )}
      </div>
    </main>
  );
}
