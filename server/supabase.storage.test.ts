import { describe, expect, it, vi } from "vitest";
import { PRODUCT_IMAGE_BUCKET, buildProductImagePath, removeProductImage, storagePathFromPublicUrl, supabase, uploadProductImage } from "../client/src/lib/supabase";

describe("Product image storage helpers", () => {
  it("uses the LinhFarm bucket and extracts storage paths from public URLs", () => {
    expect(PRODUCT_IMAGE_BUCKET).toBe("linhfarm-images");
    expect(storagePathFromPublicUrl("https://demo.supabase.co/storage/v1/object/public/linhfarm-images/products/photo%20one.jpg")).toBe("products/photo one.jpg");
    expect(storagePathFromPublicUrl("/manus-storage/legacy.jpg")).toBeNull();
    expect(storagePathFromPublicUrl(null)).toBeNull();
  });

  it("creates safe product paths and uploads with the original File", async () => {
    expect(buildProductImagePath("Dâu tây mùa mới.jpg", "test-id")).toBe("products/test-id-d-u-t-y-m-a-m-i.jpg");
    const upload = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://demo.supabase.co/storage/v1/object/public/linhfarm-images/products/test.jpg" } });
    const from = vi.spyOn(supabase.storage, "from").mockReturnValue({ upload, getPublicUrl } as any);
    const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
    const result = await uploadProductImage(file);
    expect(result.error).toBeNull();
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^products\/[0-9a-f-]+-test\.jpg$/), file, expect.objectContaining({ contentType: "image/jpeg" }));
    expect(getPublicUrl).toHaveBeenCalled();
    from.mockRestore();
  });

  it("calls remove with exactly one old storage path", async () => {
    const remove = vi.fn().mockResolvedValue({ data: [], error: null });
    const from = vi.spyOn(supabase.storage, "from").mockReturnValue({ remove } as any);
    await removeProductImage("products/old.jpg");
    expect(from).toHaveBeenCalledWith(PRODUCT_IMAGE_BUCKET);
    expect(remove).toHaveBeenCalledWith(["products/old.jpg"]);
    from.mockRestore();
  });
});
