import { IInvoiceCalculation, IInvoiceItem } from '@e-invoice/interfaces';

/**
 * Tính toán tổng tiền trước thuế, tiền thuế VAT và tổng thanh toán của hóa đơn
 */
export function calculateInvoiceTotals(
  items: IInvoiceItem[],
): IInvoiceCalculation {
  if (!items || items.length === 0) {
    return { subTotal: 0, vatAmount: 0, totalAmount: 0 };
  }

  let subTotal = 0;
  let vatAmount = 0;

  for (const item of items) {
    if (item.quantity < 0 || item.unitPrice < 0) {
      throw new Error('Quantity and unitPrice must be non-negative');
    }
    const lineSubTotal = item.quantity * item.unitPrice;
    const lineVat = Math.round((lineSubTotal * item.vatRate) / 100);

    subTotal += lineSubTotal;
    vatAmount += lineVat;
  }

  return {
    subTotal,
    vatAmount,
    totalAmount: subTotal + vatAmount,
  };
}

/**
 * Kiểm tra định dạng Mã số thuế doanh nghiệp Việt Nam (10 số hoặc 13 số dạng 0123456789-001)
 */
export function isValidVietnamTaxCode(taxCode: string): boolean {
  const regex = /^\d{10}(-\d{3})?$/;
  return regex.test(taxCode.trim());
}

/**
 * Sinh mã tra cứu hóa đơn ngẫu nhiên chuẩn 10 ký tự in hoa
 */
export function generateLookupCode(prefix = 'EINV'): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Sinh mã cấp của Cơ quan Thuế theo Thông tư 78/2021/TT-BTC
 */
export function generateTaxAuthorityCode(taxCode = '0108999888'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomHex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');
  return `CQT-${taxCode}-${timestamp}${randomHex}`;
}

/**
 * Sinh cấu trúc XML Hóa đơn điện tử chuẩn Nghị định 123 / Thông tư 78 có chữ ký số
 */
export function generateInvoiceXml(invoice: {
  invoiceNumber: string;
  lookupCode: string;
  buyerName: string;
  buyerTaxCode: string;
  buyerEmail?: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  items?: IInvoiceItem[];
  taxAuthorityCode?: string;
  signedBy?: string;
}): { xml: string; signatureDigest: string } {
  const signDate = new Date().toISOString();
  const cqtCode =
    invoice.taxAuthorityCode || generateTaxAuthorityCode(invoice.buyerTaxCode);
  const signer = invoice.signedBy || 'Nguyễn Văn A (Kế toán trưởng)';

  // Dummy base64 digest for digital signature
  const rawContent = `${invoice.invoiceNumber}|${invoice.buyerTaxCode}|${invoice.totalAmount}|${signDate}`;
  const signatureDigest = Buffer.from(rawContent).toString('base64');

  const itemsXml = (invoice.items || [])
    .map(
      (item, idx) => `        <HHDVu>
          <STT>${idx + 1}</STT>
          <THHDVu>${item.name}</THHDVu>
          <DVTinh>${item.unit || 'Cái'}</DVTinh>
          <SLuong>${item.quantity}</SLuong>
          <DGia>${item.unitPrice}</DGia>
          <TLCKhau>0</TLCKhau>
          <ThTien>${item.quantity * item.unitPrice}</ThTien>
          <TSuat>${item.vatRate}%</TSuat>
        </HHDVu>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/2021/tt78">
  <DLHDon Id="HD_${invoice.invoiceNumber}">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TAA</KHHDon>
      <SHDon>${invoice.invoiceNumber}</SHDon>
      <NLap>${signDate.split('T')[0]}</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <MCCQT>${cqtCode}</MCCQT>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE</Ten>
        <MST>0108999888</MST>
        <DChi>Tòa nhà Công Nghệ FPT, Cầu Giấy, TP. Hà Nội</DChi>
        <SDThoai>1900 6868</SDThoai>
        <DCTDTu>support@einvoice.vn</DCTDTu>
      </NBan>
      <NMua>
        <Ten>${invoice.buyerName}</Ten>
        <MST>${invoice.buyerTaxCode}</MST>
        <DCTDTu>${invoice.buyerEmail || ''}</DCTDTu>
        <MKHang>${invoice.lookupCode}</MKHang>
      </NMua>
      <DSHHDVu>
${itemsXml}
      </DSHHDVu>
      <TToan>
        <TgTCThue>${invoice.subTotal}</TgTCThue>
        <TgTThue>${invoice.vatAmount}</TgTThue>
        <TgTTTBSo>${invoice.totalAmount}</TgTTTBSo>
        <TgTTTBChu>${numberToVietnameseWords(invoice.totalAmount)}</TgTTTBChu>
      </TToan>
    </NDHDon>
  </DLHDon>
  <DSCKS>
    <NNBan>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
          <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
          <Reference URI="#HD_${invoice.invoiceNumber}">
            <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <DigestValue>${signatureDigest}</DigestValue>
          </Reference>
        </SignedInfo>
        <SignatureValue>${signatureDigest.split('').reverse().join('')}==</SignatureValue>
        <KeyInfo>
          <X509Data>
            <X509SubjectName>CN=CÔNG TY CỔ PHẦN CÔNG NGHỆ E-INVOICE ENTERPRISE, OU=PHÒNG KẾ TOÁN, O=E-INVOICE, C=VN</X509SubjectName>
            <Signer>${signer}</Signer>
            <SigningTime>${signDate}</SigningTime>
          </X509Data>
        </KeyInfo>
      </Signature>
    </NNBan>
  </DSCKS>
</HDon>`;

  return { xml, signatureDigest };
}

/**
 * Đọc số tiền thành chữ Tiếng Việt chuẩn tài chính
 */
export function numberToVietnameseWords(n: number): string {
  if (n === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const digits = [
    'không',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
  ];

  function readThreeDigits(num: number, showZeroHundred: boolean): string {
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const unit = num % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten === 0 && unit > 0 && (hundred > 0 || showZeroHundred)) {
      res += 'lẻ ';
    } else if (ten === 1) {
      res += 'mười ';
    } else if (ten > 1) {
      res += digits[ten] + ' mươi ';
    }

    if (unit === 1 && ten > 1) {
      res += 'mốt';
    } else if (unit === 5 && ten > 0) {
      res += 'lăm';
    } else if (unit > 0 && ten !== 1) {
      res += digits[unit];
    } else if (unit > 0 && ten === 1) {
      res += digits[unit];
    }

    return res.trim();
  }

  let str = '';
  let temp = Math.abs(Math.round(n));
  let unitIdx = 0;

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkStr = readThreeDigits(chunk, temp > 1000);
      str = `${chunkStr} ${units[unitIdx]} ${str}`.trim();
    }
    temp = Math.floor(temp / 1000);
    unitIdx++;
  }

  const result =
    str.charAt(0).toUpperCase() + str.slice(1).trim() + ' đồng chẵn';
  return result.replace(/\s+/g, ' ');
}
