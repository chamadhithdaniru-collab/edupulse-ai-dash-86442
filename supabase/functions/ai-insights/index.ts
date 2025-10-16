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
          content: `You are an educational data analyst for a Sri Lankan school (Grades 1-13). Analyze attendance data and provide detailed insights.

STUDENT DATA (${students.length} students):
${JSON.stringify(students, null, 2)}

RECENT ATTENDANCE RECORDS (${attendanceRecords?.length || 0} records, 1=present, 0=absent):
${JSON.stringify(attendanceRecords?.slice(0, 200) || [], null, 2)}

ANALYSIS REQUIREMENTS:

1. INDIVIDUAL STUDENT ANALYSIS:
   - Identify students with attendance < 75%
   - Find students with declining patterns (e.g., was 90%+ now below 80%)
   - Look for students marked as 'at_risk' status
   - Check for recent absence patterns (consecutive absences, specific days)

2. CLASS-WIDE TRENDS:
   - Overall attendance percentage across all students
   - Grade-level patterns (which grades have lower attendance?)
   - Section-specific issues (e.g., Grade 10-A vs 10-B)
   - Day-of-week patterns (are Mondays/Fridays worse?)
   - Recent trends (improving or declining over time?)

3. DETAILED RECOMMENDATIONS:
   - Specific actions for at-risk students (name them)
   - Grade/section-specific interventions
   - Parent engagement strategies
   - Early warning system suggestions
   - Recognition for students with perfect/excellent attendance

Return ONLY valid JSON in this exact format:
{
  "atRiskStudents": ["Full Name (Grade X-Y, Attendance: Z%, Reason)", ...],
  "trends": "Detailed multi-paragraph analysis covering: overall attendance rate, grade-level patterns, day-of-week trends, recent changes, concerning patterns, and positive highlights",
  "recommendations": ["Specific action 1 with student names", "Specific action 2 with data", "Specific action 3", ...]
}

IMPORTANT: Base everything on ACTUAL DATA. If there's insufficient data, clearly state that in the trends section.`
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
