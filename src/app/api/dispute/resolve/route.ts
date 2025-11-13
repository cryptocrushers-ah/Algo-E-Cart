import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, resolution, adminKey } = body;

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

    if (!resolution) {
      return NextResponse.json(
        { 
          error: 'Resolution is required',
          code: 'MISSING_RESOLUTION'
        },
        { status: 400 }
      );
    }

    if (!adminKey) {
      return NextResponse.json(
        { 
          error: 'Admin key is required',
          code: 'MISSING_ADMIN_KEY'
        },
        { status: 400 }
      );
    }

    // Simple admin authentication
    if (adminKey !== 'ADMIN_SECRET_KEY') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Invalid admin key',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Validate ID is valid integer
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid escrow order ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Validate resolution value
    if (resolution !== 'COMPLETED' && resolution !== 'REFUND') {
      return NextResponse.json(
        { 
          error: 'Resolution must be COMPLETED or REFUND',
          code: 'INVALID_RESOLUTION'
        },
        { status: 400 }
      );
    }

    // Find escrow order by ID
    const existingOrder = await db.select()
      .from(escrowOrders)
      .where(eq(escrowOrders.id, parseInt(id)))
      .limit(1);

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

    // Validate current status is DISPUTED
    if (order.status !== 'DISPUTED') {
      return NextResponse.json(
        { 
          error: 'Order must be in DISPUTED status to resolve',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Update escrow order with resolution
    const updatedOrder = await db.update(escrowOrders)
      .set({
        status: resolution,
        updatedAt: new Date().toISOString()
      })
      .where(eq(escrowOrders.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        order: updatedOrder[0],
        resolution: resolution,
        message: 'Dispute resolved successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}