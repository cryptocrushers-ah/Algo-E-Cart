import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, seller } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Escrow order ID is required',
          code: 'MISSING_ID'
        },
        { status: 400 }
      );
    }

    if (!seller) {
      return NextResponse.json(
        { 
          error: 'Seller address is required',
          code: 'MISSING_SELLER'
        },
        { status: 400 }
      );
    }

    // Validate ID is valid integer
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Find escrow order by id
    const existingOrder = await db.select()
      .from(escrowOrders)
      .where(eq(escrowOrders.id, orderId))
      .limit(1);

    // Return 404 if order not found
    if (existingOrder.length === 0) {
      return NextResponse.json(
        { 
          error: 'Escrow order not found',
          code: 'ORDER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const order = existingOrder[0];

    // Validate current status is 'FUNDED'
    if (order.status !== 'FUNDED') {
      return NextResponse.json(
        { 
          error: `Cannot mark as delivered. Order status must be FUNDED but is ${order.status}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate that the seller address matches the order's seller address
    if (order.seller !== seller) {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Only seller can mark as delivered',
          code: 'UNAUTHORIZED_SELLER'
        },
        { status: 403 }
      );
    }

    // Update escrow order status to DELIVERED
    const updatedOrder = await db.update(escrowOrders)
      .set({
        status: 'DELIVERED',
        updatedAt: new Date().toISOString()
      })
      .where(eq(escrowOrders.id, orderId))
      .returning();

    // Return updated escrow order
    return NextResponse.json(updatedOrder[0], { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}