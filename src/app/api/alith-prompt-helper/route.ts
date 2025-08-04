import { NextRequest, NextResponse } from 'next/server';
import { alithPromptHelper } from '@/ai/flows/alith-prompt-helper';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await alithPromptHelper({ prompt });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in alith prompt helper:', error);
    return NextResponse.json(
      { error: 'Failed to refine prompt' },
      { status: 500 }
    );
  }
}
