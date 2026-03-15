import { isValidCnpj, IsCnpjConstraint } from './is-cnpj.validator';

describe('IsCnpjValidator', () => {
  const constraint = new IsCnpjConstraint();

  describe('isValidCnpj', () => {
    it('deve retornar true para CNPJ válido', () => {
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
      expect(isValidCnpj('11222333000181')).toBe(true);
    });

    it('deve retornar false para CNPJ com menos de 14 dígitos', () => {
      expect(isValidCnpj('1234567890123')).toBe(false);
    });

    it('deve retornar false para CNPJ com mais de 14 dígitos', () => {
      expect(isValidCnpj('123456789012345')).toBe(false);
    });

    it('deve retornar false para CNPJ com dígitos repetidos', () => {
      expect(isValidCnpj('11111111111111')).toBe(false);
    });

    it('deve retornar false para primeiro dígito verificador inválido', () => {
      // 11.222.333/0001-91 (troquei 8 por 9)
      expect(isValidCnpj('11.222.333/0001-91')).toBe(false);
    });

    it('deve retornar false para segundo dígito verificador inválido', () => {
      // 11.222.333/0001-82 (troquei 1 por 2)
      expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    });

    it('deve lidar corretamente com restos < 2 (digito 0)', () => {
      // CNPJ onde o resto da divisão por 11 é < 2, resultando em dígito verificador 0
      // Exemplo: 00.000.000/0001-91
      expect(isValidCnpj('00.000.000/0001-91')).toBe(true);
    });
  });

  describe('IsCnpjConstraint', () => {
    it('deve validar usando a função isValidCnpj', () => {
      expect(constraint.validate('11.222.333/0001-81')).toBe(true);
      expect(constraint.validate('123')).toBe(false);
    });

    it('deve retornar a mensagem de erro padrão', () => {
      expect(constraint.defaultMessage()).toBe(
        'CNPJ inválido. Verifique os dígitos e tente novamente.',
      );
    });
  });
});
