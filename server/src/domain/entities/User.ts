
import { randomUUID } from 'crypto';

export class User {
  public readonly id: string;
  public username: string;
  public password_hash: string;
  public role: 'ADMIN' | 'USER';

  constructor(
    username: string,
    password_hash: string,
    role: 'ADMIN' | 'USER' = 'USER',
    id?: string
  ) {
    this.id = id || randomUUID();
    this.username = username;
    this.password_hash = password_hash;
    this.role = role;
  }
}
