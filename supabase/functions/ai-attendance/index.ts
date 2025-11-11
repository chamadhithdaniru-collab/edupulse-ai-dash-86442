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
    const body = await req.json();

    // Validate inputs
    if (!body.imageData || typeof body.imageData !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid imageData - must be a base64 string' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!body.imageData.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'imageData must be a base64 image (data:image/...)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.imageData.length > 10000000) { // 10MB limit
      return new Response(JSON.stringify({ error: 'Image too large (max 10MB)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return new Response(JSON.stringify({ error: 'Invalid date format (use YYYY-MM-DD)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageData, date } = body;
    
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
    
    const formattedDate = date;

    // Use AI to read attendance register (OCR approach)
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
              text: `You are analyzing an attendance register photo from a Sri Lankan school. The register is a table/grid showing:
- Student INDEX NUMBERS in the first column
- Attendance marks in subsequent columns (1 = present, 0 = absent)
- Date columns across the top

REGISTERED STUDENTS (only update these students):
${students?.map(s => `- Index: ${s.index_number}, Name: ${s.name}, Grade: ${s.grade}${s.section ? '-' + s.section : ''}, ID: ${s.id}`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Carefully read the attendance register table/form in the image
2. Find the column for date ${formattedDate} (or today's date column)
3. For each row, read the INDEX NUMBER and the attendance mark (1 or 0) for that date
4. Match the index numbers you read with the registered students list above
5. ONLY include students that are in the registered list
6. If an index number is not in the registered list, skip it
7. If you cannot read the register clearly or find the date column, return an empty array

IMPORTANT: Sri Lankan attendance registers typically show:
- Index numbers as 4-6 digit numbers (like 12345, 67890)
- Grid/table format with dates across the top
- Marks "1" for present and "0" for absent in cells
- Sometimes handwritten, sometimes printed

Return ONLY a valid JSON array with this exact structure:
[
  {
    "student_id": "the-student-uuid-from-above",
    "index_number": "the-index-you-read",
    "status": 1,
    "date": "${formattedDate}"
  }
]

Example valid response:
[
  {"student_id": "abc-123-def", "index_number": "12345", "status": 1, "date": "${formattedDate}"},
  {"student_id": "ghi-456-jkl", "index_number": "67890", "status": 0, "date": "${formattedDate}"}
]

If the register is unclear or you cannot read it properly: []`
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
    
    let attendanceData: any[] = [];
    try {
      // Try to parse as array directly
      attendanceData = JSON.parse(content);
      if (!Array.isArray(attendanceData)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      attendanceData = [];
    }

    console.log('Parsed attendance data:', attendanceData);

    // Update attendance based on AI analysis
    const attendanceRecords = [];
    const errors = [];
    let updatedCount = 0;

    for (const record of attendanceData) {
      if (!record.student_id || record.status === undefined) {
        continue;
      }
      
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert({
          student_id: record.student_id,
          date: record.date || date,
          status: record.status,
          absence_reason: record.status === 0 ? 'Marked absent in register' : null
        }, {
          onConflict: 'student_id,date'
        });

      if (upsertError) {
        console.error(`Error updating attendance:`, upsertError);
        errors.push({ index: record.index_number, error: upsertError.message });
      } else {
        updatedCount++;
        attendanceRecords.push({
          index_number: record.index_number,
          status: record.status === 1 ? 'present' : 'absent'
        });
      }
    }

    console.log(`Attendance updated for ${updatedCount} students from register`);

    return new Response(JSON.stringify({
      success: true,
      identified_count: updatedCount,
      total_students: students?.length || 0,
      attendance_records: attendanceRecords,
      errors: errors.length > 0 ? errors : undefined,
      message: updatedCount > 0 
        ? `Successfully read and updated ${updatedCount} student records from register` 
        : 'Could not read attendance marks from the register. Please ensure the image is clear and shows the attendance grid with index numbers and marks (1/0).'
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
