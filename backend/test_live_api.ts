import axios from 'axios';

async function testApi() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testadmin@rcsfabrics.com',
      password: 'testadmin123'
    });
    const token = loginRes.data.data.token;
    console.log('Got token:', token);

    console.log('Fetching categories...');
    const catRes = await axios.get('http://localhost:5000/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Categories success:', catRes.data);
  } catch (error: any) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
  }
}

testApi();
