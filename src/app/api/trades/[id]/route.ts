import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trades, listings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET single trade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tradeId = parseInt(id);

    const result = await db
      .select({
        id: trades.id,
        listingId: trades.listingId,
        buyerId: trades.buyerId,
        sellerId: trades.sellerId,
        amount: trades.amount,
        escrowAddress: trades.escrowAddress,
        status: trades.status,
        txnId: trades.txnId,
        createdAt: trades.createdAt,
        updatedAt: trades.updatedAt,
        listing: {
          id: listings.id,
          title: listings.title,
          description: listings.description,
          imageUrl: listings.imageUrl,
        },
        buyer: {
          id: users.id,
          username: users.username,
          walletAddress: users.walletAddress,
        },
      })
      .from(trades)
      .leftJoin(listings, eq(trades.listingId, listings.id))
      .leftJoin(users, eq(trades.buyerId, users.id))
      .where(eq(trades.id, tradeId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

// PATCH update trade status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tradeId = parseInt(id);
    const body = await request.json();

    const updated = await db
      .update(trades)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trades.id, tradeId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}
