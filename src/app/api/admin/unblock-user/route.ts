import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blockedUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, adminKey } = body;

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

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { 
          error: 'Wallet address is required',
          code: 'MISSING_ADDRESS'
        },
        { status: 400 }
      );
    }

    // Delete blocked user
    const deleted = await db.delete(blockedUsers)
      .where(eq(blockedUsers.walletAddress, walletAddress.trim()))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found in blocked list',
          code: 'USER_NOT_BLOCKED'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'User unblocked successfully',
        user: deleted[0]
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}
