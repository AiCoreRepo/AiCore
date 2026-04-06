const http = require('http');

http.get('http://localhost:3000/products/approved', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
        const responseData = JSON.parse(data);
        console.log(JSON.stringify(responseData.availableFilters, null, 2));
    } catch(err) {
        console.error("Error parsing JSON:", err);
    }
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
