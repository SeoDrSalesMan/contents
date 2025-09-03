import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, ...webhookData } = body;

    console.log('🔗 Attempting to call webhook:', webhookUrl);
    console.log('📤 Request payload:', JSON.stringify(webhookData, null, 2));

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Make the request to the n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    console.log('📥 Webhook response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Webhook error details:', errorText);

      return NextResponse.json(
        {
          error: `Webhook error: ${response.status} ${response.statusText}`,
          details: errorText,
          webhookUrl: webhookUrl
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Webhook response data:', JSON.stringify(data, null, 2));

    // Check if the response contains an execution URL (n8n workflow execution)
    if (data.executionUrl || (typeof data === 'string' && data.includes('/executions/'))) {
      const executionUrl = data.executionUrl || data;

      console.log('🔄 Detected n8n execution URL, fetching execution data:', executionUrl);

      try {
        // Extract execution ID from URL if it's a full URL
        let executionId = executionUrl;
        if (executionUrl.includes('/executions/')) {
          const urlParts = executionUrl.split('/executions/');
          executionId = urlParts[1];
        }

        // Fetch execution data from n8n
        const executionResponse = await fetch(`${webhookUrl.split('/webhook/')[0]}/rest/executions/${executionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (executionResponse.ok) {
          const executionData = await executionResponse.json();
          console.log('📊 Execution data retrieved:', JSON.stringify(executionData, null, 2));

          // Extract the actual structure data from the execution
          if (executionData.data && executionData.data.resultData) {
            const resultData = executionData.data.resultData;

            // Look for structure data in the execution results
            let structureData = null;

            // Try different possible paths for the structure data
            if (resultData.lastNodeExecuted && resultData.runData && resultData.runData[resultData.lastNodeExecuted]) {
              const lastNodeData = resultData.runData[resultData.lastNodeExecuted];
              if (lastNodeData && lastNodeData[0] && lastNodeData[0].data) {
                structureData = lastNodeData[0].data;
              }
            }

            if (structureData) {
              console.log('🎯 Extracted structure data:', JSON.stringify(structureData, null, 2));
              return NextResponse.json(structureData);
            }
          }

          // If we can't extract structure data, return the execution data
          return NextResponse.json({
            executionData: executionData,
            executionUrl: executionUrl,
            message: 'Execution completed but structure data format unclear'
          });
        } else {
          console.log('⚠️ Could not fetch execution data, returning original webhook response');
          return NextResponse.json(data);
        }

      } catch (executionError) {
        console.error('💥 Error fetching execution data:', executionError);
        // Return original webhook response if execution fetch fails
        return NextResponse.json(data);
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 API route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
