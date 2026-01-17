// Quick test script to verify bulk upload endpoint
const testBulkUpload = async () => {
    const token = 'YOUR_TOKEN_HERE'; // Replace with actual token from localStorage

    const testProduct = {
        title: "Test Product",
        category: "Dress",
        description: "Test description",
        price_cents: 5999,
        image_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 red pixel
        occasions: ["Formal"],
        sizes: ["M", "L"],
    };

    try {
        const response = await fetch('http://localhost:3000/api/products/bulk-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ products: [testProduct] }),
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', result);

        if (!response.ok) {
            console.error('Error:', result);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
};

// To use: Copy your token from localStorage and run testBulkUpload()
console.log('To test bulk upload:');
console.log('1. Get your token: localStorage.getItem("access_token")');
console.log('2. Replace YOUR_TOKEN_HERE in the script');
console.log('3. Run: testBulkUpload()');
