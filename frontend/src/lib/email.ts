/** Client-side syntax check. The API also verifies the domain can receive mail. */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254 || trimmed.includes("..") || trimmed.includes(" ")) {
    return false;
  }
  return EMAIL_RE.test(trimmed);
}
