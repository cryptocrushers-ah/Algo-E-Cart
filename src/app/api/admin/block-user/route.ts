import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blockedUsers } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, reason, adminKey, adminAddress } = body;

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

    if (!reason) {
      return NextResponse.json(
        { 
          error: 'Reason is required',
          code: 'MISSING_REASON'
        },
        { status: 400 }
      );
    }

    if (!adminAddress) {
      return NextResponse.json(
        { 
          error: 'Admin address is required',
          code: 'MISSING_ADMIN_ADDRESS'
        },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Insert blocked user
    const blockedUser = await db.insert(blockedUsers)
      .values({
        walletAddress: walletAddress.trim(),
        reason: reason.trim(),
        blockedBy: adminAddress.trim(),
        blockedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(blockedUser[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { 
          error: 'User is already blocked',
          code: 'USER_ALREADY_BLOCKED'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}
