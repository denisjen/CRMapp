import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }
  return NextResponse.json({
    id:    session.userId,
    name:  session.name,
    email: session.email,
    role:  session.role,
  });
}
