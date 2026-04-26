const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://ucdwxcrcjdmtipubxovz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZHd4Y3JjamRtdGlwdWJ4b3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg5MCwiZXhwIjoyMDkxMjk2ODkwfQ.Q_E2pd6EOj_BUlrK-HLSZZrLkzFapveI9SnZOPIQ_oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUpload() {
  console.log('🧹 1. Cleaning up the previous messy auto-generated students...');
  // Delete all students that were auto-generated with random Roll Nos from the previous script
  const { error: delErr } = await supabase.from('students').delete().like('roll_no', 'AUTO_%');
  if (delErr) {
    console.error('Failed to clean up old records:', delErr.message);
  }

  console.log('📖 2. Reading Excel file...');
  const filePath = path.join(__dirname, '../students_data.xlsx');
  
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });

  const formatRows = rows.map(r => {
    const student = {};
    
    for (const [key, value] of Object.entries(r)) {
      if (value === null || value === undefined || value === '') continue;
      
      const lowerKey = key.trim().toLowerCase();
      const valText = typeof value === 'string' ? value.trim() : String(value);
      
      // Name
      if (lowerKey.includes('name') && !lowerKey.includes('father') && !lowerKey.includes('mother')) student.name = valText;
      
      // Roll No & Admission
      else if (lowerKey === 's.n.' || lowerKey.includes('sr') || lowerKey.includes('s.no')) student.sr_no = valText;
      else if (lowerKey.includes('admn') && lowerKey.includes('no')) student.admission_no = valText;
      else if (lowerKey.includes('roll')) student.roll_no = valText;
      
      // Class details
      else if (lowerKey.includes('class')) student.class_name = valText;
      else if (lowerKey.includes('sec')) student.section = valText;
      else if (lowerKey.includes('gen') || lowerKey.includes('sex')) student.gender = valText;
      
      // Dates
      else if (lowerKey.includes('dob') || lowerKey.includes('birth')) {
         student.dob = (value instanceof Date) ? value.toISOString().split('T')[0] : valText;
      }
      else if (lowerKey.includes('admn') && lowerKey.includes('date')) {
         student.admission_date = (value instanceof Date) ? value.toISOString().split('T')[0] : valText;
      }
      
      // Category & Religion
      else if (lowerKey.includes('cat')) student.category = valText;
      else if (lowerKey.includes('relig')) student.religion = valText;
      
      // Parents & Contact
      else if (lowerKey.includes('father') && lowerKey.includes('name')) student.father_name = valText;
      else if (lowerKey.includes('mother') && lowerKey.includes('name')) student.mother_name = valText;
      
      // Father/Primary Mobile (Looking for "Mob." or "Mobile" combined with "Father" or just default Mobile)
      else if ((lowerKey.includes('father') && lowerKey.includes('mob')) || (lowerKey.includes('phone') && !lowerKey.includes('mother')) || (lowerKey.includes('contact') && !lowerKey.includes('mother'))) student.phone = valText;
      
      // Mother Mobile
      else if (lowerKey.includes('mother') && lowerKey.includes('mob')) student.mother_mobile = valText;
      
      else if (lowerKey.includes('addres')) student.address = valText;
      else if (lowerKey.includes('trans')) student.transport_route = valText;
      else if (lowerKey.includes('stop')) student.transport_stop = valText;
      else if (lowerKey.includes('remark')) student.remarks = valText;
      else if (lowerKey.includes('blood')) student.blood_group = valText;
    }
    
    if (!student.name) student.name = 'Unknown Name';
    // Fallback to Admission No as Roll No if Roll No is missing
    if (!student.roll_no) student.roll_no = student.admission_no || student.sr_no || `AUTO_${Math.floor(Math.random() * 100000)}`;

    return student;
  });

  const CHUNK_SIZE = 50;
  let successCount = 0;

  console.log('🚀 3. Pushing Corrected Data to Database...');
  for (let i = 0; i < formatRows.length; i += CHUNK_SIZE) {
    const chunk = formatRows.slice(i, i + CHUNK_SIZE);

    const { data: insertedStudents, error: insertError } = await supabase
      .from('students')
      .insert(chunk)
      .select();

    if (insertError) {
      console.error(`❌ Error inserting chunk:`, insertError.message);
      continue;
    }

    successCount += insertedStudents.length;
    console.log(`✅ Uploaded ${successCount} perfect students...`);
    
    // Attempt Parent Logs silently for corrected students
    for (const student of insertedStudents) {
      if (!student.phone) continue;
      const email = `${student.phone}@paul.edu`;
      try {
        const { data: parent } = await supabase.from('users').select('*').eq('email', email).single();
        if (!parent) {
          const phash = await bcrypt.hash('Parent@123', 10);
          await supabase.from('users').insert({
            email, password_hash: phash, name: student.father_name || `Parent of ${student.name}`,
            role: 'parent', children_ids: [student.id]
          });
        }
      } catch(e) {}
    }
  }

  console.log('🎉 Fixed Upload Complete! Go check your portal! 🎉');
}

fixUpload().catch(console.error);
