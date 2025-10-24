import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET user by wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, username, bio, avatarUrl } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const newUser = await db.insert(users).values({
      walletAddress,
      username: username || `User${Date.now()}`,
      bio,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
