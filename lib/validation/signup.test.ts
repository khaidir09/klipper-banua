import { describe, expect, it } from "vitest";
import { isDisposableEmail } from "./disposable-email";
import { SIGNUP_UNDERAGE_MESSAGE, signupSchema } from "./signup";

const valid = {
  email: "Rina.Klip@Gmail.com",
  password: "Rahasia123",
  passwordConfirmation: "Rahasia123",
  full_name: " Rina Amalia ",
  stage_name: "rinaklip",
  birth_date: "2000-05-17",
  phone_wa: "0812-3456-7890",
  city: "Banjarmasin",
  province: "Kalimantan Selatan",
  agree_terms: true,
  agree_privacy: true,
  confirm_adult: true,
};

function errorsOf(input: Record<string, unknown>) {
  const result = signupSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("signupSchema", () => {
  it("normalises a valid registration", () => {
    const result = signupSchema.parse(valid);
    expect(result.email).toBe("rina.klip@gmail.com");
    expect(result.full_name).toBe("Rina Amalia");
    expect(result.phone_wa).toBe("6281234567890");
  });

  it("rejects anyone under 18", () => {
    const today = new Date();
    const seventeen = `${today.getUTCFullYear() - 17}-01-01`;
    expect(errorsOf({ ...valid, birth_date: seventeen }).birth_date).toBe(SIGNUP_UNDERAGE_MESSAGE);
  });

  it("requires every consent", () => {
    const errors = errorsOf({
      ...valid,
      agree_terms: false,
      agree_privacy: false,
      confirm_adult: false,
    });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["agree_terms", "agree_privacy", "confirm_adult"]),
    );
  });

  it("requires a WhatsApp number, unlike the team's creator form", () => {
    expect(errorsOf({ ...valid, phone_wa: "" }).phone_wa).toMatch(/WhatsApp tidak valid/);
    expect(errorsOf({ ...valid, phone_wa: "021-555-1234" }).phone_wa).toMatch(/WhatsApp/);
  });

  it("requires the stage name and city", () => {
    const errors = errorsOf({ ...valid, stage_name: "  ", city: "" });
    expect(errors.stage_name).toBeDefined();
    expect(errors.city).toBeDefined();
  });

  it("rejects a province outside the list", () => {
    expect(errorsOf({ ...valid, province: "Jawa Barat" }).province).toBe("Pilih provinsi.");
  });

  it("checks the password rules and the confirmation", () => {
    expect(
      errorsOf({ ...valid, password: "lemah", passwordConfirmation: "lemah" }).password,
    ).toBeDefined();
    expect(errorsOf({ ...valid, passwordConfirmation: "Rahasia124" }).passwordConfirmation).toBe(
      "Kata sandinya belum sama. Coba ketik ulang.",
    );
  });

  it("rejects throwaway inboxes", () => {
    expect(errorsOf({ ...valid, email: "x@mailinator.com" }).email).toMatch(/email sementara/);
  });

  it("never carries a role: unknown keys are dropped", () => {
    const result = signupSchema.parse({ ...valid, role: "owner" });
    expect(result).not.toHaveProperty("role");
  });
});

describe("isDisposableEmail", () => {
  it("matches listed providers and their subdomains, case-insensitively", () => {
    expect(isDisposableEmail("a@YOPMAIL.com")).toBe(true);
    expect(isDisposableEmail("a@inbox.mailinator.com")).toBe(true);
  });

  it("leaves ordinary providers alone", () => {
    expect(isDisposableEmail("a@gmail.com")).toBe(false);
    expect(isDisposableEmail("a@kampus.ac.id")).toBe(false);
    expect(isDisposableEmail("not-an-email")).toBe(false);
  });
});
