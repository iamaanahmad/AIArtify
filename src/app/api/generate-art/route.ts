import { NextRequest, NextResponse } from 'next/server';
import { generateArt } from '@/ai/flows/generate-art-flow';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateArt({ prompt });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating art:', error);
    return NextResponse.json(
      { error: 'Failed to generate art' },
      { status: 500 }
    );
  }
}
