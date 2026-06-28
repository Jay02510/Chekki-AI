import fetch from 'node-fetch';

async function test() {
  const passcode = 'ChecciAdmin2026!';
  
  try {
    let res = await fetch('http://localhost:3000/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, action: 'list' }),
    });
    let data = await res.json();
    console.log('LIST:', res.status, data);

    if (data.users && data.users.length > 0) {
      const uid = data.users[0].uid;
      console.log('\nTesting downgrade for UID:', uid);
      res = await fetch('http://localhost:3000/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'downgrade', uid }),
      });
      data = await res.json();
      console.log('DOWNGRADE:', res.status, data);
    }
  } catch (e) {
    console.error('FETCH ERROR:', e);
  }
}

test();
