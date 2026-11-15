export function formatPhoneNumber(raw: string) {
  const prefixLength = raw.startsWith('02') || /^\d{2}-/.test(raw) ? 2 : 3;
  const digits = raw.replace(/\D/g, '').slice(0, prefixLength + 8);
  if (digits.length <= prefixLength) return digits;
  if (digits.length <= prefixLength + 4)
    return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength)}`;
  return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength, -4)}-${digits.slice(-4)}`;
}
