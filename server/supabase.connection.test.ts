import "dotenv/config";
import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it("can reach the Supabase Auth settings endpoint with the configured public key", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}` },
    });
    expect(response.ok).toBe(true);
  }, 15000);
});
