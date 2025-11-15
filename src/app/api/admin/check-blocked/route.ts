import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blockedUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    // Validate address parameter
    if (!address) {
      return NextResponse.json(
        { 
          error: 'Wallet address is required',
          code: 'MISSING_ADDRESS'
        },
        { status: 400 }
      );
    }

    // Query blockedUsers table for the wallet address
    const blockedUser = await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.walletAddress, address))
      .limit(1);

    // If blocked user found, return blocked info
    if (blockedUser.length > 0) {
      const blocked = blockedUser[0];
      return NextResponse.json(
        {
          blocked: true,
          reason: blocked.reason,
          blockedAt: blocked.blockedAt,
          blockedBy: blocked.blockedBy
        },
        { status: 200 }
      );
    }

    // If not blocked, return false
    return NextResponse.json(
      { blocked: false },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}