import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, buyer } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { 
          error: "Escrow order ID is required",
          code: "MISSING_ORDER_ID" 
        },
        { status: 400 }
      );
    }

    if (!buyer) {
      return NextResponse.json(
        { 
          error: "Buyer address is required",
          code: "MISSING_BUYER_ADDRESS" 
        },
        { status: 400 }
      );
    }

    // Validate ID is valid integer
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { 
          error: "Valid order ID is required",
          code: "INVALID_ORDER_ID" 
        },
        { status: 400 }
      );
    }

    // Find escrow order by id
    const existingOrder = await db.select()
      .from(escrowOrders)
      .where(eq(escrowOrders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { 
          error: "Escrow order not found",
          code: "ORDER_NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    const order = existingOrder[0];

    // Validate current status is 'DELIVERED'
    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { 
          error: "Order must be in DELIVERED status to confirm delivery",
          code: "INVALID_ORDER_STATUS",
          currentStatus: order.status
        },
        { status: 400 }
      );
    }

    // Validate that the buyer address matches the order's buyer address
    if (order.buyer !== buyer) {
      return NextResponse.json(
        { 
          error: "Unauthorized: Only buyer can confirm delivery",
          code: "UNAUTHORIZED_BUYER" 
        },
        { status: 403 }
      );
    }

    // Update escrow order status to COMPLETED
    const updatedOrder = await db.update(escrowOrders)
      .set({
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
      })
      .where(eq(escrowOrders.id, orderId))
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { 
          error: "Failed to update escrow order",
          code: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }

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