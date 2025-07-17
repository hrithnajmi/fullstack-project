from fastapi import APIRouter, HTTPException
from app.database import db
from app.models import Weather

router = APIRouter()

# Get all weather data
@router.get("/weather")
async def get_weather():
    weather_data = await db.weather.find().to_list(100)
    return weather_data

# Add new weather data
@router.post("/weather")
async def add_weather(weather: Weather):
    result = await db.weather.insert_one(weather.dict())
    return {"id": str(result.inserted_id)}

# Delete weather data by city
@router.delete("/weather/{city}")
async def delete_weather(city: str):
    result = await db.weather.delete_one({"city": city})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="City not found")
    return {"message": "Weather data deleted"}