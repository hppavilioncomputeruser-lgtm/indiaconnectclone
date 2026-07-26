/**
 * Validate Aadhaar number: exactly 12 numeric digits
 */
export function isValidAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar);
}

/**
 * Validate GST number: 15-character alphanumeric following GSTIN format.
 * Pattern: 2 digits (state) + 10 chars PAN + 1 digit entity + 1 char Z + 1 check digit
 * Example: 22AAAAA0000A1Z5
 */
export function isValidGST(gst: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
}

/**
 * Validate Indian phone number: 10 digits, optionally starting with +91
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
}
