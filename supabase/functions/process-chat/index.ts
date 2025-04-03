// supabase/functions/process-chat/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Ensure this path is correct

// Gemini API endpoint (e.g., for gemini-pro model)
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

console.log('[process-chat] Function booting up!');

serve(async (req) => {
  console.log(`[process-chat] Received ${req.method} request`);

  // --- 1. Handle OPTIONS preflight request ---
  // Browsers send this before POST/PUT etc. to check CORS policy
  if (req.method === 'OPTIONS') {
    console.log('[process-chat] Handling OPTIONS request (CORS preflight)');
    return new Response('ok', { headers: corsHeaders }); // Respond with CORS headers
  }

  try {
    // --- 2. Parse Incoming Request Body ---
    const { message } = await req.json();
    // console.log("[process-chat] Received message text:", message); // Uncomment for debugging if needed

    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error("[process-chat] Invalid or missing 'message' in request body");
      // Return a 400 Bad Request error
      return new Response(
        JSON.stringify({ error: "Invalid request: 'message' parameter is required and must be a non-empty string." }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // --- 3. Retrieve API Key Secret ---
    console.log("[process-chat] Attempting to retrieve GEMINI_API_KEY from environment variables...");
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.error("CRITICAL ERROR: [process-chat] GEMINI_API_KEY environment variable not found!");
      // Return a 500 Internal Server Error - this is a server config issue
      return new Response(
        JSON.stringify({ error: "Server configuration error: API Key is missing. Please contact support." }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Log confirmation without exposing the key itself
      console.log(`[process-chat] GEMINI_API_KEY retrieved successfully (Length: ${apiKey.length}).`);
      // For deeper debugging ONLY (REMOVE LATER):
      // console.log("[process-chat] Key starts with: " + apiKey.substring(0, 5));
    }

    // --- 4. Prepare and Send Request to Gemini ---
    // Construct the URL with the API key as a query parameter
    const apiUrl = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;

    // Define the payload structure required by the Gemini API
    const payload = {
      contents: [{ parts: [{ text: message }] }],
      // Optional: Add generationConfig or safetySettings here if needed
      // generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      // safetySettings: [ { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" } ]
    };

    console.log("[process-chat] Sending request to Gemini API...");
    // console.log("[process-chat] Payload:", JSON.stringify(payload)); // Uncomment only if essential for debugging

    const geminiApiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[process-chat] Gemini API response status: ${geminiApiResponse.status}`);

    // --- 5. Handle Gemini API Response ---
    if (!geminiApiResponse.ok) {
      // If the response status is not 2xx, read the error body
      const errorBodyText = await geminiApiResponse.text();
      console.error(`[process-chat] Gemini API Error Response (${geminiApiResponse.status}): ${errorBodyText}`);

      // Try to parse the JSON error for a cleaner message, but fallback gracefully
      let errorMessage = `Gemini API request failed with status ${geminiApiResponse.status}. Check function logs for details.`;
      try {
          const errorJson = JSON.parse(errorBodyText);
          // Extract the specific error message from Google if available
          if (errorJson && errorJson.error && errorJson.error.message) {
              errorMessage = `Gemini API Error: ${errorJson.error.message}`;
          }
      } catch (parseError) {
          console.warn("[process-chat] Could not parse Gemini error response as JSON.");
          // Use the status text or the raw text if parsing fails
          errorMessage = `Gemini API request failed: ${geminiApiResponse.status} ${geminiApiResponse.statusText || errorBodyText}`;
      }

      // Throw an error that will be caught by the main catch block below
      // This keeps error handling consistent
      throw new Error(errorMessage);
    }

    // --- 6. Process Successful Gemini Response ---
    const responseData = await geminiApiResponse.json();
    let botReply = "Sorry, I could not extract a response."; // Default reply

    // Safely access the nested structure of the Gemini response
    try {
      // Accessing the first candidate's first content part's text
      // Adjust path if using different models or response structures
      botReply = responseData.candidates[0].content.parts[0].text;
    } catch (parseError) {
      console.error('[process-chat] Error parsing expected structure from Gemini response:', parseError);
      console.error('[process-chat] Full Gemini response data:', JSON.stringify(responseData)); // Log the full response if parsing fails
      // Keep the default 'botReply' message
    }

    console.log("[process-chat] Successfully processed request. Sending reply back to client.");

    // --- 7. Return Success Response to Client ---
    return new Response(
      JSON.stringify({ reply: botReply }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK
      }
    );

  } catch (error) {
    // --- 8. Catch-All Error Handler ---
    console.error("[process-chat] General error during function execution:", error);

    // Return a generic 500 error response
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected server error occurred.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Internal Server Error
      }
    );
  }
});

/*
 * ==================================================
 * REMINDER: Deploy changes using the Supabase CLI:
 * supabase functions deploy process-chat --no-verify-jwt
 * ==================================================
 */