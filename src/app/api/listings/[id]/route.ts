import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id);

    const result = await db
      .select({
        id: listings.id,
        sellerId: listings.sellerId,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        category: listings.category,
        imageUrl: listings.imageUrl,
        ipfsHash: listings.ipfsHash,
        status: listings.status,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        seller: {
          id: users.id,
          walletAddress: users.walletAddress,
          username: users.username,
          bio: users.bio,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.id, listingId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PATCH update listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id);
    const body = await request.json();

    const updated = await db
      .update(listings)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(listings.id, listingId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id);

    await db.delete(listings).where(eq(listings.id, listingId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
