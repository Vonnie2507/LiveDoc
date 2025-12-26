import { getPool } from '../config/database';
import { User } from '../types/models';

export async function findById(id: number): Promise<User | null> {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roleId: row.role_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Database error in UserModel.findById: ' + error.message);
    }
    throw new Error('Unknown database error in UserModel.findById');
  }
}

export async function findByEmail(email: string): Promise<User | null> {
  try {
    const pool = getPool();
    const lowercasedEmail = email.toLowerCase();
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at, updated_at FROM users WHERE LOWER(email) = $1',
      [lowercasedEmail]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roleId: row.role_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Database error in UserModel.findByEmail: ' + error.message);
    }
    throw new Error('Unknown database error in UserModel.findByEmail');
  }
}

export async function create(userData: { email: string; passwordHash: string; firstName: string; lastName: string; phone: string | null; roleId: number }): Promise<User> {
  try {
    const pool = getPool();
    const lowercasedEmail = userData.email.toLowerCase();
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at, updated_at',
      [lowercasedEmail, userData.passwordHash, userData.firstName, userData.lastName, userData.phone, userData.roleId]
    );

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roleId: row.role_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return user;
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('User with this email already exists');
    }
    if (error instanceof Error) {
      throw new Error('Database error in UserModel.create: ' + error.message);
    }
    throw new Error('Unknown database error in UserModel.create');
  }
}

export async function update(id: number, updates: Partial<{ firstName: string; lastName: string; phone: string | null; roleId: number }>): Promise<User | null> {
  try {
    const pool = getPool();
    const setClauses: string[] = [];
    const values: any[] = [];
    let parameterIndex = 1;

    for (const key of Object.keys(updates)) {
      let columnName: string;
      if (key === 'firstName') {
        columnName = 'first_name';
      } else if (key === 'lastName') {
        columnName = 'last_name';
      } else if (key === 'roleId') {
        columnName = 'role_id';
      } else {
        columnName = key;
      }

      setClauses.push(`${columnName} = $${parameterIndex}`);
      values.push(updates[key as keyof typeof updates]);
      parameterIndex++;
    }

    if (setClauses.length === 0) {
      return await findById(id);
    }

    const setClause = setClauses.join(', ');
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${parameterIndex} RETURNING id, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roleId: row.role_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Database error in UserModel.update: ' + error.message);
    }
    throw new Error('Unknown database error in UserModel.update');
  }
}

export async function deactivate(id: number): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Database error in UserModel.deactivate: ' + error.message);
    }
    throw new Error('Unknown database error in UserModel.deactivate');
  }
}