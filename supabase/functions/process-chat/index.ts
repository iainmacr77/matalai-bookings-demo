// supabase/functions/process-chat/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Ensure this path is correct

// --- Configuration ---
const GEMINI_API_MODEL = 'gemini-1.5-flash';
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:generateContent`;
const LODGES_TABLE_NAME = 'lodges';
const ROOM_TYPES_TABLE_NAME = 'room_types';
const KNOWLEDGE_BASE_TABLE_NAME = 'knowledge_base'; // For RAG + GENERAL topics ONLY
const RAG_CONTEXT_LIMIT = 5; // Limit for general KB query
const LOG_PREFIX = '[process-chat-v4-debug]'; // <<< Added -debug prefix for clarity

// --- Supabase Credentials & Client ---
let supabaseAdmin: SupabaseClient | null = null;
try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error(`${LOG_PREFIX} CRITICAL ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables!`);
    } else {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
             auth: {
                 // Required for service role key
                 persistSession: false,
                 autoRefreshToken: false,
                 detectSessionInUrl: false
             }
        });
        console.log(`${LOG_PREFIX} Supabase client initialized.`);
    }
} catch (e) {
    console.error(`${LOG_PREFIX} CRITICAL ERROR: Failed to initialize Supabase client:`, e);
}

// --- Helper Function to Get Lodge ID ---
// (No changes needed here, keeping existing)
async function getLodgeIdByName(lodgeName: string): Promise<number | null> {
    if (!supabaseAdmin) {
        console.error(`${LOG_PREFIX} [getLodgeIdByName] Supabase client not available.`);
        return null;
    }
    const namePattern = `%${lodgeName.replace(/[^a-zA-Z0-9\s]/g, '').trim()}%`;
    console.log(`${LOG_PREFIX} [getLodgeIdByName] Searching for lodge like: "${namePattern}" (Original: "${lodgeName}")`);
    const { data, error } = await supabaseAdmin
        .from(LODGES_TABLE_NAME)
        .select('id, lodge_display_name')
        .ilike('lodge_display_name', namePattern)
        .maybeSingle();

    if (error) {
        console.error(`${LOG_PREFIX} [getLodgeIdByName] Error fetching ID for name like "${namePattern}":`, error);
        return null;
    }
    if (!data) {
        console.warn(`${LOG_PREFIX} [getLodgeIdByName] Lodge not found for name like: "${namePattern}" (Original: "${lodgeName}")`);
        return null;
    }
    console.log(`${LOG_PREFIX} [getLodgeIdByName] Found lodge ID ${data.id} ("${data.lodge_display_name}") for name like: "${namePattern}"`);
    return data.id;
}

// --- Updated Intent Map ---
// (Keeping existing map)
const specificIntentMap = new Map<string[], string>([
    [['how many lodges.*south africa', 'count.*south africa', 'number lodges south africa'], 'direct_kb_lodges_count_south_africa'],
    [['how many lodges.*botswana', 'count.*botswana', 'number lodges botswana'], 'direct_kb_lodges_count_botswana'],
    [['how many lodges.*mozambique', 'count.*mozambique', 'number lodges mozambique'], 'direct_kb_lodges_count_mozambique'],
    [['total lodges', 'how many lodges overall', 'overall lodge count', 'number of lodges total', 'how many lodges.*total', 'how many lodges do you have'], 'direct_kb_lodges_count_total'],
    [['meals', 'food', 'dining', 'restaurant', 'what food'], 'direct_kb_general_safari_food_beverage_overview'],
    [['included', 'rates include', 'what is included'], 'direct_kb_general_safari_pricing_overview'],
    [['activities', 'what to do', 'excursions'], 'direct_kb_general_safari_activities_overview'],
    [['cancellation', 'cancel booking', 'refund policy'], 'direct_kb_general_safari_booking_cancellation_policies'],
    [['malaria policy', 'your policy towards malaria'], 'direct_kb_general_safari_health_safety_information'],
    [['malaria', 'safety', 'health', 'safe is it', 'health precautions'], 'direct_kb_general_safari_health_safety_information'],
    [['honeymoon', 'romantic', 'couples package'], 'direct_kb_general_safari_honeymoon_romantic_packages'],
    [['company', 'about nyoka', 'who are you'], 'direct_kb_general_safari_company_information'],
    [['sustainability', 'environment', 'conservation', 'eco friendly', 'social responsibility'], 'direct_kb_general_safari_environment_social_responsibility'],
    [['photography program', 'photo workshop', 'camera equipment advice'], 'direct_kb_general_safari_photography_program'],
    [['photography', 'taking pictures', 'camera'], 'direct_kb_general_safari_photography_program'],
    [['children policy', 'kids policy', 'family program info'], 'direct_kb_general_safari_children_family_program'],
    [['list lodges', 'lodge list', 'list all lodges', 'show.*all lodges', 'name all.*lodges', 'which lodges do you have', 'list our lodges', 'list your lodges', 'show me.*lodges', 'list all.*lodges', 'where are your lodges', 'what lodges do you have', 'lodge names', 'name the lodges'], 'action_list_lodges_all'], // Added 'list your lodges'
    [['list.*south africa lodges', 'show.*south africa lodges', 'south africa lodge list', 'lodges in south africa', 'which lodges are in south africa'], 'action_list_lodges_south_africa'], // Added 'which lodges are in south africa'
    [['list.*botswana lodges', 'show.*botswana lodges', 'botswana lodge list', 'lodges in botswana', 'which lodges are in botswana'], 'action_list_lodges_botswana'], // Added variation
    [['list.*mozambique lodges', 'show.*mozambique lodges', 'mozambique lodge list', 'lodges in mozambique', 'which lodges are in mozambique'], 'action_list_lodges_mozambique'],
    [['which lodges.*malaria zone', 'list malaria lodges', 'malaria area lodges'], 'action_filter_lodges_malaria'],
    [['which lodges.*not.*malaria zone', 'lodges outside malaria zone', 'no malaria lodges'], 'action_filter_lodges_no_malaria'],
    [['which lodges.*pool', 'lodges.*swimming pool', 'pool lodges'], 'action_filter_lodges_pool'],
    [['list family friendly.*south africa', 'family lodges in south africa'], 'action_filter_lodges_family_south_africa'],
    [['which lodges.*family friendly', 'lodges for families', 'lodges.*children allowed'], 'action_filter_lodges_family'],
    [['which lodges.*photography', 'lodges for photographers', 'photography lodges', 'which lodges.*good for photographers'], 'action_filter_lodges_photography'],
    [['which lodges.*romantic', 'lodges for couples', 'honeymoon lodges'], 'action_filter_lodges_romantic'],
    [['which lodges.*beach', 'beach lodges'], 'action_filter_lodges_beach'],
    [['children allowed.*savuti plains', 'kids allowed.*savuti plains'], 'action_check_children_savuti_plains'],
    [['children allowed.*khwai river', 'kids allowed.*khwai river'], 'action_check_children_khwai_river'],
    [['children allowed.*okavango trails', 'kids allowed.*okavango trails'], 'action_check_children_okavango_trails'],
    [['activities.*khwai river', 'what to do.*khwai river'], 'action_get_activities_khwai_river'],
    [['activities.*marula grove', 'what to do.*marula grove'], 'action_get_activities_marula_grove'],
    [['activities.*rhino ridge', 'what to do.*rhino ridge'], 'action_get_activities_rhino_ridge'],
    [['activities.*leadwood house', 'what to do.*leadwood house'], 'action_get_activities_leadwood_house'],
    [['activities.*savuti plains', 'what to do.*savuti plains'], 'action_get_activities_savuti_plains'],
    [['activities.*okavango trails', 'what to do.*okavango trails'], 'action_get_activities_okavango_trails'],
    [['activities.*baobab point', 'what to do.*baobab point'], 'action_get_activities_baobab_point'],
    [['activities.*coral coast', 'what to do.*coral coast'], 'action_get_activities_coral_coast'],
    [['activities.*bazaruto blue', 'what to do.*bazaruto blue'], 'action_get_activities_bazaruto_blue'],
    [['activities.*quite retreat', 'what to do.*quite retreat'], 'action_get_activities_quite_retreat'],
    [['nearest airport.*marula grove', 'closest airport.*marula grove', 'airport for marula grove'], 'action_get_airport_marula_grove'],
    [['nearest airport.*rhino ridge', 'closest airport.*rhino ridge', 'airport for rhino ridge'], 'action_get_airport_rhino_ridge'],
    [['nearest airport.*leadwood house', 'closest airport.*leadwood house', 'airport for leadwood house'], 'action_get_airport_leadwood_house'],
    [['nearest airport.*khwai river', 'closest airport.*khwai river', 'airport for khwai river'], 'action_get_airport_khwai_river'],
    [['nearest airport.*savuti plains', 'closest airport.*savuti plains', 'airport for savuti plains'], 'action_get_airport_savuti_plains'],
    [['nearest airport.*okavango trails', 'closest airport.*okavango trails', 'airport for okavango trails'], 'action_get_airport_okavango_trails'],
    [['nearest airport.*baobab point', 'closest airport.*baobab point', 'airport for baobab point'], 'action_get_airport_baobab_point'],
    [['nearest airport.*coral coast', 'closest airport.*coral coast', 'airport for coral coast'], 'action_get_airport_coral_coast'],
    [['nearest airport.*bazaruto blue', 'closest airport.*bazaruto blue', 'airport for bazaruto blue'], 'action_get_airport_bazaruto_blue'],
    [['nearest airport.*quite retreat', 'closest airport.*quite retreat', 'airport for quite retreat'], 'action_get_airport_quite_retreat'],
    [['list.*rooms.*marula grove', 'marula grove rooms', 'rooms in marula'], 'action_list_rooms_marula_grove'],
    [['list.*rooms.*rhino ridge', 'rhino ridge rooms', 'rooms in rhino ridge'], 'action_list_rooms_rhino_ridge'], // <<< Failing previously
    [['list.*rooms.*leadwood house', 'leadwood house rooms', 'rooms in leadwood house'], 'action_list_rooms_leadwood_house'],
    [['list.*rooms.*khwai river', 'khwai river rooms', 'rooms in khwai river'], 'action_list_rooms_khwai_river'],
    [['list.*rooms.*savuti plains', 'savuti plains rooms'], 'action_list_rooms_savuti_plains'],
    [['list.*rooms.*okavango trails', 'okavango trails rooms'], 'action_list_rooms_okavango_trails'],
    [['list.*rooms.*baobab point', 'baobab point rooms'], 'action_list_rooms_baobab_point'],
    [['list.*rooms.*coral coast', 'coral coast rooms'], 'action_list_rooms_coral_coast'],
    [['list.*rooms.*bazaruto blue', 'bazaruto blue rooms'], 'action_list_rooms_bazaruto_blue'],
    [['list.*rooms.*quite retreat', 'quite retreat rooms'], 'action_list_rooms_quite_retreat'],
    [['which rooms.*private pool', 'rooms.*plunge pool'], 'action_filter_rooms_private_pool'],
    [['which rooms.*family suites', 'list family suites', 'show me.*family suites'], 'action_filter_rooms_family_suites'], // <<< Failing previously
    [['which rooms.*outdoor shower'], 'action_filter_rooms_outdoor_shower'],
    [['how many rooms.*marula grove'], 'action_get_room_count_marula_grove'],
    [['how many rooms.*rhino ridge'], 'action_get_room_count_rhino_ridge'],
    [['how many rooms.*leadwood house'], 'action_get_room_count_leadwood_house'],
    [['how many rooms.*khwai river'], 'action_get_room_count_khwai_river'],
    [['how many rooms.*savuti plains'], 'action_get_room_count_savuti_plains'],
    [['how many rooms.*okavango trails'], 'action_get_room_count_okavango_trails'],
    [['how many rooms.*baobab point'], 'action_get_room_count_baobab_point'],
    [['how many rooms.*coral coast'], 'action_get_room_count_coral_coast'],
    [['how many rooms.*bazaruto blue'], 'action_get_room_count_bazaruto_blue'],
    [['how many rooms.*quite retreat'], 'action_get_room_count_quite_retreat'],
]);


// --- Function to check for specific intents ---
// (No changes needed here, keeping existing)
function getSpecificTopic(userMessage: string): string | null {
  const lowerCaseMessage = userMessage.toLowerCase().replace(/[?.,!]/g, '');
  const matches: { action: string, keyword: string, length: number, type: 'exact' | 'regex' }[] = [];
  // console.log(`${LOG_PREFIX} [getSpecificTopic] Normalized message: "${lowerCaseMessage}"`);

  // 1. Find ALL matches across all intents and keywords
  // console.log(`${LOG_PREFIX} [getSpecificTopic] Finding all potential matches...`);
  for (const [keywordsOrRegexes, topicOrAction] of specificIntentMap.entries()) {
      for (const keywordOrRegex of keywordsOrRegexes) {
          let isMatch = false;
          let matchType: 'exact' | 'regex' = 'exact';
          let matchLength = keywordOrRegex.length; // Use raw keyword length

          try {
              if (keywordOrRegex.includes('.*') || /^[\\^$.*+?()[\]{}|]/.test(keywordOrRegex) || /[\\^$.*+?()[\]{}|]$/.test(keywordOrRegex.replace(/\\/g,''))) {
                   matchType = 'regex';
                   const patternStr = keywordOrRegex.replace(/[-\/\\^$+|[\]{}]/g, '\\$&').replace('\\.\\*', '.*');
                   const pattern = new RegExp(patternStr, 'i');
                   isMatch = pattern.test(lowerCaseMessage);
              } else {
                   matchType = 'exact';
                   isMatch = lowerCaseMessage.includes(keywordOrRegex);
              }
          } catch (e) {
              console.error(`${LOG_PREFIX} [getSpecificTopic] Error testing keyword "${keywordOrRegex}":`, e);
              isMatch = false;
          }

          if (isMatch) {
              matches.push({ action: topicOrAction, keyword: keywordOrRegex, length: matchLength, type: matchType });
              // console.log(`${LOG_PREFIX} [getSpecificTopic]   Potential Match Found: Action=${topicOrAction}, Keyword="${keywordOrRegex}", Length=${matchLength}, Type=${matchType}`);
          }
      }
  }
  console.log(`${LOG_PREFIX} [getSpecificTopic] Found ${matches.length} total potential matches.`);

  if (matches.length === 0) {
      console.log(`${LOG_PREFIX} [getSpecificTopic] === Final Decision === No specific intent matched.`);
      return null;
  }

  // 3. Manually find the best match instead of sorting
  let bestMatch = matches[0]; // Start with the first one found

  for (let i = 1; i < matches.length; i++) {
      const currentMatch = matches[i];
      let isNewBest = false;

      // Check if current match is strictly longer than the current best
      if (currentMatch.length > bestMatch.length) {
          isNewBest = true;
      }
      // Check if lengths are equal BUT current is 'exact' and best is 'regex'
      else if (currentMatch.length === bestMatch.length && currentMatch.type === 'exact' && bestMatch.type === 'regex') {
          isNewBest = true;
      }

      if (isNewBest) {
           console.log(`${LOG_PREFIX} [getSpecificTopic]   Updating best match from "${bestMatch.keyword}"[${bestMatch.length}] to "${currentMatch.keyword}"[${currentMatch.length}]`);
          bestMatch = currentMatch;
      }
  }

  // 4. Log and return the action of the best match found
  console.log(`${LOG_PREFIX} [getSpecificTopic] === Final Decision === Matched Intent: "${bestMatch.action}" (Best Keyword: "${bestMatch.keyword}", Length: ${bestMatch.length}, Type: ${bestMatch.type})`);
  // Optional: Log other potential matches if needed, though the iteration logs above might be sufficient
  // if (matches.length > 1) { ... }

  return bestMatch.action;
}

// --- System Prompt ---
// (No changes needed here)
const systemPrompt = `You are a helpful, friendly, and knowledgeable Nyoka personal assistant for Nyoka Private Reserve, a luxury safari company with lodges in South Africa, Botswana, and Mozambique. Your primary goal is to assist users by answering questions about Nyoka's specific lodges, safari experiences, wildlife sightings, travel logistics, and our conservation efforts. You can also answer general questions about safari travel.

**Your Persona & Rules:**
- ALWAYS respond in character as a Nyoka personal assistant.
- NEVER identify yourself as an AI, large language model, or computer program. You are part of the Nyoka team.
- Be warm, enthusiastic, professional, and helpful.
- Use the **structured information queried directly from the database** (if provided in the function's response) to answer factual questions about specific lodges, features, room types etc. This is the most accurate source for these details.
- If structured information isn't available for a specific query, use the information provided below under 'Nyoka Specific Information (Context)' which has been retrieved based on the query (either specific lodge details or general topics) to answer questions whenever possible. *Synthesize information across provided context snippets if necessary.*
- If asked about Nyoka details NOT provided in structured data OR context, politely state that you don't have that specific information readily available but can help with general inquiries or suggest they contact the reservations team for specifics like exact pricing or real-time availability. DO NOT invent Nyoka-specific details.
- For general knowledge questions not related to Nyoka (e.g., "What is the capital of Botswana?"), answer helpfully using your general knowledge base.
- If the user expresses clear intent to book or check availability/pricing, gently guide them towards the 'Book Your Stay' button/page on the website.

**Nyoka Specific Information (Context Retrieved Based on Query):**
{CONTEXT_PLACEHOLDER}`;


console.log(`${LOG_PREFIX} Function booting up!`);

serve(async (req) => {
  console.log(`${LOG_PREFIX} Received ${req.method} request for ${req.url}`);

  // --- OPTIONS Request ---
  if (req.method === 'OPTIONS') {
    console.log(`${LOG_PREFIX} Responding to OPTIONS request`);
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Check Supabase Client ---
  if (!supabaseAdmin) {
      console.error(`${LOG_PREFIX} Supabase client not available.`);
       return new Response(JSON.stringify({ error: "Server configuration error [SDB-INIT]." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // --- Parse Request Body ---
    let userMessage: string | null = null;
    let chatHistory: Array<{ role: string, parts: Array<{ text: string }> }> = []; // <<< ADDED chatHistory variable declaration

     try { // Nested try for JSON parsing
        console.log(`${LOG_PREFIX} Attempting to parse request body...`);
        const body = await req.json();

        // Validate userMessage
        if (!body || typeof body.userMessage !== 'string' || body.userMessage.trim() === '') {
             console.warn(`${LOG_PREFIX} Invalid request body or missing/empty 'userMessage'. Body:`, body);
             return new Response(JSON.stringify({ error: "Invalid request: 'userMessage' is required." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        userMessage = body.userMessage.trim();

        // <<< START: ADDED chatHistory parsing logic >>>
        if (body.chatHistory && Array.isArray(body.chatHistory)) {
            // Basic validation: ensure items have 'role' and 'parts' with text
            chatHistory = body.chatHistory.filter(
                (turn: any) =>
                    typeof turn.role === 'string' &&
                    Array.isArray(turn.parts) &&
                    turn.parts.length > 0 &&
                    typeof turn.parts[0].text === 'string'
            );
            console.log(`${LOG_PREFIX} Received and validated ${chatHistory.length} turns of chat history.`);
        } else {
            console.log(`${LOG_PREFIX} No valid chatHistory received in request.`);
        }
        // <<< END: ADDED chatHistory parsing logic >>>

        console.log(`${LOG_PREFIX} Received userMessage: "${userMessage}"`);

     } catch (jsonError) { // Catch JSON parsing errors
         console.error(`${LOG_PREFIX} Failed to parse request JSON:`, jsonError);
         return new Response(JSON.stringify({ error: "Invalid request format." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     }
  
     // --- Intent Matching ---
     console.log(`${LOG_PREFIX} Attempting specific intent matching...`);
    const specificTopicOrAction = getSpecificTopic(userMessage);
    let directResponse: string | null = null;
    let actionProcessed = false;

    // --- Direct Action/Lookup Branch ---
    if (specificTopicOrAction) {
      console.log(`${LOG_PREFIX} [Direct Branch] Processing intent/action: ${specificTopicOrAction}`);
      actionProcessed = true;

      try {
        // --- A) Handle direct lookups in KNOWLEDGE_BASE (for GENERAL topics only) ---
        if (specificTopicOrAction.startsWith('direct_kb_')) {
            const topicKey = specificTopicOrAction.replace('direct_kb_', '');
            if (topicKey.startsWith('general_safari_') || topicKey.startsWith('lodges_count_')) {
                console.log(`${LOG_PREFIX} [Direct Branch] Attempting direct KB lookup for general topic/count: ${topicKey}`);
                const { data, error } = await supabaseAdmin
                  .from(KNOWLEDGE_BASE_TABLE_NAME)
                  .select('content')
                  .eq('topic', topicKey)
                  .maybeSingle();

                if (error) {
                    console.error(`${LOG_PREFIX} [Direct Branch] Supabase direct KB lookup error for topic ${topicKey}:`, error);
                    directResponse = `I found the topic "${topicKey.replace(/_/g, ' ')}", but had trouble getting details. [Error code: KB_LOOKUP]`;
                } else if (data?.content) {
                    console.log(`${LOG_PREFIX} [Direct Branch] Found direct answer in KB for topic: ${topicKey}`);
                    directResponse = data.content;
                } else {
                    console.warn(`${LOG_PREFIX} [Direct Branch] No content found in KB for specific topic: ${topicKey}. Falling back to RAG.`);
                    actionProcessed = false;
                }
            } else {
                 console.warn(`${LOG_PREFIX} [Direct Branch] Intent matched 'direct_kb_' but topic '${topicKey}' is not general or count. Falling back to RAG.`);
                 actionProcessed = false;
            }
        }
        // --- B) Handle Lodge Listing Actions (using 'lodges' table) ---
        else if (specificTopicOrAction.startsWith('action_list_lodges_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering lodge listing action: ${specificTopicOrAction}`);
            let countryFilter: string | null = null;
            let countryName = 'all our destinations';
            let queryFailed = false; // <<< DEBUG FLAG

            if (specificTopicOrAction === 'action_list_lodges_south_africa') { countryFilter = 'South Africa'; countryName = 'South Africa'; }
            else if (specificTopicOrAction === 'action_list_lodges_botswana') { countryFilter = 'Botswana'; countryName = 'Botswana'; } // <<< Failing previously
            else if (specificTopicOrAction === 'action_list_lodges_mozambique') { countryFilter = 'Mozambique'; countryName = 'Mozambique'; }

            console.log(`${LOG_PREFIX} [Lodge List Action] Preparing query for country: ${countryFilter || 'All'}`);
            let query = supabaseAdmin.from(LODGES_TABLE_NAME).select('lodge_display_name').order('lodge_display_name');
            if (countryFilter) {
                query = query.eq('country', countryFilter);
            }

            console.log(`${LOG_PREFIX} [Lodge List Action] Executing query...`);
            const { data: lodgeData, error: listError } = await query;

            if (listError) {
                console.error(`${LOG_PREFIX} [Lodge List Action] DB Error for country [${countryName}]:`, listError);
                directResponse = `I couldn't retrieve the lodge list for ${countryName} right now. Please check our website. [Error code: L_LIST_DB]`;
                queryFailed = true; // <<< DEBUG FLAG
            } else if (lodgeData && lodgeData.length > 0) {
                console.log(`${LOG_PREFIX} [Lodge List Action] Query successful, found ${lodgeData.length} lodges.`);
                const lodgeNames = lodgeData.map(l => l.lodge_display_name).filter(name => name);
                if (lodgeNames.length > 0) {
                   directResponse = `Certainly! Here are our wonderful lodges in ${countryName}:\n- ${lodgeNames.join('\n- ')}\n\nLet me know if you'd like details on any of them!`;
                } else {
                   console.warn(`${LOG_PREFIX} [Lodge List Action] Found lodge data but names were empty.`);
                   directResponse = `I found lodges for ${countryName}, but had trouble listing their names. Please try again or check our website.`;
                }
            } else {
                console.log(`${LOG_PREFIX} [Lodge List Action] Query successful, but no lodges found for country: ${countryName}`);
                directResponse = `It seems I don't have lodges listed for ${countryName} in my current records. Please visit our website for the latest information.`;
            }
             console.log(`${LOG_PREFIX} [Lodge List Action] Finished processing. Query Failed: ${queryFailed}, Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- C) Handle Lodge Filtering Actions (using 'lodges' table) ---
        else if (specificTopicOrAction.startsWith('action_filter_lodges_')) {
             console.log(`${LOG_PREFIX} [Direct Branch] Entering lodge filtering action: ${specificTopicOrAction}`);
             let query = supabaseAdmin.from(LODGES_TABLE_NAME).select('lodge_display_name');
             let filterDescription = '';
             let queryExecuted = false;
             let queryFailed = false; // <<< DEBUG FLAG

             if (specificTopicOrAction === 'action_filter_lodges_family_south_africa') {
                 console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying combined filter: family + South Africa`);
                 query = query.eq('children_allowed', true).eq('country', 'South Africa');
                 filterDescription = 'that welcome children in South Africa';
                 queryExecuted = true;
             }
             else {
                 switch(specificTopicOrAction) {
                     case 'action_filter_lodges_malaria':
                         console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: is_malaria_zone = true`);
                         query = query.eq('is_malaria_zone', true);
                         filterDescription = 'in malaria zones (precautions are essential!)';
                         queryExecuted = true;
                         break;
                     case 'action_filter_lodges_no_malaria':
                         console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: is_malaria_zone = false`);
                         query = query.eq('is_malaria_zone', false);
                         filterDescription = 'considered outside malaria risk zones';
                         queryExecuted = true;
                         break;
                     case 'action_filter_lodges_pool':
                         console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: has_communal_pool = true`);
                         query = query.eq('has_communal_pool', true);
                         filterDescription = 'with a communal swimming pool';
                          queryExecuted = true;
                         break;
                     case 'action_filter_lodges_family':
                         console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: children_allowed = true`);
                         query = query.eq('children_allowed', true);
                         filterDescription = 'that welcome children';
                          queryExecuted = true;
                         break;
                     case 'action_filter_lodges_photography': // <<< Incorrect previously
                         console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: photography_focused = true`);
                         query = query.eq('photography_focused', true); // <<< CORRECTED THIS LINE
                         filterDescription = 'particularly good for photography';
                          queryExecuted = true;
                         break;
                     case 'action_filter_lodges_spa': // <<< Failing previously
                          console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: has_spa = true`);
                          query = query.eq('has_spa', true);
                          filterDescription = 'with spa facilities';
                           queryExecuted = true;
                          break;
                     case 'action_filter_lodges_romantic':
                           console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: ideal_for contains Couples OR Honeymooners`);
                          query = query.or('ideal_for.cs.{"Couples"},ideal_for.cs.{"Honeymooners"}');
                          filterDescription = 'ideal for romantic getaways or honeymoons';
                           queryExecuted = true;
                          break;
                     case 'action_filter_lodges_beach':
                           console.log(`${LOG_PREFIX} [Lodge Filter Action] Applying filter: primary_vibe OR region_park_area indicates beach/coast`);
                          query = query.or('primary_vibe.ilike.%Beach%,region_park_area.ilike.%Coast%,region_park_area.ilike.%Archipelago%');
                          filterDescription = 'located on the beach or coast';
                           queryExecuted = true;
                          break;
                     default:
                          console.warn(`${LOG_PREFIX} Unhandled lodge filter action (in switch): ${specificTopicOrAction}`);
                          directResponse = `I understand you're looking for lodges with specific features, but I couldn't apply that filter (${specificTopicOrAction.replace('action_filter_lodges_','')}). Try asking differently?`;
                          break;
                 }
             }

             if (queryExecuted) {
                 console.log(`${LOG_PREFIX} [Lodge Filter Action] Executing filter query for: ${filterDescription}...`);
                 const { data: lodgeData, error: filterError } = await query.order('lodge_display_name');

                 if (filterError) {
                     console.error(`${LOG_PREFIX} [Lodge Filter Action] DB Error for filter [${filterDescription}]:`, filterError);
                     directResponse = `Sorry, I encountered an issue searching for lodges ${filterDescription}. [Error code: L_FILTER_DB]`;
                     queryFailed = true; // <<< DEBUG FLAG
                 } else if (lodgeData && lodgeData.length > 0) {
                      console.log(`${LOG_PREFIX} [Lodge Filter Action] Filter query successful, found ${lodgeData.length} lodges.`);
                     const lodgeNames = lodgeData.map(l => l.lodge_display_name).filter(name => name);
                     directResponse = `Okay, here are the lodges we have ${filterDescription}:\n- ${lodgeNames.join('\n- ')}\n\nWould you like to know more about any of these?`;
                 } else {
                      console.log(`${LOG_PREFIX} [Lodge Filter Action] Filter query successful, but no lodges found matching criteria "${filterDescription}".`);
                     directResponse = `I couldn't find any lodges matching the criteria "${filterDescription}" in my current records.`;
                 }
             }
             console.log(`${LOG_PREFIX} [Lodge Filter Action] Finished processing. Query Failed: ${queryFailed}, Response: ${directResponse ? 'Generated' : 'None'}`);
        }
         // --- D) Handle Nearest Airport Actions ---
         // (Adding minimal logs as this seemed to work)
         else if (specificTopicOrAction.startsWith('action_get_airport_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering nearest airport action: ${specificTopicOrAction}`);
            const lodgeNameKey = specificTopicOrAction.replace('action_get_airport_', '').replace(/_/g, ' ');
            const lodgeName = lodgeNameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            console.log(`${LOG_PREFIX} [Airport Action] Extracted lodge name: "${lodgeName}"`);

            const lodgeId = await getLodgeIdByName(lodgeName);
            if (!lodgeId) {
                 console.warn(`${LOG_PREFIX} [Airport Action] Could not find Lodge ID for name: "${lodgeName}"`);
                 directResponse = `Sorry, I couldn't identify the lodge "${lodgeName}" to find the nearest airport. Could you confirm the name?`;
            } else {
                console.log(`${LOG_PREFIX} [Airport Action] Querying airport info for Lodge ID: ${lodgeId}`);
                const { data, error } = await supabaseAdmin
                    .from(LODGES_TABLE_NAME)
                    .select('lodge_display_name, nearest_airport_code, transfer_time_minutes, transfer_method')
                    .eq('id', lodgeId)
                    .single();

                if (error) {
                    console.error(`${LOG_PREFIX} [Airport Action] DB error fetching details for Lodge ID ${lodgeId} ("${lodgeName}"):`, error);
                    directResponse = `Sorry, I had trouble looking up the airport information for ${data?.lodge_display_name || lodgeName}. [Error code: L_AIRPORT_DB]`;
                } else if (data && data.nearest_airport_code) {
                    let response = `The nearest airport typically used for ${data.lodge_display_name} is ${data.nearest_airport_code}.`;
                    if (data.transfer_method && data.transfer_time_minutes) {
                        response += ` The transfer from there is usually by ${data.transfer_method.toLowerCase()} and takes approximately ${data.transfer_time_minutes} minutes.`;
                    } else if (data.transfer_method) {
                         response += ` The transfer from there is usually by ${data.transfer_method.toLowerCase()}.`;
                    } else if (data.transfer_time_minutes) {
                         response += ` The transfer time from there is approximately ${data.transfer_time_minutes} minutes.`;
                    }
                     console.log(`${LOG_PREFIX} [Airport Action] Successfully generated airport response for ${data.lodge_display_name}`);
                    directResponse = response;
                } else if (data) {
                     console.warn(`${LOG_PREFIX} [Airport Action] Found lodge ${data.lodge_display_name}, but nearest_airport_code is missing.`);
                     directResponse = `I found ${data.lodge_display_name}, but I don't have the specific nearest airport code recorded. I recommend checking the travel details on our website or contacting reservations.`;
                } else {
                     console.error(`${LOG_PREFIX} [Airport Action] Lodge ID ${lodgeId} found but no data returned from DB query.`);
                     directResponse = `Sorry, I couldn't find airport details for "${lodgeName}".`;
                }
            }
             console.log(`${LOG_PREFIX} [Airport Action] Finished processing. Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- E) Handle Room Listing Actions ---
        else if (specificTopicOrAction.startsWith('action_list_rooms_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering room listing action: ${specificTopicOrAction}`);
            const lodgeNameKey = specificTopicOrAction.replace('action_list_rooms_', '').replace(/_/g, ' ');
            const lodgeName = lodgeNameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            console.log(`${LOG_PREFIX} [Room List Action] Extracted lodge name: "${lodgeName}"`);
            let queryFailed = false; // <<< DEBUG FLAG

            const lodgeId = await getLodgeIdByName(lodgeName);
            if (!lodgeId) {
                 console.warn(`${LOG_PREFIX} [Room List Action] Could not find Lodge ID for name: "${lodgeName}"`);
                 directResponse = `Sorry, I couldn't identify the lodge "${lodgeName}" to list its rooms. Could you confirm the lodge name?`;
            } else {
                 console.log(`${LOG_PREFIX} [Room List Action] Attempting to get lodge display name for ID: ${lodgeId}`);
                const { data: lodgeInfo, error: lodgeError } = await supabaseAdmin
                    .from(LODGES_TABLE_NAME)
                    .select('lodge_display_name')
                    .eq('id', lodgeId)
                    .single();

                const displayLodgeName = lodgeInfo?.lodge_display_name || lodgeName;
                if (lodgeError && !lodgeInfo) {
                     console.error(`${LOG_PREFIX} [Room List Action] Failed to get lodge name for ID ${lodgeId}, using "${displayLodgeName}":`, lodgeError);
                } else if (lodgeInfo) {
                     console.log(`${LOG_PREFIX} [Room List Action] Found display name: "${displayLodgeName}"`);
                }

                console.log(`${LOG_PREFIX} [Room List Action] Querying room types for lodge ID [${lodgeId}]...`);
                const { data: roomData, error: roomListError } = await supabaseAdmin
                    .from(ROOM_TYPES_TABLE_NAME)
                    .select('room_type_name, available_count')
                    .eq('lodge_id', lodgeId)
                    .order('room_type_name');

                if (roomListError) {
                    console.error(`${LOG_PREFIX} [Room List Action] DB Error for lodge ID [${lodgeId}]:`, roomListError);
                    directResponse = `I found ${displayLodgeName}, but had trouble listing its room types. Please check the lodge page on our website. [Error code: R_LIST_DB]`;
                    queryFailed = true; // <<< DEBUG FLAG
                } else if (roomData && roomData.length > 0) {
                     console.log(`${LOG_PREFIX} [Room List Action] Query successful, found ${roomData.length} room types.`);
                    const roomList = roomData.map(r => `${r.room_type_name}${r.available_count && r.available_count > 0 ? ` (${r.available_count} available)` : ''}`);
                    directResponse = `Certainly! The room types available at ${displayLodgeName} are:\n- ${roomList.join('\n- ')}`;
                } else {
                     console.log(`${LOG_PREFIX} [Room List Action] Query successful, but no room types found for lodge ID ${lodgeId}.`);
                    directResponse = `I couldn't find specific room type details listed for ${displayLodgeName} right now.`;
                }
            }
             console.log(`${LOG_PREFIX} [Room List Action] Finished processing. Query Failed: ${queryFailed}, Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- F) Handle Room Filtering Actions ---
        else if (specificTopicOrAction.startsWith('action_filter_rooms_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering room filtering action: ${specificTopicOrAction}`);
            let query = supabaseAdmin
                .from(ROOM_TYPES_TABLE_NAME)
                .select(` room_type_name, lodges!inner ( lodge_display_name ) `);
            let filterDescription = '';
            let queryExecuted = false;
            let queryFailed = false; // <<< DEBUG FLAG

            switch(specificTopicOrAction) {
                case 'action_filter_rooms_private_pool':
                    console.log(`${LOG_PREFIX} [Room Filter Action] Applying filter: has_private_pool = true`);
                    query = query.eq('has_private_pool', true);
                    filterDescription = 'with a private pool or plunge tub';
                    queryExecuted = true;
                    break;
                case 'action_filter_rooms_family_suites': // <<< Failing previously
                    console.log(`${LOG_PREFIX} [Room Filter Action] Applying filter: is_family_suite = true`);
                    query = query.eq('is_family_suite', true);
                    filterDescription = 'designated as family suites';
                     queryExecuted = true;
                    break;
                case 'action_filter_rooms_outdoor_shower':
                     console.log(`${LOG_PREFIX} [Room Filter Action] Applying filter: has_outdoor_shower = true`);
                    query = query.eq('has_outdoor_shower', true);
                    filterDescription = 'with an outdoor shower';
                     queryExecuted = true;
                    break;
                default:
                      console.warn(`${LOG_PREFIX} Unhandled room filter action: ${specificTopicOrAction}`);
                      directResponse = `I can search for rooms with specific features, but I couldn't apply that filter (${specificTopicOrAction.replace('action_filter_rooms_','')}). Try asking differently?`;
                      break;
            }

            if (queryExecuted) {
                 console.log(`${LOG_PREFIX} [Room Filter Action] Executing filter query for: "${filterDescription}"...`);
                 const { data: roomData, error: filterError } = await query.order('room_type_name');

                 if (filterError) {
                     console.error(`${LOG_PREFIX} [Room Filter Action] DB Error for filter [${filterDescription}]:`, filterError);
                     directResponse = `Sorry, I encountered an issue searching for rooms ${filterDescription}. [Error code: R_FILTER_DB]`;
                     queryFailed = true; // <<< DEBUG FLAG
                 } else if (roomData && roomData.length > 0) {
                      console.log(`${LOG_PREFIX} [Room Filter Action] Filter query successful, found ${roomData.length} rooms.`);
                     const roomsByLodge: { [key: string]: string[] } = {};
                     roomData.forEach(r => {
                         const lodgeName = r.lodges.lodge_display_name;
                         if (!roomsByLodge[lodgeName]) { roomsByLodge[lodgeName] = []; }
                         roomsByLodge[lodgeName].push(r.room_type_name);
                     });
                     let response = `Okay, here are the room types ${filterDescription}:\n`;
                     Object.keys(roomsByLodge).sort().forEach(lodgeName => {
                         response += `\n**${lodgeName}:**\n- ${roomsByLodge[lodgeName].join('\n- ')}\n`;
                     });
                     directResponse = response.trim();
                 } else {
                      console.log(`${LOG_PREFIX} [Room Filter Action] Filter query successful, but no rooms found matching criteria "${filterDescription}".`);
                     directResponse = `I couldn't find any room types matching the criteria "${filterDescription}" in my current records.`;
                 }
             }
             console.log(`${LOG_PREFIX} [Room Filter Action] Finished processing. Query Failed: ${queryFailed}, Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- G) Handle Room Count Actions ---
        // (Adding minimal logs as this seemed to work)
         else if (specificTopicOrAction.startsWith('action_get_room_count_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering room count action: ${specificTopicOrAction}`);
            const lodgeNameKey = specificTopicOrAction.replace('action_get_room_count_', '').replace(/_/g, ' ');
            const lodgeName = lodgeNameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             console.log(`${LOG_PREFIX} [Room Count Action] Extracted lodge name: "${lodgeName}"`);

            const lodgeId = await getLodgeIdByName(lodgeName);
            if (!lodgeId) {
                  console.warn(`${LOG_PREFIX} [Room Count Action] Could not find Lodge ID for name: "${lodgeName}"`);
                 directResponse = `Sorry, I couldn't identify the lodge "${lodgeName}" to get the room count.`;
            } else {
                 console.log(`${LOG_PREFIX} [Room Count Action] Querying room count for Lodge ID: ${lodgeId}`);
                const { data, error } = await supabaseAdmin
                    .from(LODGES_TABLE_NAME)
                    .select('lodge_display_name, total_room_count')
                    .eq('id', lodgeId)
                    .single();

                 if (error) {
                     console.error(`${LOG_PREFIX} [Room Count Action] DB error for Lodge ID ${lodgeId} ("${lodgeName}"):`, error);
                     directResponse = `Sorry, I had trouble finding the room count for ${data?.lodge_display_name || lodgeName}. [Error code: L_RCOUNT_DB]`;
                 } else if (data && data.total_room_count !== null && data.total_room_count >= 0) {
                      console.log(`${LOG_PREFIX} [Room Count Action] Found room count ${data.total_room_count} for ${data.lodge_display_name}`);
                     directResponse = `${data.lodge_display_name} has ${data.total_room_count} rooms/suites in total.`;
                 } else if (data) {
                      console.warn(`${LOG_PREFIX} [Room Count Action] Found lodge ${data.lodge_display_name}, but total_room_count is null or invalid: ${data.total_room_count}`);
                      directResponse = `I found ${data.lodge_display_name}, but I don't have the specific total room count recorded accurately. Please check the lodge details page.`;
                 } else {
                      console.error(`${LOG_PREFIX} [Room Count Action] Lodge ID ${lodgeId} found but no data returned from DB query.`);
                      directResponse = `Sorry, I couldn't find room count details for "${lodgeName}".`;
                 }
            }
             console.log(`${LOG_PREFIX} [Room Count Action] Finished processing. Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- H) Handle Boolean Lodge Policy Checks ---
        // (Adding minimal logs as this seemed to work)
        else if (specificTopicOrAction.startsWith('action_check_children_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering children allowed check: ${specificTopicOrAction}`);
            const lodgeNameKey = specificTopicOrAction.replace('action_check_children_', '').replace(/_/g, ' ');
            const lodgeName = lodgeNameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             console.log(`${LOG_PREFIX} [Children Check Action] Extracted lodge name: "${lodgeName}"`);

            const lodgeId = await getLodgeIdByName(lodgeName);
            if (!lodgeId) {
                 console.warn(`${LOG_PREFIX} [Children Check Action] Could not find Lodge ID for name: "${lodgeName}"`);
                directResponse = `Sorry, I couldn't identify the lodge "${lodgeName}" to check the child policy.`;
            } else {
                 console.log(`${LOG_PREFIX} [Children Check Action] Querying child policy for Lodge ID: ${lodgeId}`);
                const { data, error } = await supabaseAdmin
                    .from(LODGES_TABLE_NAME)
                    .select('lodge_display_name, children_allowed, min_child_age, min_child_age_activities')
                    .eq('id', lodgeId)
                    .single();

                if (error) {
                    console.error(`${LOG_PREFIX} [Children Check Action] DB error for Lodge ID ${lodgeId}:`, error);
                    directResponse = `Sorry, I had trouble checking the child policy for ${data?.lodge_display_name || lodgeName}. [Error code: L_CHILD_DB]`;
                } else if (data && data.children_allowed === true) {
                     console.log(`${LOG_PREFIX} [Children Check Action] Children allowed=true for ${data.lodge_display_name}. Min Age: ${data.min_child_age}, Activity Age: ${data.min_child_age_activities}`);
                    let response = `Yes, children are generally welcome at ${data.lodge_display_name}!`;
                     if (data.min_child_age !== null && data.min_child_age > 0) { response += ` The minimum age for accommodation is typically ${data.min_child_age}.`; }
                     if (data.min_child_age_activities !== null && data.min_child_age_activities > data.min_child_age) { response += ` Please note, a higher minimum age of ${data.min_child_age_activities} might apply for certain activities like game drives or walks.`; }
                     else if (data.min_child_age_activities !== null && data.min_child_age_activities > 0) { response += ` Age restrictions (typically ${data.min_child_age_activities} and up) often apply to activities like game drives or walks.`; }
                     else { response += ` Please note age restrictions might apply to certain activities.`; }
                    directResponse = response;
                } else if (data && data.children_allowed === false) {
                     console.log(`${LOG_PREFIX} [Children Check Action] Children allowed=false for ${data.lodge_display_name}. Min Age: ${data.min_child_age}`);
                    directResponse = `Unfortunately, ${data.lodge_display_name} does not typically accommodate children ${data.min_child_age !== null && data.min_child_age > 0 ? `under the age of ${data.min_child_age}` : ''}. It's generally best suited for adults or guests with older children seeking a particular atmosphere.`;
                } else {
                     console.warn(`${LOG_PREFIX} [Children Check Action] children_allowed is null or unexpected for ${data?.lodge_display_name || lodgeName}. Value: ${data?.children_allowed}`);
                     directResponse = `I don't have the specific child policy readily confirmed for ${data?.lodge_display_name || lodgeName}. Policies can sometimes vary, so it's always best to check directly with our reservations team for the most current details and to discuss your family's needs.`;
                }
            }
             console.log(`${LOG_PREFIX} [Children Check Action] Finished processing. Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- I) Handle Lodge Activities ---
         // (Adding minimal logs as this seemed to work)
        else if (specificTopicOrAction.startsWith('action_get_activities_')) {
            console.log(`${LOG_PREFIX} [Direct Branch] Entering activities check: ${specificTopicOrAction}`);
            const lodgeNameKey = specificTopicOrAction.replace('action_get_activities_', '').replace(/_/g, ' ');
            const lodgeName = lodgeNameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             console.log(`${LOG_PREFIX} [Activities Action] Extracted lodge name: "${lodgeName}"`);

            const lodgeId = await getLodgeIdByName(lodgeName);
            if (!lodgeId) {
                 console.warn(`${LOG_PREFIX} [Activities Action] Could not find Lodge ID for name: "${lodgeName}"`);
                directResponse = `Sorry, I couldn't identify the lodge "${lodgeName}" to list its activities.`;
            } else {
                 console.log(`${LOG_PREFIX} [Activities Action] Querying activities for Lodge ID: ${lodgeId}`);
                const { data, error } = await supabaseAdmin
                    .from(LODGES_TABLE_NAME)
                    .select('lodge_display_name, activities_included, activities_optional')
                    .eq('id', lodgeId)
                    .single();

                if (error) {
                    console.error(`${LOG_PREFIX} [Activities Action] DB error for Lodge ID ${lodgeId}:`, error);
                    directResponse = `Sorry, I had trouble retrieving the activities list for ${data?.lodge_display_name || lodgeName}. [Error code: L_ACTIVITY_DB]`;
                } else if (data) {
                    console.log(`${LOG_PREFIX} [Activities Action] Found activities data for ${data.lodge_display_name}. Included: ${data.activities_included?.length || 0}, Optional: ${data.activities_optional?.length || 0}`);
                    let response = `At ${data.lodge_display_name}, the following activities are typically included in your stay:\n`;
                    if (data.activities_included && Array.isArray(data.activities_included) && data.activities_included.length > 0 && data.activities_included.some(act => act.trim() !== '')) {
                        response += `- ${data.activities_included.filter(act => act.trim() !== '').join('\n- ')}`;
                    } else { response += `- Standard guided safari activities (like game drives). Specifics can be confirmed upon booking.`; }

                    if (data.activities_optional && Array.isArray(data.activities_optional) && data.activities_optional.length > 0 && data.activities_optional.some(act => act.trim() !== '')) {
                        response += `\n\nOptional activities that may be available at an additional cost include:\n- ${data.activities_optional.filter(act => act.trim() !== '').join('\n- ')}`;
                    } else { response += `\n\nI don't have specific optional activities listed for this lodge, but feel free to inquire with reservations about special requests or possibilities like private guides.`; }
                     response += `\n\nPlease note activities can sometimes be seasonal, weather-dependent, or subject to minimum age requirements.`;
                    directResponse = response;
                } else {
                     console.error(`${LOG_PREFIX} [Activities Action] Lodge ID ${lodgeId} found but no data returned from DB query.`);
                     directResponse = `I found information for ${lodgeName}, but couldn't fetch the specific activity details right now.`;
                }
            }
             console.log(`${LOG_PREFIX} [Activities Action] Finished processing. Response: ${directResponse ? 'Generated' : 'None'}`);
        }
        // --- J) Unhandled Actions or Fallback ---
        else {
            console.warn(`${LOG_PREFIX} [Direct Branch] Intent matched but no specific handler implemented: ${specificTopicOrAction}. Falling back to RAG.`);
            actionProcessed = false;
        }
      } catch (actionError) {
        console.error(`${LOG_PREFIX} [Direct Branch] Exception during action processing for ${specificTopicOrAction}:`, actionError);
        directResponse = `Sorry, I ran into an unexpected issue while trying to process your request regarding "${specificTopicOrAction.replace(/_/g, ' ')}". Could you perhaps rephrase or try asking about something else? [Error code: ACTION_EXCEPT]`;
        actionProcessed = true;
      }

      // --- Return direct response if generated by an action ---
      if (directResponse) {
        console.log(`${LOG_PREFIX} [Direct Branch] Returning direct response/action result.`);
        return new Response(JSON.stringify({ reply: directResponse }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
       if (actionProcessed && !directResponse) {
            console.error(`${LOG_PREFIX} [Direct Branch] Action processed flag is true but no response generated for ${specificTopicOrAction}. This indicates an issue in the handler.`);
             directResponse = `Sorry, I couldn't complete that specific request due to an internal issue. Please try asking in a different way. [Error code: ACTION_NO_RESP]`;
             return new Response(JSON.stringify({ reply: directResponse }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
       }
       console.log(`${LOG_PREFIX} [Direct Branch] No direct response generated or action fell back for ${specificTopicOrAction}, proceeding to RAG/LLM.`);
    }
    // --- END Direct Action/Lookup Branch ---


    // --- RAG + Gemini Fallback Logic ---
    console.log(`${LOG_PREFIX} [RAG Branch] Entering RAG + LLM fallback logic.`);

    // 1. Retrieve API Key
    console.log(`${LOG_PREFIX} [RAG Branch] Retrieving Gemini API Key...`);
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
        console.error(`${LOG_PREFIX} CRITICAL ERROR: Missing GEMINI_API_KEY env variable!`);
        return new Response(JSON.stringify({ error: "Server configuration error [API-KEY]." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log(`${LOG_PREFIX} [RAG Branch] Gemini API Key retrieved successfully.`);

    // 2. RAG Context Retrieval (Enhanced)
    console.log(`${LOG_PREFIX} [RAG Branch] Starting context retrieval...`);
    let contextString = "No specific Nyoka information found relevant to your query.";
    let contextSource = "None";

    try {
        const lowerUserMessage = userMessage.toLowerCase();
        let foundLodgeId: number | null = null;
        let foundLodgeName: string | null = null;

        // --- Simple Lodge Name Entity Extraction ---
        console.log(`${LOG_PREFIX} [RAG Branch] Starting Lodge Name Entity Extraction...`);
        const knownLodgeNames: { name: string, id: number }[] = [ // Ensure these IDs match your DB
            { name: "marula grove lodge", id: 1 }, { name: "marula grove", id: 1 }, { name: "marula", id: 1 }, // Add variations
            { name: "rhino ridge camp", id: 2 }, { name: "rhino ridge", id: 2 },
            { name: "leadwood house", id: 3 }, { name: "leadwood", id: 3 },
            { name: "khwai river lodge", id: 4 }, { name: "khwai river", id: 4 }, { name: "khwai", id: 4 },
            { name: "savuti plains camp", id: 5 }, { name: "savuti plains", id: 5 }, { name: "savuti", id: 5 },
            { name: "okavango trails", id: 6 }, { name: "okavango", id: 6 },
            { name: "baobab point", id: 7 }, { name: "baobab", id: 7 },
            { name: "coral coast lodge", id: 8 }, { name: "coral coast", id: 8 },
            { name: "bazaruto blue villa", id: 9 }, { name: "bazaruto blue", id: 9 }, { name: "bazaruto", id: 9 },
            { name: "quite retreat", id: 10 }, { name: "quite", id: 10 } // 'quite' spelling intentional
        ];

        for (const lodge of knownLodgeNames) {
             // Using simple includes first, might need refinement later
             if (lowerUserMessage.includes(lodge.name)) {
                foundLodgeId = lodge.id;
                foundLodgeName = lodge.name;
                console.log(`${LOG_PREFIX} [RAG Branch] Identified potential lodge: ${foundLodgeName} (ID: ${foundLodgeId}) via simple includes.`);
                break;
            }
        }
         console.log(`${LOG_PREFIX} [RAG Branch] Lodge Name Extraction completed. Found ID: ${foundLodgeId}`);

        // --- Fetch Context Based on Entity ---
        if (foundLodgeId && foundLodgeName) {
            contextSource = `Lodge Specific (ID: ${foundLodgeId})`;
            console.log(`${LOG_PREFIX} [RAG Branch] Fetching context for lodge ID ${foundLodgeId} from lodges/room_types tables...`);
            let specificContext = "";

            // Fetch lodge overview and key details
            console.log(`${LOG_PREFIX} [RAG Branch] Querying LODGES table for ID ${foundLodgeId}...`);
            const { data: lodgeData, error: lodgeError } = await supabaseAdmin
                .from(LODGES_TABLE_NAME)
                .select('lodge_display_name, overview_description, primary_vibe, key_wildlife, country, region_park_area, accommodation_style, luxury_level, ideal_for')
                .eq('id', foundLodgeId)
                .single();

            if (lodgeError) {
                console.error(`${LOG_PREFIX} [RAG Branch] Error fetching lodge details for ID ${foundLodgeId}:`, lodgeError);
            } else if (lodgeData) {
                 console.log(`${LOG_PREFIX} [RAG Branch] LODGES query successful for ${lodgeData.lodge_display_name}.`);
                specificContext += `Lodge Information for ${lodgeData.lodge_display_name}:\n`;
                if(lodgeData.overview_description) specificContext += `Overview: ${lodgeData.overview_description}\n`;
                if(lodgeData.primary_vibe) specificContext += `Vibe: ${lodgeData.primary_vibe}\n`;
                if(lodgeData.luxury_level) specificContext += `Luxury Level: ${lodgeData.luxury_level}\n`;
                if(lodgeData.accommodation_style) specificContext += `Style: ${lodgeData.accommodation_style}\n`;
                if(lodgeData.key_wildlife && Array.isArray(lodgeData.key_wildlife) && lodgeData.key_wildlife.length > 0) specificContext += `Key Wildlife: ${lodgeData.key_wildlife.join(', ')}\n`;
                if(lodgeData.ideal_for && Array.isArray(lodgeData.ideal_for) && lodgeData.ideal_for.length > 0) specificContext += `Ideal For: ${lodgeData.ideal_for.join(', ')}\n`;
                if(lodgeData.country && lodgeData.region_park_area) specificContext += `Location: ${lodgeData.region_park_area}, ${lodgeData.country}\n`;
                specificContext += "---\n";
            } else {
                 console.warn(`${LOG_PREFIX} [RAG Branch] LODGES query returned no data for ID ${foundLodgeId}.`);
                 specificContext += `Lodge Information for ${foundLodgeName}:\n`; // Use matched name as fallback title
            }

            // Fetch room types for that lodge
             console.log(`${LOG_PREFIX} [RAG Branch] Querying ROOM_TYPES table for lodge_id ${foundLodgeId}...`);
             const { data: roomData, error: roomError } = await supabaseAdmin
                .from(ROOM_TYPES_TABLE_NAME)
                .select('room_type_name, description, key_features')
                .eq('lodge_id', foundLodgeId)
                 .order('room_type_name');

             if (roomError) {
                console.error(`${LOG_PREFIX} [RAG Branch] Error fetching room details for lodge ID ${foundLodgeId}:`, roomError);
             } else if (roomData && roomData.length > 0) {
                 console.log(`${LOG_PREFIX} [RAG Branch] ROOM_TYPES query successful, found ${roomData.length} rooms.`);
                 specificContext += `\nRoom Types at this lodge:\n`;
                 roomData.forEach(room => {
                     specificContext += `- ${room.room_type_name}: ${room.description}`;
                      if (room.key_features && Array.isArray(room.key_features) && room.key_features.length > 0) {
                          specificContext += ` Key Features: ${room.key_features.join(', ')}.`;
                      }
                     specificContext += `\n`;
                 });
             } else {
                  console.log(`${LOG_PREFIX} [RAG Branch] ROOM_TYPES query returned no rooms for lodge ID ${foundLodgeId}.`);
             }

             // Check if we actually got substantial context
            if (specificContext && specificContext.length > `Lodge Information for ${foundLodgeName}:\n---\n`.length + 50) { // Added buffer length check
                 contextString = specificContext.trim();
                 console.log(`${LOG_PREFIX} [RAG Branch] Successfully fetched and formatted specific context. Length: ${contextString.length}`);
            } else {
                 console.warn(`${LOG_PREFIX} [RAG Branch] Found lodge ID ${foundLodgeId} but failed to fetch significant details. Falling back to general KB search.`);
                 foundLodgeId = null; // <<< CRITICAL: Reset to trigger general search below
                 contextSource = "Lodge Specific (Fetch Failed/Empty)";
            }
        }

        // --- Fallback to General Knowledge Base Search ---
         if (foundLodgeId === null) { // <<< Check the reset flag
            contextSource = contextSource === "Lodge Specific (Fetch Failed/Empty)" ? contextSource : "General KB";
            console.log(`${LOG_PREFIX} [RAG Branch] ${contextSource === 'General KB' ? 'No specific lodge identified.' : 'Lodge detail fetch failed/empty.'} Proceeding with KB Search.`);

            console.log(`${LOG_PREFIX} [RAG Branch] Extracting Keywords for KB Search...`);
            const stopWords = new Set(['the', 'a', 'an', 'is', 'in', 'of', 'to', 'for', 'on', 'at', 'it', 'and', 'or', 'i', 'me', 'my', 'you', 'your', 'are', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'what', 'when', 'where', 'who', 'why', 'how', 'tell', 'about', 'with', 'from', 'near', 'lodge', 'camp', 'villa', 'house', 'retreat', 'point', 'grove', 'ridge', 'river', 'plains', 'trails', 'coast', 'blue']);
            const extractedKeywords = lowerUserMessage
                .replace(/[^\w\s]/gi, '')
                .split(/\s+/)
                .filter(word => word.length > 2 && !stopWords.has(word));
            console.log(`${LOG_PREFIX} [RAG Branch] Extracted Keywords for KB Search: ${extractedKeywords.length > 0 ? extractedKeywords.join(', ') : 'None'}`);

            if (extractedKeywords.length > 0) {
                 console.log(`${LOG_PREFIX} [RAG Branch] Querying ${KNOWLEDGE_BASE_TABLE_NAME} with keywords...`);
                const { data: knowledgeData, error: knowledgeError } = await supabaseAdmin
                  .from(KNOWLEDGE_BASE_TABLE_NAME)
                  .select('content, topic')
                  .overlaps('keywords', extractedKeywords)
                  .limit(RAG_CONTEXT_LIMIT);

                if (knowledgeError) {
                    console.error(`${LOG_PREFIX} [RAG Branch] Supabase KB query error:`, knowledgeError);
                     contextString = "I encountered an issue searching my general knowledge base for that topic.";
                } else if (knowledgeData && knowledgeData.length > 0) {
                     console.log(`${LOG_PREFIX} [RAG Branch] Found ${knowledgeData.length} general context snippets from ${KNOWLEDGE_BASE_TABLE_NAME}.`);
                    contextString = knowledgeData.map(row => `General Topic: ${row.topic.replace('general_safari_', '').replace(/_/g, ' ')}\nContent: ${row.content}`).join('\n\n---\n\n');
                    console.log(`${LOG_PREFIX} [RAG Branch] Formatted general context. Length: ${contextString.length}`);
                } else {
                    console.log(`${LOG_PREFIX} [RAG Branch] No relevant general information found in ${KNOWLEDGE_BASE_TABLE_NAME} for keywords.`);
                    // Keep default contextString: "No specific Nyoka information found..."
                }
             } else {
                console.log(`${LOG_PREFIX} [RAG Branch] No usable keywords extracted for general KB search.`);
                // Keep default contextString
             }
        }

    } catch (ragError) {
      console.error(`${LOG_PREFIX} [RAG Branch] Error during RAG context retrieval phase:`, ragError);
      contextString = "Sorry, I encountered an error while trying to find information for your query.";
      contextSource = "RAG Error";
    }

    console.log(`${LOG_PREFIX} [RAG Branch] Context Retrieval finished. Source Used: ${contextSource}. Context Length: ${contextString.length}`);
    // console.log(`${LOG_PREFIX} [RAG Branch] Final Context String (Truncated for log):\n---\n${contextString.substring(0, 500)}${contextString.length > 500 ? '...' : ''}\n---`);


       // 3. Prepare & Send Gemini Request
       console.log(`${LOG_PREFIX} [RAG Branch] Preparing Gemini request payload...`);
       const finalSystemPrompt = systemPrompt.replace('{CONTEXT_PLACEHOLDER}', contextString);
       const apiUrl = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;
   
       // Define the payload for the Gemini API call
       const payload = {
           // <<< START: MODIFIED contents FOR CHAT HISTORY >>>
           contents: [
               // 1. System Prompt (includes RAG context)
               { role: "model", parts: [ { text: finalSystemPrompt } ] },
               // 2. Chat History (prepended)
               ...chatHistory, // Spread the received chat history turns
               // 3. Latest User Message
               { role: "user", parts: [ { text: userMessage! } ] } // Add the current user message, assert non-null
           ],
           // <<< END: MODIFIED contents FOR CHAT HISTORY >>>
   
           // Safety settings (remain unchanged)
           safetySettings: [
               { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
               { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            ],
            // Generation configuration (remains unchanged)
            generationConfig: { temperature: 0.6, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
       };
       // Log payload preparation completion
       console.log(`${LOG_PREFIX} [RAG Branch] Gemini payload prepared with ${chatHistory.length} history turns.`); // Added history count log
   
       // Optional: Log truncated payload for debugging (remains unchanged)
       // const logPayload = JSON.parse(JSON.stringify(payload));
       // if (logPayload.contents[0]?.parts[0]?.text && logPayload.contents[0]?.parts[0]?.text.length > 300) { logPayload.contents[0].parts[0].text = logPayload.contents[0].parts[0].text.substring(0, 300) + `... (System Prompt + Context Truncated)`; }
       // console.log(`${LOG_PREFIX} [RAG Branch] Sending payload (truncated context):`, JSON.stringify(logPayload));
   
       // Attempt to call the Gemini API
       console.log(`${LOG_PREFIX} [RAG Branch] Attempting to call Gemini API at ${GEMINI_API_ENDPOINT}...`);
       let geminiApiResponse: Response | null = null;
       let fetchStartTime = Date.now(); // Time the fetch
       try {
            // Make the actual API request
            geminiApiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // Send the constructed payload
            });
            let fetchEndTime = Date.now();
            // Log the outcome of the fetch attempt
            console.log(`${LOG_PREFIX} [RAG Branch] Gemini API fetch completed. Status: ${geminiApiResponse?.status}. Duration: ${fetchEndTime - fetchStartTime}ms`);
       } catch (fetchError) { // Catch network errors during the fetch
           let fetchEndTime = Date.now();
           console.error(`${LOG_PREFIX} [RAG Branch] Fetch error calling Gemini API after ${fetchEndTime - fetchStartTime}ms:`, fetchError);
           // geminiApiResponse remains null if fetch fails
       }
       // --- Handle Gemini Response --- (This line should be the one immediately following the block you replace)

    // 4. Handle Gemini Response
    console.log(`${LOG_PREFIX} [RAG Branch] Handling Gemini response...`);
    if (!geminiApiResponse || !geminiApiResponse.ok) {
         console.error(`${LOG_PREFIX} [RAG Branch] Gemini API request failed or fetch error occurred.`);
         let errorBody = `Gemini API request failed`;
         if (geminiApiResponse) {
             errorBody += ` with status ${geminiApiResponse.status}.`;
             try {
                 const errorJson = await geminiApiResponse.json();
                 console.error(`${LOG_PREFIX} [RAG Branch] Gemini API error response body:`, JSON.stringify(errorJson));
                 errorBody += ` Details: ${JSON.stringify(errorJson?.error?.message || errorJson)}`;
             } catch (e) {
                 try { const textError = await geminiApiResponse.text(); console.error(`${LOG_PREFIX} [RAG Branch] Could not parse Gemini error JSON, raw text: ${textError}`); errorBody += ` Raw Response: ${textError.substring(0, 200)}...`; }
                 catch (textE) { console.error(`${LOG_PREFIX} [RAG Branch] Could not parse Gemini error response body or get raw text.`); }
             }
         } else { errorBody += ` due to a network issue during fetch.`; }
         return new Response(JSON.stringify({ error: `Sorry, I couldn't connect to the assistance service right now. Please try again later. [${errorBody}]` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Process Success Response
    console.log(`${LOG_PREFIX} [RAG Branch] Processing successful Gemini response (Status: ${geminiApiResponse.status})...`);
    let botReply = "Sorry, I wasn't able to retrieve that specific information right now, or I couldn't formulate a helpful response.";
    try {
        const responseData = await geminiApiResponse.json();
        console.log(`${LOG_PREFIX} [RAG Branch] Gemini response JSON parsed successfully.`);
        // Optional: console.log(`${LOG_PREFIX} [RAG Branch] Gemini Raw Response Data:`, JSON.stringify(responseData));

        const candidate = responseData?.candidates?.[0];
        const safetyRatings = candidate?.safetyRatings;
        let blocked = false;
        let blockReason = "";

        if (safetyRatings) {
             for (const rating of safetyRatings) {
                 if (rating.blocked === true) { blocked = true; blockReason = `Safety Category: ${rating.category}`; console.warn(`${LOG_PREFIX} [RAG Branch] Gemini response blocked by safety setting: ${rating.category}`); break; }
             }
        }
        if (!blocked && candidate?.finishReason === 'SAFETY') { blocked = true; blockReason = `Finish Reason: ${candidate.finishReason}`; console.warn(`${LOG_PREFIX} [RAG Branch] Gemini response explicitly finished due to SAFETY.`); }

        if (candidate?.content?.parts?.[0]?.text && !blocked) {
            botReply = candidate.content.parts[0].text;
            console.log(`${LOG_PREFIX} [RAG Branch] Successfully extracted reply from Gemini. Finish Reason: ${candidate.finishReason || 'OK'}. Reply Length: ${botReply.length}`);
        } else if (blocked) {
            botReply = `I cannot provide a response to that query due to safety guidelines. (${blockReason})`;
             console.warn(`${LOG_PREFIX} [RAG Branch] Responding with safety block message.`);
        } else if (candidate?.finishReason) {
             console.warn(`${LOG_PREFIX} [RAG Branch] Gemini response finished with reason: ${candidate.finishReason}, but no text content found or blocked.`);
             if (candidate.finishReason === 'MAX_TOKENS') { botReply = "My thoughts on that were a bit too long for this chat! Could you perhaps ask for something more specific based on the information I might have provided?"; }
             else if (candidate.finishReason === 'RECITATION') { botReply = "It seems my response might have been too similar to copyrighted material. Could you rephrase your question?"; }
             else { botReply = `Sorry, I couldn't generate a full response for that. (Reason: ${candidate.finishReason})`; }
        } else {
             console.warn(`${LOG_PREFIX} [RAG Branch] Unexpected Gemini response structure or empty content (and not blocked):`, JSON.stringify(responseData));
             botReply = "Sorry, I received an unusual response from my assistance service. Please try asking differently.";
        }
    } catch (parseError) {
         console.error(`${LOG_PREFIX} [RAG Branch] Error parsing Gemini success response JSON:`, parseError);
         botReply = "Sorry, I had trouble understanding the response from my assistance service. Please try again.";
          return new Response(JSON.stringify({ error: botReply }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`${LOG_PREFIX} [RAG Branch] Finished processing RAG request. Returning reply.`);

    // 6. Return RAG Response
    return new Response(JSON.stringify({ reply: botReply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });


  } catch (error) {
    // 7. Catch-All Error Handler
    console.error(`${LOG_PREFIX} General error caught in top-level serve function:`, error);
    let errorMessage = 'Sorry, an unexpected internal error occurred while processing your request.';
    if (error instanceof Error) {
        errorMessage = `Sorry, an unexpected issue occurred (${error.name}). Please try again later. [Error code: GENERAL]`;
        console.error(`${LOG_PREFIX} Error Name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`); // Log stack trace
    } else {
        console.error(`${LOG_PREFIX} Non-Error object thrown:`, error);
    }
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

/* ==================================================
 * REMINDER: Deploy changes using the Supabase CLI:
 * supabase functions deploy process-chat --no-verify-jwt
 * Check Supabase function logs ([process-chat-v4-debug] prefix).
 * ================================================== */