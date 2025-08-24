import { NextRequest, NextResponse } from 'next/server';
import { fetchCVRecords } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'uploadDate';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Validate sortBy parameter
    const validSortFields = ['uploadDate', 'firstName', 'lastName', 'email'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'uploadDate';

    // Validate sortDirection parameter
    const finalSortDirection = ['asc', 'desc'].includes(sortDirection) ? sortDirection : 'desc';

    const result = await fetchCVRecords({
      search,
      sortBy: finalSortBy,
      sortDirection: finalSortDirection as 'asc' | 'desc',
      page,
      pageSize
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in CV API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV records' },
      { status: 500 }
    );
  }
}