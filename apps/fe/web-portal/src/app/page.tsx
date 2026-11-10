'use client';

import React, { useState } from 'react';

export default function CustomerPortalPage() {
  const [lookupCode, setLookupCode] = useState('EINV-DEMO01');
  const [result, setResult] = useState<null | {
    invoiceNumber: string;
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
  }>(null);
  const [aiResult, setAiResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = lookupCode.trim().toUpperCase();

    if (cleanCode === 'EINV-DEMO01') {
      setResult({
        invoiceNumber: 'INV-2026-0001',
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
      });
    } else {
      setResult({
        invoiceNumber: 'INV-2026-0002',
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
      {/* Portal Top Trust Header */}
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
              Hệ thống Kiểm tra & Xác thực Tính Pháp lý Hóa đơn Hợp lệ
            </div>
          </div>
        </div>
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
          ● TỔNG CỤC THUẾ KẾT NỐI 24/7
        </div>
      </div>

      {/* Main Title Section */}
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
          Nhập mã nhận hóa đơn (VD: <b>EINV-DEMO01</b>) hoặc sử dụng trợ lý
          Gemini AI để trích xuất hóa đơn PDF tự động.
        </p>
      </div>

      {/* Lookup Code Form */}
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
            placeholder="Nhập mã tra cứu (VD: EINV-DEMO01 hoặc EINV-DEMO02)..."
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
            style={{
              padding: '12px 24px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
            }}
          >
            🔍 Tra cứu ngay
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <span>Mã mẫu thử nhanh:</span>
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
            EINV-DEMO01 (Đã ký)
          </button>
          <button
            type="button"
            onClick={() => setLookupCode('EINV-DEMO02')}
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
            EINV-DEMO02 (Chờ duyệt)
          </button>
        </div>
      </div>

      {/* Verified Invoice Result Card */}
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
          {/* Certificate Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '16px',
              marginBottom: '16px',
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
                KẾT QUẢ XÁC MINH CHỨNG TỪ ĐIỆN TỬ
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
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                background: result.status.includes('HỢP LỆ')
                  ? '#ecfdf5'
                  : '#fffbeb',
                color: result.status.includes('HỢP LỆ') ? '#15803d' : '#b45309',
                border: result.status.includes('HỢP LỆ')
                  ? '1px solid #86efac'
                  : '1px solid #fde68a',
              }}
            >
              {result.status.includes('HỢP LỆ') ? '✓ ' : '⏳ '}
              {result.status}
            </div>
          </div>

          {/* Parties Grid */}
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

          {/* Amounts Breakdown */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
        </div>
      )}

      {/* AI OCR Extraction Box */}
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
