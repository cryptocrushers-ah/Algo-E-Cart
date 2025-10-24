import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trades, listings, users } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';

// GET trades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = db
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
      .orderBy(desc(trades.createdAt));

    let results = await query;

    // Filter by user if specified
    if (userId) {
      const userIdInt = parseInt(userId);
      results = results.filter(
        t => t.buyerId === userIdInt || t.sellerId === userIdInt
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST create new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, buyerId, sellerId, amount, escrowAddress } = body;

    if (!listingId || !buyerId || !sellerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newTrade = await db.insert(trades).values({
      listingId,
      buyerId,
      sellerId,
      amount,
      escrowAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newTrade[0], { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
