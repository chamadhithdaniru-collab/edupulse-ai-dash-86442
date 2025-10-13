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
    const { students, attendanceRecords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Analyze this school attendance data and provide insights:
Students: ${JSON.stringify(students)}
Recent Attendance: ${JSON.stringify(attendanceRecords?.slice(0, 50) || [])}

Provide JSON with:
- atRiskStudents: array of student names with attendance < 75%
- trends: string describing patterns
- recommendations: array of actionable suggestions`
        }],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      insights = {
        atRiskStudents: students.filter((s: any) => s.attendance_percentage < 75).map((s: any) => s.name),
        trends: content,
        recommendations: ["Review at-risk students regularly", "Contact parents of absent students"]
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
