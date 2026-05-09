const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kzdjravwcjummegxxrkd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('stream_configs')
      .select('stream_url, is_live')
      .order('updated_at', { ascending: false })
      .limit(1);

    console.log('Data:', data);
    console.log('Error:', error);
  } catch (err) {
    console.error('Catch Error:', err);
  }
}

check();
