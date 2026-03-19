import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let httpAdapterHostMock: Partial<HttpAdapterHost>;
  let httpAdapterMock: Partial<any>;
  let argumentsHostMock: Partial<ArgumentsHost>;
  let responseMock: Partial<any>;
  let requestMock: Partial<any>;

  beforeEach(() => {
    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    requestMock = {
      url: '/api/test',
      method: 'GET',
    };

    httpAdapterMock = {
      getRequestUrl: jest.fn().mockReturnValue('/api/test'),
      reply: jest.fn(),
    };

    httpAdapterHostMock = {
      httpAdapter: httpAdapterMock,
    };

    argumentsHostMock = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(requestMock),
        getResponse: jest.fn().mockReturnValue(responseMock),
      }),
    };

    filter = new AllExceptionsFilter(httpAdapterHostMock as HttpAdapterHost);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('deve lidar com HttpException e retornar status correto', () => {
      const exception = new HttpException('Recurso não encontrado', HttpStatus.NOT_FOUND);

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Recurso não encontrado',
          path: '/api/test',
        }),
        HttpStatus.NOT_FOUND,
      );
    });

    it('deve lidar com HttpException com mensagem como objeto', () => {
      const exception = new HttpException(
        { message: 'Erro personalizado', code: 'CUSTOM_ERROR' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Erro personalizado',
        }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('deve lidar com exceção genérica (não HttpException)', () => {
      const exception = new Error('Erro inesperado');

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro inesperado',
          path: '/api/test',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('deve usar mensagem padrão para erro interno quando exceção não for Error', () => {
      const exception = { custom: 'error' };

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno no servidor',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('deve extrair mensagem de objeto com propriedade message', () => {
      const exception = new Error('Test');
      (exception as any).getResponse = () => ({ message: 'Mensagem do response' });

      // Mock para fazer o filter tratar como HttpException
      const httpException = new HttpException({ message: 'Mensagem do response' }, HttpStatus.BAD_REQUEST);

      filter.catch(httpException, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          message: 'Mensagem do response',
        }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('deve lidar com string como mensagem de erro', () => {
      const exception = new HttpException('Erro de validação', HttpStatus.BAD_REQUEST);

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          message: 'Erro de validação',
        }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('deve fazer stringify quando mensagem for objeto sem message', () => {
      const exception = new HttpException({ code: 'VALIDATION_ERROR', details: [] }, HttpStatus.BAD_REQUEST);

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          message: expect.stringContaining('VALIDATION_ERROR'),
        }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('deve incluir timestamp no formato ISO', () => {
      const exception = new Error('Test error');
      const beforeCatch = Date.now();

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      const afterCatch = Date.now();
      const response = (httpAdapterMock.reply as jest.Mock).mock.calls[0][1];
      const timestamp = new Date(response.timestamp).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(beforeCatch);
      expect(timestamp).toBeLessThanOrEqual(afterCatch);
    });

    it('deve logar erro com Logger', () => {
      const loggerErrorSpy = jest.spyOn((filter as any).logger, 'error');
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Status: 404'),
      );
    });

    it('deve chamar switchToHttp do argumentsHost', () => {
      const exception = new Error('Test');

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(argumentsHostMock.switchToHttp).toHaveBeenCalled();
    });

    it('deve obter request e response do contexto', () => {
      const exception = new Error('Test');
      const ctx = (argumentsHostMock.switchToHttp as jest.Mock).mock.results[0].value;

      filter.catch(exception, argumentsHostMock as ArgumentsHost);

      expect(ctx.getRequest).toHaveBeenCalled();
      expect(ctx.getResponse).toHaveBeenCalled();
    });

    it('deve lidar com null como exceção', () => {
      filter.catch(null as any, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno no servidor',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('deve lidar com undefined como exceção', () => {
      filter.catch(undefined as any, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('deve lidar com número como exceção', () => {
      filter.catch(123 as any, argumentsHostMock as ArgumentsHost);

      expect(httpAdapterMock.reply).toHaveBeenCalledWith(
        responseMock,
        expect.objectContaining({
          message: '123',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });

  describe('construtor', () => {
    it('deve criar instância com Logger', () => {
      const filterInstance = new AllExceptionsFilter(httpAdapterHostMock as HttpAdapterHost);

      expect(filterInstance).toBeDefined();
      expect((filterInstance as any).logger).toBeDefined();
    });
  });
});
