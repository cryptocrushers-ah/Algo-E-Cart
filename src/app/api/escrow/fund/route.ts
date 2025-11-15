import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { escrowOrders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, app_id, tx_id, amount, shipping_address } = body;

    // 🧩 Validate required fields
    if (!tx_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required', code: 'MISSING_TX_ID' },
        { status: 400 }
      );
    }

    if (!id && !app_id) {
      return NextResponse.json(
        { error: 'Either order ID or app_id is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    // 🧮 Determine lookup key
    const whereClause = id
      ? eq(escrowOrders.id, parseInt(id))
      : eq(escrowOrders.id, parseInt(app_id));

    const existingOrder = await db
      .select()
      .from(escrowOrders)
      .where(whereClause)
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Escrow order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const order = existingOrder[0];

    // 🚫 Validate current status
    if (order.status !== 'INIT') {
      return NextResponse.json(
        {
          error: `Order is currently '${order.status}'. Only 'INIT' orders can be funded.`,
          code: 'INVALID_ORDER_STATUS',
        },
        { status: 400 }
      );
    }

    // 💾 Update escrow order
    const updatedOrder = await db
      .update(escrowOrders)
      .set({
        status: 'FUNDED',
        txId: tx_id.trim(),
        // Remove shippingAddress as it's not a known property on escrowOrders table
        updatedAt: new Date().toISOString(),
      })
      .where(whereClause)
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: '✅ Escrow funded successfully!',
        order: updatedOrder[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ POST /api/escrow/fund error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
