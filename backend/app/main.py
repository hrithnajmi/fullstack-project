from fastapi import FastAPI
from app.routes import router

app = FastAPI()

# Include routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "FastAPI backend is running!"}