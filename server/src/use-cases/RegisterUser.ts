
import { UserRepository } from '../domain/repositories/UserRepository';
import { PasswordService } from '../infrastructure/auth/PasswordService';
import { User } from '../domain/entities/User';

export interface RegisterUserRequest {
  username: string;
  password: string;
}

export class RegisterUser {
  constructor(private userRepository: UserRepository) {}

  async execute(request: RegisterUserRequest): Promise<void> {
    const existingUser = await this.userRepository.findByUsername(request.username);
    if (existingUser) {
      throw new Error(`User ${request.username} already exists`);
    }

    const passwordHash = await PasswordService.hash(request.password);
    // SECURITY FIX: Enforce 'USER' role for all self-registered accounts
    const user = new User(request.username, passwordHash, 'USER');

    await this.userRepository.save(user);
  }
}
