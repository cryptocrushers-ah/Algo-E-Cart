import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      buyer, 
      seller, 
      amount, 
      tokenId, 
      escrowAddress, 
      productName, 
      productDescription,
      txId 
    } = body;

    // Validate required fields
    if (!buyer) {
      return NextResponse.json({ 
        error: "Buyer wallet address is required",
        code: "MISSING_BUYER" 
      }, { status: 400 });
    }

    if (!seller) {
      return NextResponse.json({ 
        error: "Seller wallet address is required",
        code: "MISSING_SELLER" 
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (!escrowAddress) {
      return NextResponse.json({ 
        error: "Escrow address is required",
        code: "MISSING_ESCROW_ADDRESS" 
      }, { status: 400 });
    }

    if (!productName) {
      return NextResponse.json({ 
        error: "Product name is required",
        code: "MISSING_PRODUCT_NAME" 
      }, { status: 400 });
    }

    if (!productDescription) {
      return NextResponse.json({ 
        error: "Product description is required",
        code: "MISSING_PRODUCT_DESCRIPTION" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedBuyer = buyer.trim();
    const sanitizedSeller = seller.trim();
    const sanitizedEscrowAddress = escrowAddress.trim();
    const sanitizedProductName = productName.trim();
    const sanitizedProductDescription = productDescription.trim();
    const sanitizedTxId = txId ? txId.trim() : null;

    // Prepare insert data with auto-generated fields
    const timestamp = new Date().toISOString();
    const insertData: {
      buyer: string;
      seller: string;
      amount: number;
      tokenId?: number | null;
      escrowAddress: string;
      status: string;
      txId?: string | null;
      productName: string;
      productDescription: string;
      createdAt: string;
      updatedAt: string;
    } = {
      buyer: sanitizedBuyer,
      seller: sanitizedSeller,
      amount: amount,
      escrowAddress: sanitizedEscrowAddress,
      status: 'INIT',
      productName: sanitizedProductName,
      productDescription: sanitizedProductDescription,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Add optional fields if provided
    if (tokenId !== undefined && tokenId !== null) {
      insertData.tokenId = tokenId;
    }

    if (sanitizedTxId) {
      insertData.txId = sanitizedTxId;
    }

    // Insert new escrow order
    const newOrder = await db.insert(escrowOrders)
      .values(insertData)
      .returning();

    if (newOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create escrow order',
        code: 'CREATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(newOrder[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}