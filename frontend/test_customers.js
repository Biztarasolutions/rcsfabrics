const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('https://rcsfabrics-backend.onrender.com/api/admin/customers');
    console.log("SUCCESS", res.data);
  } catch (e) {
    console.log("ERROR", e.response ? e.response.status : e.message);
  }
}
test();
