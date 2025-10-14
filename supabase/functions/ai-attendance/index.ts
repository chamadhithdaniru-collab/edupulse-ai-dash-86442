import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, date } = await req.json();
    
    console.log('Processing attendance image for date:', date);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all students to match against
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw studentsError;
    }

    console.log(`Found ${students?.length || 0} students in database`);

    // Use AI to identify students in the image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this classroom photo and identify which students are present. 
              
Here is the list of all students with their index numbers:
${students?.map(s => `- ${s.name} (Index: ${s.index_number})`).join('\n')}

Return a JSON array with ONLY the index numbers of students you can clearly identify as present in the photo.
Format: {"present_students": ["index1", "index2", ...]}

Be conservative - only include students you are confident about identifying.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData
              }
            }
          ]
        }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log('AI response:', content);
    
    let identifiedStudents;
    try {
      const parsed = JSON.parse(content);
      identifiedStudents = parsed.present_students || [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Try to extract index numbers from the response
      const indexMatches = content.match(/\d{3,}/g) || [];
      identifiedStudents = indexMatches;
    }

    console.log('Identified students:', identifiedStudents);

    // Update attendance for identified students
    const attendanceRecords = [];
    const errors = [];

    for (const student of students || []) {
      const isPresent = identifiedStudents.includes(student.index_number);
      
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert({
          student_id: student.id,
          date: date,
          status: isPresent ? 1 : 0,
          absence_reason: isPresent ? null : 'Not identified in photo'
        }, {
          onConflict: 'student_id,date'
        });

      if (upsertError) {
        console.error(`Error updating attendance for ${student.name}:`, upsertError);
        errors.push({ student: student.name, error: upsertError.message });
      } else {
        attendanceRecords.push({
          name: student.name,
          index_number: student.index_number,
          status: isPresent ? 'present' : 'absent'
        });
      }
    }

    console.log(`Attendance updated for ${attendanceRecords.length} students`);

    return new Response(JSON.stringify({
      success: true,
      identified_count: identifiedStudents.length,
      total_students: students?.length || 0,
      attendance_records: attendanceRecords,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-attendance function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
