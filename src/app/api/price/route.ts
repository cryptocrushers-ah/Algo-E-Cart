import { NextResponse } from 'next/server';
import axios from 'axios';

// GET ALGO/USD price from CoinGecko
export async function GET() {
  try {
    const response = await axios.get(
  "https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd",
  { headers: { "Cache-Control": "max-age=60" } } // cache 1 min
);


    const algoPrice = response.data.algorand.usd;

    return NextResponse.json({ 
      algo_usd: algoPrice,
      timestamp: Date.now() 
    });
  } catch (error) {
    console.error('Error fetching ALGO price:', error);
    // Return fallback price if API fails
    return NextResponse.json({ 
      algo_usd: 0.25,
      timestamp: Date.now(),
      fallback: true 
    });
  }
}
