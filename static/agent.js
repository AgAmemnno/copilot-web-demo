async function sendGetRequest() {
    try {
        const response = await fetch('/api/get');
        const data = await response.json();
        console.log('GET Response:', data);
    } catch (error) {
        console.error('Error with GET request:', error);
    }
}

// Function to send a POST request
async function sendPostRequest() {
    const payload = { key: 'value', example: 'data' };
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        console.log('POST Response:', data);
    } catch (error) {
        console.error('Error with POST request:', error);
    }
}

