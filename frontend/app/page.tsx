"use client";
import { useState } from "react";

// Define an interface for your weather data structure
interface WeatherData {
  city: string;
  temperature: string;
  description: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  iconCode: string;
  feelsLike?: string; 
}

export default function WeatherDashboard() {
  const [city, setCity] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading indicator
  const [error, setError] = useState<string | null>(null); // State for error messages


  const API_KEY = "6466cdbb4eddfe2d942ce8077da87f3b";
  

  const handleSearch = async () => {
    if (!city) {
      setError("Please enter a city name.");
      setWeather(null); // Clear previous weather data
      console.log("API key",API_KEY)
      return;
    }
    console.log("API key",API_KEY)

    setIsLoading(true); // Start loading
    setError(null);     // Clear previous errors
    setWeather(null);   // Clear previous weather data

    try {
      // Construct the API URL for OpenWeatherMap
      // Using 'metric' units for Celsius, 'imperial' for Fahrenheit
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

      const response = await fetch(url);

      // Check if the response was successful
      if (!response.ok) {
        // Handle specific error codes from OpenWeatherMap API
        if (response.status === 404) {
          throw new Error("City not found. Please check the spelling.");
        } else if (response.status === 401) {
          throw new Error("Invalid API key. Please check your OpenWeatherMap API key.");
        } else {
          throw new Error(`Failed to fetch weather data: ${response.statusText}`);
        }
      }

      const data = await response.json();

      // Map the API response data to your WeatherData interface
      setWeather({
        city: data.name,
        temperature: `${Math.round(data.main.temp)}°C`, // Round temperature for cleaner display
        description: data.weather[0].description,
        condition: data.weather[0].main,
        humidity: `${data.main.humidity}%`,
        windSpeed: `${Math.round(data.wind.speed * 3.6)} km/h`, // Convert m/s to km/h
        iconCode: data.weather[0].icon, // Icon code for weather condition
        feelsLike: data.main.feels_like ? `${Math.round(data.main.feels_like)}°C` : undefined, // Optional 'feels like' temperature
      });

    } catch (err: any) {
      // Catch network errors or errors thrown above
      console.error("Error fetching weather:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false); // End loading, regardless of success or failure
    }
  };

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Weather Dashboard</h1>
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter city (e.g., London, Kuala Lumpur)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          disabled={isLoading} // Disable input while loading
        />
        <button
          className="w-full bg-blue-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSearch}
          type="button"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? "Fetching Weather..." : "Search"}
        </button>
      </div>

      {/* Conditional Rendering for Loading, Error, or Weather Data */}
      {isLoading && (
        <p className="mt-4 text-lg text-gray-600">Loading weather data for {city}...</p>
      )}

      {error && (
        <p className="mt-4 text-lg text-red-600 font-semibold">{error}</p>
      )}

      {weather && !isLoading && !error && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          {/* City Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">City</h2>
            <p className="text-lg text-gray-600">{weather.city}</p>
          </div>

          {/* Temperature Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">Temperature</h2>
            <p className="text-3xl font-bold text-gray-800">{weather.temperature}</p>
          </div>

          {/* Condition/Icon Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">Condition</h2>
            {weather.iconCode && (
              <img
                src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
                alt={weather.description}
                className="w-20 h-20 mx-auto"
              />
            )}
            <p className="text-lg text-gray-600 capitalize">{weather.description}</p>
          </div>

          {/* Humidity Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">Humidity</h2>
            <p className="text-lg text-gray-600">{weather.humidity}</p>
          </div>

          {/* Wind Speed Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">Wind Speed</h2>
            <p className="text-lg text-gray-600">{weather.windSpeed}</p>
          </div>

          {/* Feels Like Card */}
          <div className="bg-white shadow-md rounded-lg p-4 text-center flex flex-col justify-center items-center transform transition-transform duration-300 hover:scale-105 h-[150px]">
            <h2 className="text-xl font-semibold text-[#2e7fe5]">Feels Like</h2>
            <p className="text-lg text-gray-600">{weather.feelsLike}</p>
          </div>
        </div>
      )}

      {!weather && !isLoading && !error && (
        <p className="mt-4 text-lg text-gray-600">Enter a city to get its current weather information.</p>
      )}
    </div>
  );
}