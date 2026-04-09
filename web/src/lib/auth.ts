import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
export const JWT_ALGORITHM = 'HS256';

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
    JWT_SECRET,
    { expiresIn: '2h', algorithm: JWT_ALGORITHM }
  );
}

export function createRefreshToken(userId: string) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_SECRET,
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
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM as jwt.Algorithm] }) as jwt.JwtPayload;
    if (payload.type !== 'access') {
      return null;
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
