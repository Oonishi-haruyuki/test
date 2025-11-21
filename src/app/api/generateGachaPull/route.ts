
import {NextResponse} from 'next/server';
import {generateGachaPull, type GenerateGachaPullInput} from '@/ai/flows/generate-gacha-pull';

export async function POST(req: Request) {
  try {
    const input: GenerateGachaPullInput = await req.json();
    const result = await generateGachaPull(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in generateGachaPull API:', error);
    return NextResponse.json(
      {error: error.message || 'An unexpected error occurred'},
      {status: 500}
    );
  }
}
