const appUrl = 'http://127.0.0.1:3000';

async function testRoute() {
    try {
        const res = await fetch(`${appUrl}/api/test-status`, { method: 'POST' });
        console.log('Status:', res.status);
        console.log('Body:', await res.text());
    } catch (e) {
        console.error('Error:', e);
    }
}

testRoute();
