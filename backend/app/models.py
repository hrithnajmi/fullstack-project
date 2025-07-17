from pydantic import BaseModel
from typing import Optional

# Weather data model
class Weather(BaseModel):
    city: str
    temperature: str
    description: str
    condition: str
    humidity: str
    windSpeed: str
    iconCode: str
    feelsLike: Optional[str] = None
    visibility: Optional[str] = None 