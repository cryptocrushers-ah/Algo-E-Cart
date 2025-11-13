import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    // Validate admin key against environment variable
    const serverAdminKey = process.env.ADMIN_SECRET_KEY;

    if (!serverAdminKey) {
      console.error('ADMIN_SECRET_KEY not configured in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          code: 'SERVER_ERROR'
        },
        { status: 500 }
      );
    }

    if (!adminKey) {
      return NextResponse.json(
        { 
          error: 'Admin key is required',
          code: 'MISSING_KEY'
        },
        { status: 400 }
      );
    }

    if (adminKey !== serverAdminKey) {
      return NextResponse.json(
        { 
          error: 'Invalid admin key',
          code: 'INVALID_KEY'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Admin key validated successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}
