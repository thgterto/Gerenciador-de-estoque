
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RegisterUser } from '../../use-cases/RegisterUser';
import { LoginUser } from '../../use-cases/LoginUser';

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUser,
    private loginUserUseCase: LoginUser
  ) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    await this.registerUserUseCase.execute({
      username: body.username,
      password: body.password,
      role: body.role as 'ADMIN' | 'USER' | undefined,
    });
    return reply.status(201).send({ message: 'User registered successfully' });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const user = await this.loginUserUseCase.execute(body);

    // Generate JWT
    // Assumes @fastify/jwt is registered in app.ts
    const token = await reply.jwtSign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return reply.send({ token });
  }
}
