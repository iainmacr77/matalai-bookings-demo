export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer, range',
  'Access-Control-Expose-Headers': 'content-range',
  'Access-Control-Max-Age': '86400',
}

export async function handleCors(req: Request): Promise<Response | undefined> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
} 