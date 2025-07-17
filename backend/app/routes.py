from fastapi import APIRouter, HTTPException
from app.database import get_database
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Get API key from environment
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY:
    raise ValueError("OPENWEATHER_API_KEY is not set in the .env file")

# Pydantic models for request/response
class WeatherData(BaseModel):
    city: str
    temperature: str
    description: str
    condition: str
    humidity: str
    windSpeed: str
    iconCode: str
    feelsLike: Optional[str] = None
    visibility: Optional[str] = None

class WeatherRequest(BaseModel):
    city: str

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

# Test endpoint
@router.get("/test")
async def test_endpoint():
    return {"message": "Routes are working"}

# Get weather by city name
@router.post("/weather/city")
async def get_weather_by_city(request: WeatherRequest):
    try:
        print(f"Fetching weather for city: {request.city}")
        
        # Make API call to OpenWeatherMap
        async with httpx.AsyncClient() as client:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={request.city}&appid={OPENWEATHER_API_KEY}&units=metric"
            response = await client.get(url)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="City not found. Please check the spelling.")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid API key. Please check your OpenWeatherMap API key.")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch weather data: {response.text}")
            
            data = response.json()
            print(f"OpenWeatherMap API response: {data}")
            
            # Process the weather data
            weather_data = WeatherData(
                city=data["name"],
                temperature=f"{round(data['main']['temp'])}°C",
                description=data["weather"][0]["description"],
                condition=data["weather"][0]["main"],
                humidity=f"{data['main']['humidity']}%",
                windSpeed=f"{round(data['wind']['speed'] * 3.6)} km/h",
                iconCode=data["weather"][0]["icon"],
                feelsLike=f"{round(data['main']['feels_like'])}°C" if data['main'].get('feels_like') else None,
                visibility=f"{data['visibility'] / 1000:.1f} km" if data.get('visibility') else None
            )
            
            print(f"Processed weather data: {weather_data}")
            
            # Save to database
            db = get_database()
            if db is not None:
                try:
                    # Convert to dict for MongoDB
                    weather_dict = weather_data.dict()
                    print(f"Saving to database: {weather_dict}")
                    
                    # Remove existing entry for this city if it exists
                    delete_result = await db.weather.delete_one({"city": weather_data.city})
                    print(f"Deleted existing entries: {delete_result.deleted_count}")
                    
                    # Insert the new/updated data
                    insert_result = await db.weather.insert_one(weather_dict)
                    print(f"Inserted new entry with ID: {insert_result.inserted_id}")
                    
                    # Keep only the last 4 entries
                    total_count = await db.weather.count_documents({})
                    print(f"Total entries in database: {total_count}")
                    
                    if total_count > 4:
                        # Get the oldest entries to delete
                        oldest_entries = await db.weather.find().sort("_id", 1).limit(total_count - 4).to_list(total_count - 4)
                        oldest_ids = [entry["_id"] for entry in oldest_entries]
                        delete_old_result = await db.weather.delete_many({"_id": {"$in": oldest_ids}})
                        print(f"Deleted {delete_old_result.deleted_count} old entries to maintain limit of 4")
                    
                    # Verify the data was saved
                    all_cities = await db.weather.find().to_list(10)
                    print(f"All cities in database: {[city['city'] for city in all_cities]}")
                        
                except Exception as db_error:
                    print(f"Database error: {db_error}")
                    raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
            else:
                print("Database connection is None!")
                raise HTTPException(status_code=500, detail="Database connection failed")
            
            return weather_data
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_weather_by_city: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Get weather by coordinates
@router.post("/weather/location")
async def get_weather_by_location(request: LocationRequest):
    try:
        print(f"Fetching weather for coordinates: {request.latitude}, {request.longitude}")
        
        # Make API call to OpenWeatherMap
        async with httpx.AsyncClient() as client:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={request.latitude}&lon={request.longitude}&appid={OPENWEATHER_API_KEY}&units=metric"
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch weather data: {response.text}")
            
            data = response.json()
            
            # Process the weather data
            weather_data = WeatherData(
                city=data["name"],
                temperature=f"{round(data['main']['temp'])}°C",
                description=data["weather"][0]["description"],
                condition=data["weather"][0]["main"],
                humidity=f"{data['main']['humidity']}%",
                windSpeed=f"{round(data['wind']['speed'] * 3.6)} km/h",
                iconCode=data["weather"][0]["icon"],
                feelsLike=f"{round(data['main']['feels_like'])}°C" if data['main'].get('feels_like') else None,
                visibility=f"{data['visibility'] / 1000:.1f} km" if data.get('visibility') else None
            )
            
            # Save to database with upsert to prevent duplicates
            db = get_database()
            if db is not None:
                try:
                    # Convert to dict for MongoDB
                    weather_dict = weather_data.dict()
                    
                    # Remove existing entry for this city if it exists
                    await db.weather.delete_one({"city": weather_data.city})
                    
                    # Insert the new/updated data
                    await db.weather.insert_one(weather_dict)
                    print(f"Updated weather data for {weather_data.city}")
                    
                    # Keep only the last 4 entries
                    total_count = await db.weather.count_documents({})
                    if total_count > 4:
                        # Get the oldest entries to delete
                        oldest_entries = await db.weather.find().sort("_id", 1).limit(total_count - 4).to_list(total_count - 4)
                        oldest_ids = [entry["_id"] for entry in oldest_entries]
                        await db.weather.delete_many({"_id": {"$in": oldest_ids}})
                        print(f"Deleted {len(oldest_ids)} old entries to maintain limit of 4")
                        
                except Exception as db_error:
                    print(f"Database error: {db_error}")
                    # Continue anyway, just log the error
            
            return weather_data
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_weather_by_location: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Get all weather data
@router.get("/weather")
async def get_weather():
    try:
        print("GET /weather endpoint called")
        db = get_database()
        print(f"Database object: {db}")
        
        if db is None:
            print("Database connection is None")
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        print("Attempting to fetch weather data...")
        # Sort by _id (which contains timestamp) in descending order and limit to 4
        weather_data = await db.weather.find().sort("_id", -1).limit(4).to_list(4)
        print(f"Fetched {len(weather_data)} weather records")
        
        # Remove MongoDB's _id field from each document
        for item in weather_data:
            if '_id' in item:
                del item['_id']
        
        return weather_data
    except Exception as e:
        print(f"Error in get_weather: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {str(e)}")

# Delete weather data for a specific city
@router.delete("/weather/{city_name}")
async def delete_weather(city_name: str):
    try:
        print(f"Deleting weather data for city: {city_name}")
        db = get_database()
        
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Delete the city from weather data
        result = await db.weather.delete_one({"city": city_name})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="City not found in weather data")
        
        print(f"Successfully deleted weather data for {city_name}")
        return {"message": f"Successfully deleted weather data for {city_name}"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_weather: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")