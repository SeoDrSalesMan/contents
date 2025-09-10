import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const executionId = params.id;

  try {
    console.log(`API Proxy: Fetching execution ${executionId}`);

    // Hardcoded workflow ID for Distrito Legal
    const workflowId = 'KpdNAOeZShs0PHpE';
    const apiUrl = `https://content-generator.nv0ey8.easypanel.host/workflow/${workflowId}/executions/${executionId}`;

    console.log(`API Proxy: Calling external URL: ${apiUrl}`);

    // Make the request to the external API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`API Proxy: External API failed - Status: ${response.status}, URL: ${apiUrl}`);
      const errorText = await response.text().catch(() => 'No error details');
      console.error('API Proxy: Error response:', errorText);

      return NextResponse.json(
        {
          error: `External API failed: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`API Proxy: Successfully fetched execution ${executionId}`);

    // Return the data as JSON
    return NextResponse.json(data);

  } catch (error) {
    console.error(`API Proxy: Error fetching execution ${executionId}:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
