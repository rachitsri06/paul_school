import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  return 'insecure-dev-only-secret-do-not-use-in-production';
}
export const JWT_ALGORITHM = 'HS256';
export const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'admin@paul.com';
export const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'Admin@123';
export const MASTER_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

export const MASTER_USER = {
  id: MASTER_ADMIN_ID,
  email: MASTER_ADMIN_EMAIL,
  name: 'Master Admin',
  role: 'admin',
  children_ids: []
};

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

export function createAccessToken(userId: string, email: string) {
  return jwt.sign(
    { sub: userId, email, type: 'access' },
    getJwtSecret(),
    { expiresIn: '2h', algorithm: JWT_ALGORITHM }
  );
}

export function createRefreshToken(userId: string) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    getJwtSecret(),
    { expiresIn: '7d', algorithm: JWT_ALGORITHM }
  );
}

export async function getCurrentUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/access_token=([^;]+)/);
  let token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM as jwt.Algorithm] }) as jwt.JwtPayload;
    if (payload.type !== 'access') {
      return null;
    }

    if (payload.sub === MASTER_ADMIN_ID) {
      return { ...MASTER_USER };
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', payload.sub).single();
    if (!user) return null;

    delete user.password_hash;
    return user;
  } catch (err) {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export async function requireStaff(request: Request) {
  const user = await getCurrentUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    throw new Error('Admin or Teacher access required');
  }
  return user;
}
