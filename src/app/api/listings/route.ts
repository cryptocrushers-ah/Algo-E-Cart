import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET all listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';

    let query = db
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
          avatarUrl: users.avatarUrl,
        },
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.status, status))
      .orderBy(desc(listings.createdAt));

    const results = await query;

    // Filter by category if specified
    const filteredResults = category && category !== 'All'
      ? results.filter(l => l.category === category)
      : results;

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST create new listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, title, description, price, category, imageUrl, ipfsHash } = body;

    if (!sellerId || !title || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newListing = await db.insert(listings).values({
      sellerId,
      title,
      description,
      price,
      category,
      imageUrl,
      ipfsHash,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newListing[0], { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
