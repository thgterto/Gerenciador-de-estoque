
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { db } from './database';

export class SQLiteUserRepository implements UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const result = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();

    if (!result) return null;

    return new User(
      result.username,
      result.password_hash,
      result.role,
      result.id
    );
  }

  async save(user: User): Promise<void> {
    await db.insertInto('users')
      .values({
        id: user.id,
        username: user.username,
        password_hash: user.password_hash,
        role: user.role,
      })
      .onConflict((oc) => oc
        .column('id')
        .doUpdateSet({
          username: user.username,
          password_hash: user.password_hash,
          role: user.role,
        })
      )
      .execute();
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return null;

    return new User(
      result.username,
      result.password_hash,
      result.role,
      result.id
    );
  }
}
