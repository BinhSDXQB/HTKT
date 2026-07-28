import 'server-only'
import forge from 'node-forge'

/**
 * Kiểm tra chữ ký số trong file PDF (PAdES) — đọc cấu trúc /ByteRange + /Contents,
 * phân tích PKCS#7, trích người ký và kiểm tra TOÀN VẸN (messageDigest khớp nội dung ký).
 *
 * Lưu ý: đây là kiểm tra cấu trúc + toàn vẹn (document chưa bị sửa sau khi ký) và trích thông tin
 * người ký. KHÔNG kiểm tra chuỗi tin cậy tới CA gốc (cần danh sách CA tin cậy + CRL/OCSP).
 */

const DIGEST_OID: Record<string, () => forge.md.MessageDigest> = {
  '1.3.14.3.2.26':            () => forge.md.sha1.create(),
  '2.16.840.1.101.3.4.2.1':  () => forge.md.sha256.create(),
  '2.16.840.1.101.3.4.2.2':  () => forge.md.sha384.create(),
  '2.16.840.1.101.3.4.2.3':  () => forge.md.sha512.create(),
}

export type SignatureInfo = {
  signerCN: string | null
  signerSerial: string | null
  signingTime: Date | null
  toanVen: boolean
}

export type PdfSignatureResult = {
  soChuKy: number
  isPdf: boolean
  signatures: SignatureInfo[]
  // tiện cho lưu vết: thông tin chữ ký MỚI NHẤT
  signerCN: string | null
  signerSerial: string | null
  signingTime: Date | null
  hopLe: boolean       // tất cả chữ ký phát hiện được đều toàn vẹn
  ghiChu: string
}

/** Tìm các vùng ByteRange của chữ ký trong PDF. */
function findByteRanges(pdf: Buffer): number[][] {
  const s = pdf.toString('latin1')
  const re = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g
  const out: number[][] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    out.push([Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])])
  }
  return out
}

function parseOneSignature(pdf: Buffer, br: number[]): SignatureInfo {
  const [s1, l1, s2, l2] = br
  const signedContent = Buffer.concat([pdf.subarray(s1, s1 + l1), pdf.subarray(s2, s2 + l2)])
  const hole = pdf.subarray(s1 + l1, s2).toString('latin1').trim()
  const hex = hole.replace(/^</, '').replace(/>$/, '').trim()

  const info: SignatureInfo = { signerCN: null, signerSerial: null, signingTime: null, toanVen: false }
  try {
    const der = forge.util.hexToBytes(hex)
    const asn1 = forge.asn1.fromDer(der)
    const msg = forge.pkcs7.messageFromAsn1(asn1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rc: any = (msg as any).rawCapture

    // Người ký: chọn chứng thư leaf (không phải CA) hoặc cái đầu tiên
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const certs: any[] = (msg as any).certificates || []
    const leaf = certs.find((c) => {
      const bc = c.getExtension && c.getExtension('basicConstraints')
      return !bc || bc.cA !== true
    }) || certs[0]
    if (leaf) {
      const cn = leaf.subject?.getField?.('CN')
      info.signerCN = cn?.value ?? null
      info.signerSerial = leaf.serialNumber ?? null
    }

    // Duyệt authenticatedAttributes: signingTime + messageDigest
    let messageDigest: string | null = null
    for (const attr of rc?.authenticatedAttributes || []) {
      const oid = forge.asn1.derToOid(attr.value[0].value)
      if (oid === '1.2.840.113549.1.9.5') { // signingTime
        const raw = attr.value[1].value[0].value as string
        const d = new Date(raw)
        if (!isNaN(d.getTime())) info.signingTime = d
      } else if (oid === '1.2.840.113549.1.9.4') { // messageDigest
        messageDigest = attr.value[1].value[0].value as string
      }
    }

    // Toàn vẹn: hash nội dung ký so với messageDigest
    const digOid = rc?.digestAlgorithm ? forge.asn1.derToOid(rc.digestAlgorithm) : '2.16.840.1.101.3.4.2.1'
    const mdFactory = DIGEST_OID[digOid] || DIGEST_OID['2.16.840.1.101.3.4.2.1']
    if (messageDigest) {
      const md = mdFactory()
      md.update(signedContent.toString('binary'))
      info.toanVen = md.digest().getBytes() === messageDigest
    }
  } catch {
    // parse lỗi → coi như có cấu trúc chữ ký nhưng không đọc được
  }
  return info
}

export function verifyPdfSignatures(pdf: Buffer): PdfSignatureResult {
  const isPdf = pdf.subarray(0, 5).toString('latin1') === '%PDF-'
  const ranges = findByteRanges(pdf)
  const signatures = ranges.map((br) => parseOneSignature(pdf, br))
  const last = signatures[signatures.length - 1]
  const hopLe = signatures.length > 0 && signatures.every((s) => s.toanVen)

  let ghiChu: string
  if (!isPdf) ghiChu = 'Tệp tải lên không phải PDF.'
  else if (signatures.length === 0) ghiChu = 'PDF chưa có chữ ký số.'
  else {
    const names = signatures.map((s) => s.signerCN || '?').join(', ')
    ghiChu = `Phát hiện ${signatures.length} chữ ký số (${names}). Toàn vẹn: ${hopLe ? 'đạt' : 'CHƯA đạt'}.`
  }

  return {
    soChuKy: signatures.length,
    isPdf,
    signatures,
    signerCN: last?.signerCN ?? null,
    signerSerial: last?.signerSerial ?? null,
    signingTime: last?.signingTime ?? null,
    hopLe,
    ghiChu,
  }
}
