import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blockedUsers } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');

    // Validate admin key
    if (adminKey !== 'ADMIN_SECRET_KEY') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Invalid admin key',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Get all blocked users
    const users = await db.select()
      .from(blockedUsers)
      .orderBy(desc(blockedUsers.blockedAt));

    return NextResponse.json(users, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}
