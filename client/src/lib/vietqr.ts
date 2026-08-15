const getBankSlug = (bankName: string) => {
  if (!bankName) return "MB";
  const upper = bankName.toUpperCase();
  if (upper.includes("MB")) return "MB";
  if (upper.includes("VIETCOMBANK") || upper.includes("VCB")) return "VCB";
  if (upper.includes("TECHCOMBANK") || upper.includes("TCB")) return "TCB";
  if (upper.includes("BIDV")) return "BIDV";
  if (upper.includes("VIETINBANK") || upper.includes("CTG")) return "CTG";
  if (upper.includes("ACB")) return "ACB";
  if (upper.includes("TPBANK") || upper.includes("TPB")) return "TPB";
  if (upper.includes("VPBANK") || upper.includes("VPB")) return "VPB";
  if (upper.includes("SACOMBANK") || upper.includes("STB")) return "STB";
  return upper.replace(/[^A-Z0-9]/g, "") || "MB";
};

export const buildVietQrUrl = (bankName: string, bankAccount: string, accountName: string, amount: number, orderCode: string) => {
  const bankSlug = getBankSlug(bankName);
  const cleanAccount = (bankAccount || "").replace(/\s+/g, "");
  const cleanAmount = Math.round(amount);
  const cleanOrderCode = encodeURIComponent(orderCode || "DONHANG");
  const cleanAccountName = encodeURIComponent(accountName || "");
  return `https://img.vietqr.io/image/${bankSlug}-${cleanAccount}-compact2.png?amount=${cleanAmount}&addInfo=${cleanOrderCode}&accountName=${cleanAccountName}`;
};
