from pydantic import BaseModel

# Weather data model
class Weather(BaseModel):
    city: str
    temperature: float
    condition: str
    humidity: int
    wind_speed: float