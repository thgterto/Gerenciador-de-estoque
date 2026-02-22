
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { config } from '../config';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation Error',
      details: error.errors,
    });
  }

  if (error.validation) {
    return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
    });
  }

  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
          statusCode: error.statusCode,
          error: error.name,
          message: error.message
      });
  }

  request.log.error(error);

  // Sentinel Security: Prevent leaking sensitive info in production
  const message = config.isProduction
    ? 'Internal Server Error'
    : (error.message || 'An unexpected error occurred');

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: message,
  });
}
