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
const appUrl = 'http://127.0.0.1:3000'; // Force IPv4

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerError() {
    console.log('Fetching a link to test...');
    const { data: link } = await supabase.from('krowba_links').select('id').limit(1).single();

    if (!link) {
        console.log('No links found to test.');
        return;
    }

    console.log(`Testing update for link ${link.id}...`);

    try {
        const res = await fetch(`${appUrl}/api/orders/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                linkId: link.id,
                status: 'shipped',
                action: 'mark_shipped',
                shipping_proof_url: 'https://example.com/proof.jpg',
                shipping_courier: 'Test Courier',
                tracking_number: '123456',
                shipping_notes: 'Test notes'
            })
        });

        console.log('Response Status:', res.status);
        const text = await res.text();
        console.log('Response Body:', text);
    } catch (e) {
        console.error('Fetch failed:', e.message);
        if (e.cause) console.error('Cause:', e.cause);
    }
}

triggerError();
