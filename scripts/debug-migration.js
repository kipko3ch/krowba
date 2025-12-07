const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('1. Checking columns...');

    const columns = ['shipping_proof_url', 'shipping_courier', 'tracking_number', 'shipping_notes'];
    const { data: checkData, error: checkError } = await supabase
        .from('krowba_links')
        .select(columns.join(','))
        .limit(1);

    if (checkError) {
        console.error('Column check failed:', checkError.message);
        return;
    }
    console.log('Columns exist.');

    console.log('2. Testing UPDATE with service role...');
    const { data: link } = await supabase.from('krowba_links').select('id').limit(1).single();
    if (!link) {
        console.log('No link found to update.');
        return;
    }

    const { error: updateError } = await supabase
        .from('krowba_links')
        .update({
            shipping_proof_url: 'https://test.com/proof.jpg',
            shipping_courier: 'Test',
            tracking_number: '123',
            shipping_notes: 'Test note'
        })
        .eq('id', link.id);

    if (updateError) {
        console.error('Update failed:', updateError.message);
    } else {
        console.log('Update successful!');
    }
}

debug();
