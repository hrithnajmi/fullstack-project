const API_BASE_URL = 'http://localhost:8000';

export const weatherAPI = {
  // Get weather by city name
  async getWeatherByCity(city) {
    try {
      const response = await fetch(`${API_BASE_URL}/weather/city`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw error;
    }
  },

  // Get weather by coordinates
  async getWeatherByLocation(latitude, longitude) {
    try {
      const response = await fetch(`${API_BASE_URL}/weather/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weather by location:', error);
      throw error;
    }
  },

  // Get all saved weather data
  async getWeather() {
    try {
      const response = await fetch(`${API_BASE_URL}/weather`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  },

  // Delete weather data
  async deleteWeather(city) {
    try {
      const response = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(city)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting weather data:', error);
      throw error;
    }
  },
};