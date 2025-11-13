import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { escrowOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Fetch escrow order by ID
    const escrowOrder = await db
      .select()
      .from(escrowOrders)
      .where(eq(escrowOrders.id, parseInt(id)))
      .limit(1);

    // Check if order exists
    if (escrowOrder.length === 0) {
      return NextResponse.json(
        {
          error: 'Escrow order not found',
          code: 'ORDER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Return the escrow order
    return NextResponse.json(escrowOrder[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}