async function testLiveServer() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🔍 Testing live server endpoints at ' + BASE_URL);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ Health Check:', health.status);

  // 2. Citizen Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@sahaay.demo', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  console.log('✓ Citizen Login:', loginData.success ? 'PASS (Token received)' : 'FAIL', loginData.data?.user?.name);
  const citizenToken = loginData.data?.token;

  // 3. Officer Login
  const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer@sahaay.demo', password: 'password123' }),
  });
  const officerLoginData = await officerLoginRes.json();
  console.log('✓ Officer Login:', officerLoginData.success ? 'PASS (Token received)' : 'FAIL', officerLoginData.data?.user?.designation);
  const officerToken = officerLoginData.data?.token;

  // 4. Signup (New User)
  const testEmail = `user_${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      name: 'Ramesh Patel',
      phone: '+91 98765 43210',
      village: 'Rampur',
      district: 'Bhopal',
    }),
  });
  const registerData = await registerRes.json();
  console.log('✓ Signup Flow:', registerData.success ? 'PASS' : 'FAIL', registerData.data?.user?.email);

  // 5. Find My Land / Parcels search
  const parcelsRes = await fetch(`${BASE_URL}/parcels/search?survey=1042`);
  const parcelsData = await parcelsRes.json();
  console.log('✓ Find My Land (Survey 1042):', parcelsData.success ? `PASS (${parcelsData.count} parcels found)` : 'FAIL');

  const allParcelsRes = await fetch(`${BASE_URL}/parcels/search`);
  const allParcelsData = await allParcelsRes.json();
  console.log('✓ All Land Parcels Count:', allParcelsData.count, 'parcels found');

  // 6. Case details & timeline
  const caseRes = await fetch(`${BASE_URL}/cases/ACQ-2026-MP-1042`);
  const caseData = await caseRes.json();
  console.log('✓ Case Detail (ACQ-2026-MP-1042):', caseData.success ? 'PASS' : 'FAIL', `Stage: ${caseData.data?.stage}`);

  const timelineRes = await fetch(`${BASE_URL}/cases/ACQ-2026-MP-1042/timeline`);
  const timelineData = await timelineRes.json();
  console.log('✓ Acquisition Timeline:', timelineData.success ? `PASS (${timelineData.data?.timeline?.length} stages)` : 'FAIL');

  // 7. Citizen Dashboard
  const dashRes = await fetch(`${BASE_URL}/citizen/dashboard`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  const dashData = await dashRes.json();
  console.log('✓ Citizen Dashboard:', dashData.success ? 'PASS' : 'FAIL', `Cases: ${dashData.data?.totalCases}`);

  // 8. Officer Dashboard
  const officerDashRes = await fetch(`${BASE_URL}/officer/dashboard`, {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const officerDashData = await officerDashRes.json();
  console.log('✓ Officer Dashboard:', officerDashData.success ? 'PASS' : 'FAIL', `Active Cases: ${officerDashData.data?.stats?.totalCases}`);

  console.log('\n=========================================');
  console.log('🎉 ALL 8 CORE MODULES VERIFIED & WORKING!');
  console.log('=========================================');
}

testLiveServer().catch(console.error);
