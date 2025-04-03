import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your function logic here
    const data = { message: 'Hello from Edge Function!' }

    // Return response with CORS headers
    return new Response(
      JSON.stringify(data),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
}) 