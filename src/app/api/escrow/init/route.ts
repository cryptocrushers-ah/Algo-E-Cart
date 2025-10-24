import { NextRequest, NextResponse } from 'next/server';
import { initTrade } from '@/lib/escrow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerAddress, buyerAddress, amount } = body;

    if (!sellerAddress || !buyerAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: sellerAddress, buyerAddress, amount' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create escrow account
    const escrowAddress = await initTrade(sellerAddress, buyerAddress, amount);

    return NextResponse.json({
      escrowAddress,
      status: 'initialized',
      message: 'Escrow account created successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error initializing escrow:', error);
    return NextResponse.json(
      { error: 'Failed to initialize escrow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
