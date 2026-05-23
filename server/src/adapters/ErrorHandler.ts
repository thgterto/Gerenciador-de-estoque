import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation Error',
      details: (error as z.ZodError<any>).errors,
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

  // SECURITY FIX: Never expose raw error messages in 500 responses
  // This prevents leaking sensitive information like database queries,
  // file paths, or internal service errors, even in non-production environments
  // where desktop/local apps might run without NODE_ENV=production.
  const message = 'An unexpected error occurred';

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message,
  });
}
