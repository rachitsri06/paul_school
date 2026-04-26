const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Supabase Connection
const supabaseUrl = 'https://ucdwxcrcjdmtipubxovz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
  console.log('📖 Reading Excel file...');
  const filePath = path.join(__dirname, '../students_data.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Could not find students_data.xlsx in the root paul_school folder!');
    return;
  }

  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });

  if (rows.length === 0) {
    console.log('⚠️ The excel sheet appears to be empty.');
    return;
  }

  console.log(`📊 Found ${rows.length} rows. Attempting to match headers...`);

  // Flexible column mapping logic to handle variations in their original Excel sheet
  const formatRows = rows.map(r => {
    const student = {};
    
    for (const [key, value] of Object.entries(r)) {
      if (value === null) continue;
      
      const lowerKey = key.trim().toLowerCase();
      const valText = typeof value === 'string' ? value.trim() : String(value);
      
      // Name
      if (lowerKey.includes('student') && lowerKey.includes('name')) student.name = valText;
      else if (lowerKey === 'name') student.name = valText;
      
      // Roll No & Admission
      else if (lowerKey.includes('sr_no') || lowerKey.includes('s.no') || lowerKey === 'sr no') student.sr_no = valText;
      else if (lowerKey.includes('admission')) student.admission_no = valText;
      else if (lowerKey === 'roll_no' || lowerKey.includes('roll')) student.roll_no = valText;
      
      // Class details
      else if (lowerKey === 'class') student.class_name = valText;
      else if (lowerKey === 'sec' || lowerKey === 'section') student.section = valText;
      else if (lowerKey === 'gender') student.gender = valText;
      else if (lowerKey === 'category') student.category = valText;
      else if (lowerKey === 'religion') student.religion = valText;
      
      // Dates
      else if (lowerKey === 'dob' || lowerKey.includes('birth')) {
         student.dob = (value instanceof Date) 
            ? value.toISOString().split('T')[0] 
            : valText; // let supabase parse string formats
      }
      else if (lowerKey.includes('admn date') || lowerKey.includes('admission date')) {
         student.admission_date = (value instanceof Date) 
            ? value.toISOString().split('T')[0] 
            : valText;
      }
      
      // Parents & Contact
      else if (lowerKey.includes('father') && lowerKey.includes('name')) student.father_name = valText;
      else if (lowerKey.includes('mother') && lowerKey.includes('name')) student.mother_name = valText;
      else if ((lowerKey.includes('father') || lowerKey.includes('mobile')) && !lowerKey.includes('mother')) student.phone = valText;
      else if (lowerKey.includes('mother') && lowerKey.includes('mobile')) student.mother_mobile = valText;
      else if (lowerKey.includes('address')) student.address = valText;
      
      // Transport & Misc
      else if (lowerKey === 'transport' || lowerKey.includes('route')) student.transport_route = valText;
      else if (lowerKey === 'stop') student.transport_stop = valText;
      else if (lowerKey === 'remarks') student.remarks = valText;
      else if (lowerKey.includes('blood')) student.blood_group = valText;
    }
    
    // Fallback default
    if (!student.name) student.name = 'Unknown Name';
    if (!student.roll_no) student.roll_no = `AUTO_${Math.floor(Math.random() * 100000)}`;

    return student;
  });

  const CHUNK_SIZE = 50;
  let successCount = 0;

  console.log('🚀 Starting Database Push...');
  for (let i = 0; i < formatRows.length; i += CHUNK_SIZE) {
    const chunk = formatRows.slice(i, i + CHUNK_SIZE);

    // 1. Insert Students
    const { data: insertedStudents, error: insertError } = await supabase
      .from('students')
      .insert(chunk)
      .select();

    if (insertError) {
      console.error(`❌ Error inserting chunk starting at row ${i + 1}:`, insertError.message);
      continue;
    }

    successCount += insertedStudents.length;
    console.log(`✅ Uploaded ${successCount} out of ${formatRows.length} students...`);

    // 2. Automate Parent Account Creation
    for (const student of insertedStudents) {
      if (!student.phone) continue;
      
      const email = `${student.phone}@paul.edu`;
      try {
        const { data: parent } = await supabase.from('users').select('*').eq('email', email).single();
        
        if (parent) {
          let childIds = parent.children_ids || [];
          if (!childIds.includes(student.id)) {
            childIds.push(student.id);
            await supabase.from('users').update({ children_ids: childIds }).eq('id', parent.id);
          }
        } else {
          const passwordHash = await bcrypt.hash('Parent@123', 10);
          await supabase.from('users').insert({
            email,
            password_hash: passwordHash,
            name: student.father_name || `Parent of ${student.name}`,
            role: 'parent',
            children_ids: [student.id]
          });
        }
      } catch (err) {
        console.error(`⚠️ Notice: Couldn't create parent login for student ${student.name} (Phone: ${student.phone})`, err.message);
      }
    }
  }

  console.log('🎉 ALL DONE! Students have been imported and parent logins have been created! 🎉');
}

upload().catch(console.error);
