import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { UserRole } from './types';

export interface SessionData {
  userId: number;
  deptId: number;
  name: string;
  email: string;
  role: UserRole;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'crm-secret-key-change-in-production-32chars',
  cookieName: 'crm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
