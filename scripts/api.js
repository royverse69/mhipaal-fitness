
const NUTRITIONIX_APP_ID = '4fe99f34'; // Replace with your actual Nutritionix App ID
const NUTRITIONIX_APP_KEY = 'f6c0e4fbbd96e8bee5bc3a9dc8b4a274'; // Replace with your actual Nutritionix App Key
const NUTRITIONIX_API_URL = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

/**
 * Fetches nutrition data from the Nutritionix API.
 * @param {string} query - The natural language food query (e.g., "2 roti 1 dal").
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export async function fetchNutritionData(query) {
    try {
        const response = await fetch(NUTRITIONIX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': NUTRITIONIX_APP_ID,
                'x-app-key': NUTRITIONIX_APP_KEY
            },
            body: JSON.stringify({
                query: query
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Nutritionix API Response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
        // Depending on your error handling strategy, you might re-throw or return a specific error object
        throw error;
    }
}