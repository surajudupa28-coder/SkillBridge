import { NextResponse } from 'next/server';

export async function POST(request) {
  void request;

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use /api/payment/create-order and /api/payment/verify for wallet top-ups.'
    },
    { status: 410 }
  );
}
