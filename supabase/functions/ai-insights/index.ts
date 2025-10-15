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
          content: `You are an educational data analyst. Analyze this school attendance data and provide actionable insights.

STUDENT DATA:
${JSON.stringify(students, null, 2)}

RECENT ATTENDANCE RECORDS (showing date, student_id, status where 1=present, 0=absent):
${JSON.stringify(attendanceRecords?.slice(0, 100) || [], null, 2)}

Analyze the data carefully and provide:
1. At-risk students: List students with attendance percentage < 75% OR showing declining attendance patterns
2. Attendance trends: Identify patterns like:
   - Which days have lower attendance
   - Which grades or sections have attendance issues
   - Any students who were previously good but are declining
   - Class-wide attendance patterns
3. Smart recommendations: Provide specific, actionable suggestions based on the actual data

Return ONLY valid JSON in this exact format:
{
  "atRiskStudents": ["Student Name 1", "Student Name 2"],
  "trends": "Detailed analysis of attendance patterns found in the data",
  "recommendations": ["Specific action 1", "Specific action 2", "Specific action 3"]
}`
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
