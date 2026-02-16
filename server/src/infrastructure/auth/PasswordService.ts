
import bcrypt from 'bcryptjs';

export class PasswordService {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
