import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { validateEmail } from '../utils/validators';
import { ValidationError, UnauthorizedError } from '../utils/errorHandlers';
import { AUTH_SECRET } from '../config/auth';
import { RoleModel } from '../models/RoleModel';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId },
      AUTH_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId
      }
    });
  } catch (error) {
    throw error;
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, AUTH_SECRET);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      throw error;
    }

    const userId = decoded.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const newToken = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId },
      AUTH_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token: newToken });
  } catch (error) {
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    throw error;
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const role = await RoleModel.findById(user.roleId);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        roleName: role ? role.name : null,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    throw error;
  }
}