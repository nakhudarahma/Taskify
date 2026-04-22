import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    const dateContext = `Today is ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a task parsing assistant. Extract task information from natural language input.
${dateContext}

Parse the user's input and return a JSON object with:
- title: The main task description (required)
- date: The due date in YYYY-MM-DD format (optional, use relative references like "tomorrow" or "next Friday" to calculate the actual date)
- time: The time in HH:MM format (24-hour, optional)
- duration_minutes: Duration in minutes (optional, convert "2 hours" to 120, "30 mins" to 30, etc.)
- confidence: A number 0-1 indicating how confident you are in the parsing
- needs_clarification: Boolean indicating if important info is missing
- clarification_question: If needs_clarification is true, a friendly question to ask the user

Examples:
- "Remind me to submit my AI assignment tomorrow at 5 PM" → {"title": "Submit AI assignment", "date": "2024-01-21", "time": "17:00", "confidence": 0.95}
- "Study for 2 hours on Sunday" → {"title": "Study", "date": "2024-01-28", "duration_minutes": 120, "confidence": 0.9}
- "Call mom" → {"title": "Call mom", "needs_clarification": true, "clarification_question": "When would you like to be reminded to call mom?", "confidence": 0.7}

Return ONLY valid JSON, no markdown or explanation.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse task' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedTask;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedTask = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      // Fallback: create a basic task from the input
      parsedTask = {
        title: text,
        confidence: 0.5,
        needs_clarification: true,
        clarification_question: "I couldn't fully understand. Could you provide more details?",
      };
    }

    return new Response(
      JSON.stringify(parsedTask),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-task function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
