import { NextRequest, NextResponse } from 'next/server';
import { fetchCVRecords } from '@/lib/airtable';
import { CVSearchParams } from '@/types/cv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: CVSearchParams = {
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'uploadDate',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await fetchCVRecords(params);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV records' },
      { status: 500 }
    );
  }
}