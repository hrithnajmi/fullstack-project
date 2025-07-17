import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from the environment variables
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in the .env file")

# Function to initialize and return the database connection
def get_database():
    try:
        # Create a MongoDB client
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)

        # Connect to a specific database
        db = client["weather_database"]        
        print("Successfully connected to MongoDB")
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

# Export the get_database function for use in other files
__all__ = ["get_database"]
