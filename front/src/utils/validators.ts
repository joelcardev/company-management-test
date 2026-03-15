/**
 * Algoritmo de validação de CNPJ brasileiro.
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  const remainder1 = sum % 11;
  const check1 = remainder1 < 2 ? 0 : 11 - remainder1;
  if (parseInt(digits[12]) !== check1) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  const remainder2 = sum % 11;
  const check2 = remainder2 < 2 ? 0 : 11 - remainder2;
  if (parseInt(digits[13]) !== check2) return false;

  return true;
}
