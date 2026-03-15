import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Algoritmo de validação de CNPJ brasileiro.
 * Verifica os dois dígitos verificadores usando pesos oficiais da Receita Federal.
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) return false;

  // Rejeita CNPJs com todos os dígitos iguais (ex: 11111111111111)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  const remainder1 = sum % 11;
  const check1 = remainder1 < 2 ? 0 : 11 - remainder1;

  if (parseInt(digits[12]) !== check1) return false;

  // Calcula segundo dígito verificador
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

@ValidatorConstraint({ name: 'IsCnpj', async: false })
export class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isValidCnpj(value);
  }

  defaultMessage(): string {
    return 'CNPJ inválido. Verifique os dígitos e tente novamente.';
  }
}

/**
 * Decorator customizado para validar CNPJ brasileiro.
 * Verifica formato (14 dígitos) e dígitos verificadores.
 */
export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjConstraint,
    });
  };
}
