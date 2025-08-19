import Airtable from 'airtable';
import { AirtableRecord, CVRecord, CVSearchParams } from '@/types/cv';

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is required');
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is required');
}

if (!process.env.AIRTABLE_TABLE_NAME) {
  throw new Error('AIRTABLE_TABLE_NAME is required');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

const table = base(process.env.AIRTABLE_TABLE_NAME);

export const transformAirtableRecord = (record: AirtableRecord): CVRecord => {
  const fields = record.fields;
  
  return {
    id: record.id,
    firstName: fields['First Name'] || '',
    lastName: fields['Last Name'] || '',
    email: fields['Email'] || '',
    universities: fields['Univeristies '] || '',
    resumeSummary: fields['doc_resume_summary'] || '',
    detectedGaps: fields['detected_gaps_1'] || '',
    interviewQuestions: fields['interview_questions'] || '',
    holderSummary: fields['holder_summary'] || '',
    cvUrl: fields['CV'] || '',
    uploadDate: fields['Time'] || new Date().toISOString(),
  };
};

export const fetchCVRecords = async (params: CVSearchParams = {}) => {
  const {
    search = '',
    sortBy = 'uploadDate',
    sortDirection = 'desc',
    page = 1,
    pageSize = 20,
  } = params;

  try {
    const sortField = sortBy === 'uploadDate' ? 'Time' : 
                     sortBy === 'firstName' ? 'First Name' :
                     sortBy === 'lastName' ? 'Last Name' :
                     sortBy === 'email' ? 'Email' :
                     'Time';

    // Build select options
    const selectOptions: any = {
      sort: [{ field: sortField, direction: sortDirection }],
      maxRecords: pageSize * page,
    };
    
    // Add filter formula if search term is provided
    if (search) {
      const searchConditions = [
        `SEARCH(LOWER("${search.toLowerCase()}"), LOWER({First Name}))`,
        `SEARCH(LOWER("${search.toLowerCase()}"), LOWER({Last Name}))`,
        `SEARCH(LOWER("${search.toLowerCase()}"), LOWER({Email}))`
      ].join(', ');
      
      selectOptions.filterByFormula = `OR(${searchConditions})`;
    }

    const records = await table.select(selectOptions).all();

    const transformedRecords = records.map(record => 
      transformAirtableRecord(record as unknown as AirtableRecord)
    );

    // Manual pagination since Airtable doesn't support offset
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = transformedRecords.slice(startIndex, endIndex);

    const totalRecords = transformedRecords.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      records: paginatedRecords,
      totalRecords,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error('Error fetching CV records:', error);
    throw new Error('Failed to fetch CV records');
  }
};

export const createCVRecord = async (data: Partial<CVRecord>) => {
  try {
    const record = await table.create({
      'First Name': data.firstName,
      'Last Name': data.lastName,
      'Email': data.email,
      'Univeristies ': data.universities,
      'doc_resume_summary': data.resumeSummary,
      'detected_gaps_1': data.detectedGaps,
      'interview_questions': data.interviewQuestions,
      'holder_summary': data.holderSummary,
      'CV': data.cvUrl,
      'Time': data.uploadDate || new Date().toISOString(),
    });

    return transformAirtableRecord(record as AirtableRecord);
  } catch (error) {
    console.error('Error creating CV record:', error);
    throw new Error('Failed to create CV record');
  }
};