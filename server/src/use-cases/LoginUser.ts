
import { UserRepository } from '../domain/repositories/UserRepository';
import { PasswordService } from '../infrastructure/auth/PasswordService';
import { User } from '../domain/entities/User';

export interface LoginUserRequest {
  username: string;
  password: string;
}

export class LoginUser {
  constructor(private userRepository: UserRepository) {}

  async execute(request: LoginUserRequest): Promise<User> {
    const user = await this.userRepository.findByUsername(request.username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await PasswordService.verify(request.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
}
