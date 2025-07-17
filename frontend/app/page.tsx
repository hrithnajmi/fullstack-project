"use client";
import { useState, useEffect } from "react";
import { weatherAPI } from './api/weather';

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
  visibility?: string;
}

export default function WeatherDashboard() {
  const [city, setCity] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWeatherData, setSavedWeatherData] = useState<WeatherData[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Fetch saved weather data from backend when component mounts
  useEffect(() => {
    fetchSavedWeatherData();
    // Automatically detect location when component mounts
    getCurrentLocationWeather();
  }, []);

  // Function to get current location and fetch weather
  const getCurrentLocationWeather = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser");
      return;
    }

    setIsLocationLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await fetchWeatherByCoordinates(latitude, longitude);
        } catch (err) {
          console.error("Error fetching weather by coordinates:", err);
          setError("Failed to get weather for your location");
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocationLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred while getting location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Function to fetch weather data by coordinates
  const fetchWeatherByCoordinates = async (latitude: number, longitude: number) => {
    try {
      const weatherData = await weatherAPI.getWeatherByLocation(latitude, longitude);
      setWeather(weatherData);
      setCity(weatherData.city); // Update the city input field
      
      // Refresh the saved weather data after successful location search
      await fetchSavedWeatherData();
      
    } catch (err: any) {
      console.error("Error fetching weather by coordinates:", err);
      setError(err.message || "Failed to get weather for your location");
    }
  };

  // Function to fetch saved weather data from backend using weatherAPI
  const fetchSavedWeatherData = async () => {
    try {
      const data = await weatherAPI.getWeather();
      // Filter out any duplicates based on city name (just in case)
      const uniqueCities = data.reduce((acc: WeatherData[], current: WeatherData) => {
        const existingCity = acc.find(item => item.city === current.city);
        if (!existingCity) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Take only the first 4 cities
      setSavedWeatherData(uniqueCities.slice(0, 4));
    } catch (error) {
      console.error("Error fetching saved weather data:", error);
    }
  };

  // Function to delete weather data from backend using weatherAPI
  const deleteWeatherFromBackend = async (cityName: string) => {
    try {
      const result = await weatherAPI.deleteWeather(cityName);
      console.log("Weather data deleted from backend successfully", result);
      fetchSavedWeatherData();
    } catch (error) {
      console.error("Error deleting weather data from backend:", error);
    }
  };

  // Update the handleSearch function
  const handleSearch = async () => {
    if (!city) {
      setError("Please enter a city name.");
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setWeather(null);

    try {
      const weatherData = await weatherAPI.getWeatherByCity(city);
      setWeather(weatherData);
      
      // Refresh the saved weather data after successful search
      await fetchSavedWeatherData();
      
    } catch (err: any) {
      console.error("Error fetching weather:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get background based on weather condition
  const getWeatherBackground = (condition: string) => {
    const weatherCondition = condition.toLowerCase();
    
    if (isDarkMode) {
      // Dark mode backgrounds
      switch (weatherCondition) {
        case 'clear':
          return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900';
        case 'clouds':
          return 'bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800';
        case 'rain':
        case 'drizzle':
          return 'bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900';
        case 'thunderstorm':
          return 'bg-gradient-to-br from-gray-900 via-purple-900 to-black';
        case 'snow':
          return 'bg-gradient-to-br from-slate-800 via-blue-900 to-gray-800';
        case 'mist':
        case 'smoke':
        case 'haze':
        case 'fog':
          return 'bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900';
        default:
          return 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900';
      }
    } else {
      // Light mode backgrounds
      switch (weatherCondition) {
        case 'clear':
          return 'bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200';
        case 'clouds':
          return 'bg-gradient-to-br from-gray-300 via-gray-200 to-slate-300';
        case 'rain':
        case 'drizzle':
          return 'bg-gradient-to-br from-blue-300 via-slate-300 to-gray-400';
        case 'thunderstorm':
          return 'bg-gradient-to-br from-gray-400 via-purple-300 to-gray-500';
        case 'snow':
          return 'bg-gradient-to-br from-blue-100 via-white to-gray-200';
        case 'mist':
        case 'smoke':
        case 'haze':
        case 'fog':
          return 'bg-gradient-to-br from-gray-200 via-slate-200 to-gray-300';
        default:
          return 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300';
      }
    }
  };

  // Function to get weather-appropriate text color
  const getWeatherTextColor = (condition: string) => {
    const weatherCondition = condition.toLowerCase();
    
    if (isDarkMode) {
      return 'text-white';
    } else {
      // For light backgrounds, use darker text for better contrast
      switch (weatherCondition) {
        case 'clear':
          return 'text-gray-800';
        case 'snow':
          return 'text-gray-700';
        default:
          return 'text-gray-800';
      }
    }
  };

  // Function to get weather icons for different conditions
  const getWeatherIcon = (condition: string) => {
    const weatherCondition = condition.toLowerCase();
    
    switch (weatherCondition) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'drizzle':
        return '🌦️';
      case 'thunderstorm':
        return '⛈️';
      case 'snow':
        return '❄️';
      case 'mist':
      case 'fog':
        return '🌫️';
      default:
        return '🌤️';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      weather ? getWeatherBackground(weather.condition) : (
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300'
      )
    } p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
                isDarkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } shadow-lg hover:shadow-xl transform hover:scale-105`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Weather-based title with emoji */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">
              Weather Dashboard
            </h1>
            {weather && (
              <span className="text-6xl animate-bounce">
                {getWeatherIcon(weather.condition)}
              </span>
            )}
          </div>
          
          <p className={`text-lg transition-colors duration-300 ${
            weather ? getWeatherTextColor(weather.condition) : (
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            )
          }`}>
            Get real-time weather information for any city
          </p>
        </div>
        


        {/* Search Section */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="w-full max-w-md relative flex gap-4">
            <input
              type="text"
              className={`flex-1 backdrop-blur-sm border rounded-2xl px-6 py-4 pr-16 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-800/80 border-gray-700 text-white' 
                  : 'bg-white/80 border-gray-200 text-gray-700'
              }`}
              placeholder="Enter city name (e.g., London, Tokyo)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              disabled={isLoading}
            />
            
            {/* Search Button - Now clickable magnifying glass */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute inset-y-0 right-20 flex items-center pr-6 cursor-pointer disabled:cursor-not-allowed"
              title="Search Weather"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400 hover:text-teal-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
            
            {/* Location Button - Now inline with input */}
            <button
              onClick={getCurrentLocationWeather}
              disabled={isLocationLoading}
              className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-semibold p-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
              title="Use My Location"
            >
              {isLocationLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || isLocationLoading) && (
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 backdrop-blur-sm px-6 py-3 rounded-full font-medium shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800/80 text-blue-400' 
                : 'bg-white/80 text-blue-600'
            }`}>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isLocationLoading ? "Getting your location..." : `Loading weather data for ${city}...`}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 border px-6 py-3 rounded-full font-medium shadow-lg ${
              isDarkMode 
                ? 'bg-red-900/50 border-red-800 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Current Weather Display */}
        {weather && !isLoading && !error && (
          <div className="mb-16">
            
            {/* Weather summary banner */}
            <div className={`text-center mb-8 p-6 rounded-3xl backdrop-blur-sm border shadow-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-black/20 border-white/20 text-white' 
                : 'bg-white/20 border-white/40 text-gray-800'
            }`}>
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="text-4xl">{getWeatherIcon(weather.condition)}</span>
                <h3 className="text-2xl font-bold capitalize">{weather.description}</h3>
              </div>
              <p className="text-lg opacity-90">
                It's currently {weather.temperature} and feels like {weather.feelsLike || weather.temperature}
              </p>
            </div>

            {/* Weather Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* City Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">City</h3>
                  <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{weather.city}</p>
              </div>

              {/* Temperature Card */}
              <div className="bg-gradient-to-br from-teal-400 to-green-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Temperature</h3>
                  <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-4xl font-bold">{weather.temperature}</p>
                  {weather.feelsLike && (
                    <p className="text-sm opacity-80 mt-2">Feels like {weather.feelsLike}</p>
                  )}
                </div>
              </div>

              {/* Condition Card */}
              <div className="bg-gradient-to-br from-teal-400 to-green-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Condition</h3>
                  {weather.iconCode && (
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
                      alt={weather.description}
                      className="w-16 h-16"
                    />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">{weather.description}</p>
                  <p className="text-lg opacity-80">{weather.condition}</p>
                </div>
              </div>

              {/* Humidity Card */}
              <div className="bg-gradient-to-br from-teal-400 to-green-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Humidity</h3>
                  <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a4 4 0 004-4V5a2 2 0 00-2-2h-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{weather.humidity}</p>
              </div>

              {/* Wind Speed Card */}
              <div className="bg-gradient-to-br from-teal-400 to-green-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Wind Speed</h3>
                  <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0v2a1 1 0 01-1 1H8a1 1 0 01-1-1V4m0 0H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V5a1 1 0 00-1-1h-4z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{weather.windSpeed}</p>
              </div>

              {/* Visibility Card */}
              <div className="bg-gradient-to-br from-teal-400 to-green-500 text-white rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl h-[200px] flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Visibility</h3>
                  <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold">{weather.visibility || 'N/A'}</p>
                  <p className="text-sm opacity-80 mt-2">
                    {weather.visibility ? (
                      parseFloat(weather.visibility) >= 10 ? 'Excellent' :
                      parseFloat(weather.visibility) >= 5 ? 'Good' :
                      parseFloat(weather.visibility) >= 1 ? 'Fair' : 'Poor'
                    ) : 'No data'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Cities Section */}
        {savedWeatherData.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${
              weather ? getWeatherTextColor(weather.condition) : (
                isDarkMode ? 'text-white' : 'text-gray-800'
              )
            }`}>
              Recent Cities ({savedWeatherData.length}/4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedWeatherData.map((savedWeather, index) => (
                <div key={`${savedWeather.city}-${index}`} className={`bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative group border border-white/20 cursor-pointer`}>
                  <button
                    onClick={() => deleteWeatherFromBackend(savedWeather.city)}
                    className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                    title="Delete this weather data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {savedWeather.city}
                      </h3>
                      <span className="text-xl">{getWeatherIcon(savedWeather.condition)}</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{savedWeather.temperature}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-white/90">
                    <div className="flex justify-between">
                      <span className="font-medium">Condition:</span>
                      <span className="capitalize">{savedWeather.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Humidity:</span>
                      <span>{savedWeather.humidity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Wind:</span>
                      <span>{savedWeather.windSpeed}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm capitalize text-center text-white/80">
                      {savedWeather.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}