const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dyoicvurrhuokfufsrwc.supabase.co';
const supabaseKey = 'sb_publishable_4Xb4nVQw7LhlRU8xfb1jcQ_oMw_4WwB';
const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { CNAME: 'Computers & Desktops' },
  { CNAME: 'Laptops & Notebooks' },
  { CNAME: 'Printers & Scanners' },
  { CNAME: 'Networking & Routers' },
  { CNAME: 'Monitors & Displays' },
  { CNAME: 'Storage (HDD, SSD, Flash)' },
  { CNAME: 'Computer Components (CPU, RAM, Motherboards)' },
  { CNAME: 'Peripherals (Keyboards, Mice)' },
  { CNAME: 'Cables & Adapters' },
  { CNAME: 'Software & Licenses' },
  { CNAME: 'Audio & Video' },
  { CNAME: 'Power & UPS' },
  { CNAME: 'Server & Enterprise' },
  { CNAME: 'Accessories & Gadgets' }
];

async function insertCategories() {
  console.log('Inserting categories...');
  const { data, error } = await supabase.from('category').insert(categories).select();
  
  if (error) {
    console.error('Error inserting categories:', error);
  } else {
    console.log(`Successfully inserted ${data.length} categories.`);
  }
}

insertCategories();
