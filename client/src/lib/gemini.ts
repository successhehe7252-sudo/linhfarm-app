import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedInvoiceSupplier {
  name: string;
  tax_code?: string;
  phone?: string;
  address?: string;
}

export interface ExtractedInvoiceItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
}

export interface ExtractedInvoiceData {
  supplier: ExtractedInvoiceSupplier;
  items: ExtractedInvoiceItem[];
  sub_total: number;
  vat_amount: number;
  total_amount: number;
}

export async function parseInvoiceWithGemini(
  base64Data: string,
  mimeType: string
): Promise<ExtractedInvoiceData> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error(
      "Chưa tìm thấy VITE_GEMINI_API_KEY trong môi trường. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env để kích hoạt AI bóc tách hóa đơn."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `Bạn là một kế toán xuất sắc. Hãy đọc hóa đơn VAT / phiếu bán hàng này và trả về ĐÚNG định dạng JSON sau, không kèm bất kỳ markdown hay đoạn text giải thích nào khác:
{
  "supplier": {
    "name": "Tên công ty bán hoặc tên nhà cung cấp",
    "tax_code": "Mã số thuế (nếu có)",
    "phone": "Số điện thoại (nếu có)",
    "address": "Địa chỉ (nếu có)"
  },
  "items": [
    {
      "name": "Tên sản phẩm / tên hàng",
      "unit": "Đơn vị tính (như Kg, Hộp, Túi, Bó, Chai, Gói, Quả, v.v.)",
      "qty": 10,
      "price": 50000
    }
  ],
  "sub_total": 500000,
  "vat_amount": 40000,
  "total_amount": 540000
}`;

  // Clean base64 string if data URL header is present (e.g. data:application/pdf;base64,...)
  const cleanBase64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  const filePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType || "application/pdf",
    },
  };

  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  let response: any;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, filePart]);
      response = result.response;
      console.log(`[Gemini AI] Đã phân tích thành công bằng model: ${modelName}`);
      break;
    } catch (error: any) {
      console.warn(`[Gemini AI] Model ${modelName} thất bại (503/quá tải):`, error.message || error);
      if (i === modelsToTry.length - 1) {
        throw new Error("Tất cả các model Gemini đều đang quá tải (High Demand 503). Vui lòng thử lại sau ít phút.");
      }
    }
  }

  const responseText = response.text();

  // Robustly clean markdown block markers (```json ... ``` or ``` ...)
  const jsonString = responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed: ExtractedInvoiceData = JSON.parse(jsonString);
    const parsedItems = (parsed.items || []).map(item => ({
      name: item.name || "Sản phẩm",
      unit: item.unit || "Kg",
      qty: Number(item.qty || 1),
      price: Number(item.price || 0),
    }));
    const subTotal = Number(parsed.sub_total || parsedItems.reduce((sum, i) => sum + i.qty * i.price, 0));
    const total = Number(parsed.total_amount || subTotal);
    const vat = Number(parsed.vat_amount || (total > subTotal ? total - subTotal : 0));

    return {
      supplier: {
        name: parsed.supplier?.name || "Nhà cung cấp chưa rõ",
        tax_code: parsed.supplier?.tax_code || "",
        phone: parsed.supplier?.phone || "",
        address: parsed.supplier?.address || "",
      },
      items: parsedItems,
      sub_total: subTotal,
      vat_amount: vat,
      total_amount: total,
    };
  } catch (err: any) {
    console.error("[Gemini AI Parse Error]", responseText);
    throw new Error("Không thể bóc tách JSON từ hóa đơn này. Vui lòng thử lại với hình ảnh rõ nét hơn.");
  }
}
