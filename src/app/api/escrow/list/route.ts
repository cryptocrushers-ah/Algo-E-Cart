import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const walletAddress = searchParams.get('address');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(escrowOrders);

    // Filter by wallet address (buyer OR seller)
    if (walletAddress) {
      query = query.where(
        or(
          eq(escrowOrders.buyer, walletAddress),
          eq(escrowOrders.seller, walletAddress)
        )
      );
    }

    // Additional status filter
    if (status) {
      query = query.where(eq(escrowOrders.status, status));
    }

    const orders = await query
      .orderBy(desc(escrowOrders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}