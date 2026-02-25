import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler } from '../../server/src/adapters/ErrorHandler';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

describe('errorHandler', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    mockRequest = {
      log: {
        error: vi.fn(),
      },
    } as unknown as FastifyRequest;

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should return original error message when not in production', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Sensitive Database Info') as FastifyError;

    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Sensitive Database Info'
    }));
  });

  it('should return generic error message when in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Sensitive Database Info') as FastifyError;

    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Internal Server Error'
    }));
    expect(mockReply.send).not.toHaveBeenCalledWith(expect.objectContaining({
      message: 'Sensitive Database Info'
    }));
  });
});
