export interface VietQrBank {
  bin: string;
  code: string;
  shortName: string;
  name: string;
  logo: string;
}

export const DEFAULT_VIETQR_BANKS: VietQrBank[] = [
  { bin: "970422", code: "MB", shortName: "MBBank", name: "Ngân hàng TMCP Quân đội", logo: "https://cdn.vietqr.io/img/MB.png" },
  { bin: "970436", code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam", logo: "https://cdn.vietqr.io/img/VCB.png" },
  { bin: "970407", code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam", logo: "https://cdn.vietqr.io/img/TCB.png" },
  { bin: "970415", code: "ICB", shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam", logo: "https://cdn.vietqr.io/img/ICB.png" },
  { bin: "970418", code: "BIDV", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", logo: "https://cdn.vietqr.io/img/BIDV.png" },
  { bin: "970416", code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu", logo: "https://cdn.vietqr.io/img/ACB.png" },
  { bin: "970432", code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", logo: "https://cdn.vietqr.io/img/VPB.png" },
  { bin: "970423", code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong", logo: "https://cdn.vietqr.io/img/TPB.png" },
  { bin: "970403", code: "STB", shortName: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Thương Tín", logo: "https://cdn.vietqr.io/img/STB.png" },
  { bin: "970437", code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển TP. HCM", logo: "https://cdn.vietqr.io/img/HDB.png" },
  { bin: "970405", code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam", logo: "https://cdn.vietqr.io/img/VBA.png" },
  { bin: "970443", code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", logo: "https://cdn.vietqr.io/img/SHB.png" },
  { bin: "970426", code: "MSB", shortName: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam", logo: "https://cdn.vietqr.io/img/MSB.png" },
  { bin: "970441", code: "VIB", shortName: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam", logo: "https://cdn.vietqr.io/img/VIB.png" },
  { bin: "970431", code: "EIB", shortName: "Eximbank", name: "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam", logo: "https://cdn.vietqr.io/img/EIB.png" },
  { bin: "970440", code: "SEAB", shortName: "SeABank", name: "Ngân hàng TMCP Đông Nam Á", logo: "https://cdn.vietqr.io/img/SEAB.png" },
  { bin: "970449", code: "LPB", shortName: "LPBank", name: "Ngân hàng TMCP Lộc Phát Việt Nam", logo: "https://cdn.vietqr.io/img/LPB.png" },
  { bin: "970448", code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông", logo: "https://cdn.vietqr.io/img/OCB.png" },
  { bin: "970409", code: "BAB", shortName: "BacABank", name: "Ngân hàng TMCP Bắc Á", logo: "https://cdn.vietqr.io/img/BAB.png" },
  { bin: "970452", code: "KLB", shortName: "KienLongBank", name: "Ngân hàng TMCP Kiên Long", logo: "https://cdn.vietqr.io/img/KLB.png" },
  { bin: "970428", code: "NAB", shortName: "NamABank", name: "Ngân hàng TMCP Nam Á", logo: "https://cdn.vietqr.io/img/NAB.png" },
  { bin: "970419", code: "NCB", shortName: "NCB", name: "Ngân hàng TMCP Quốc Dân", logo: "https://cdn.vietqr.io/img/NCB.png" },
  { bin: "970412", code: "PVCB", shortName: "PVcomBank", name: "Ngân hàng TMCP Đại Chúng Việt Nam", logo: "https://cdn.vietqr.io/img/PVCB.png" },
  { bin: "970400", code: "SGICB", shortName: "SaigonBank", name: "Ngân hàng TMCP Sài Gòn Công Thương", logo: "https://cdn.vietqr.io/img/SGICB.png" },
  { bin: "970427", code: "VAB", shortName: "VietABank", name: "Ngân hàng TMCP Việt Á", logo: "https://cdn.vietqr.io/img/VAB.png" },
  { bin: "970433", code: "VIETBANK", shortName: "VietBank", name: "Ngân hàng TMCP Việt Nam Thương Tín", logo: "https://cdn.vietqr.io/img/VIETBANK.png" },
  { bin: "970424", code: "SHBVN", shortName: "ShinhanBank", name: "Ngân hàng TNHH MTV Shinhan Việt Nam", logo: "https://cdn.vietqr.io/img/SHBVN.png" },
  { bin: "970457", code: "WVN", shortName: "Woori", name: "Ngân hàng TNHH MTV Woori Việt Nam", logo: "https://cdn.vietqr.io/img/WVN.png" },
  { bin: "963388", code: "TIMO", shortName: "Timo", name: "Ngân hàng số Timo", logo: "https://cdn.vietqr.io/img/TIMO.png" },
  { bin: "971025", code: "momo", shortName: "MoMo", name: "Ví Điện Tử MoMo", logo: "https://cdn.vietqr.io/img/momo.png" },
];

let cachedBanks: VietQrBank[] | null = null;

export const fetchVietQrBanks = async (): Promise<VietQrBank[]> => {
  if (cachedBanks && cachedBanks.length > 0) {
    return cachedBanks;
  }
  try {
    const res = await fetch("https://api.vietqr.io/v2/banks");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        const loadedBanks: VietQrBank[] = data.data.map((b: any) => ({
          bin: b.bin,
          code: b.code || "",
          shortName: b.shortName || b.short_name || b.code || "",
          name: b.name || "",
          logo: b.logo || "",
        }));
        cachedBanks = loadedBanks;
        return loadedBanks;
      }
    }
  } catch (err) {
    console.warn("[VietQR] Failed to fetch live banks, using default list", err);
  }
  cachedBanks = DEFAULT_VIETQR_BANKS;
  return DEFAULT_VIETQR_BANKS;
};

export const findBankByQuery = (query?: string, bankList: VietQrBank[] = DEFAULT_VIETQR_BANKS): VietQrBank | undefined => {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return bankList.find(
    b =>
      b.bin === q ||
      b.code.toLowerCase() === q ||
      b.shortName.toLowerCase() === q ||
      b.shortName.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q)
  );
};

export const bankMapper: Record<string, string> = {
  "Vietcombank": "vcb",
  "VCB": "vcb",
  "Ngân hàng TMCP Ngoại Thương Việt Nam": "vcb",
  "MB Bank": "mb",
  "MBBank": "mb",
  "MB": "mb",
  "Ngân hàng TMCP Quân đội": "mb",
  "Techcombank": "tcb",
  "TCB": "tcb",
  "Ngân hàng TMCP Kỹ thương Việt Nam": "tcb",
  "VietinBank": "ctg",
  "Vietinbank": "ctg",
  "ICB": "ctg",
  "Ngân hàng TMCP Công thương Việt Nam": "ctg",
  "BIDV": "bidv",
  "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam": "bidv",
  "Agribank": "vba",
  "VBA": "vba",
  "VPBank": "vpb",
  "VPB": "vpb",
  "TPBank": "tpb",
  "TPB": "tpb",
  "Sacombank": "stb",
  "STB": "stb",
  "ACB": "acb",
  "HDBank": "hdb",
  "VIB": "vib",
  "MSB": "msb",
  "OCB": "ocb",
  "SeABank": "seab",
  "LPBank": "lpb",
};

export const getBankId = (bankName: string, bankBin?: string): string => {
  if (bankBin && bankBin.trim()) return bankBin.trim();
  if (!bankName) return "";
  const trimmed = bankName.trim();
  if (bankMapper[trimmed]) return bankMapper[trimmed];
  const found = findBankByQuery(trimmed);
  if (found) return found.bin || found.code.toLowerCase();
  return getBankSlug(trimmed).toLowerCase();
};

export const getBankSlug = (bankName: string): string => {
  if (!bankName) return "";
  const upper = bankName.toUpperCase();
  if (upper.includes("VIETCOMBANK") || upper.includes("VCB")) return "vcb";
  if (upper.includes("MB")) return "mb";
  if (upper.includes("TECHCOMBANK") || upper.includes("TCB")) return "tcb";
  if (upper.includes("BIDV")) return "bidv";
  if (upper.includes("VIETINBANK") || upper.includes("CTG") || upper.includes("ICB")) return "ctg";
  if (upper.includes("ACB")) return "acb";
  if (upper.includes("TPBANK") || upper.includes("TPB")) return "tpb";
  if (upper.includes("VPBANK") || upper.includes("VPB")) return "vpb";
  if (upper.includes("SACOMBANK") || upper.includes("STB")) return "stb";
  return upper.replace(/[^A-Z0-9]/g, "").toLowerCase() || "";
};

export const buildVietQrUrl = (
  bankBinOrName: string,
  bankAccount: string,
  accountName: string,
  amount: number,
  orderCode: string
): string => {
  let bankIdentifier = (bankBinOrName || "").trim();

  if (!bankIdentifier) {
    console.warn("[VietQR] Warning: bankIdentifier is empty!");
  } else if (/^\d+$/.test(bankIdentifier)) {
    // Use numeric BIN code directly
  } else {
    bankIdentifier = getBankId(bankIdentifier);
  }

  const cleanAccount = (bankAccount || "").replace(/\s+/g, "");
  const cleanAmount = Math.round(Number(amount || 0));
  const cleanOrderCode = encodeURIComponent(orderCode || "LF-ORDER");
  const cleanAccountName = encodeURIComponent(accountName || "");

  return `https://img.vietqr.io/image/${bankIdentifier}-${cleanAccount}-compact2.png?amount=${cleanAmount}&addInfo=${cleanOrderCode}&accountName=${cleanAccountName}`;
};
