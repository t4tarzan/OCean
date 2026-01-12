import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryPostgres } from '@/lib/db-connections';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { nickname } = await request.json();

    await queryPostgres(
      'UPDATE platform_users SET nickname = $1 WHERE email = $2',
      [nickname, session.user.email]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nickname:', error);
    return NextResponse.json({ error: 'Failed to update nickname' }, { status: 500 });
  }
}
