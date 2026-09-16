from fastapi import FastAPI
from routes.asset_routes import router as asset_router

app = FastAPI(
    title="AIT AssetGuard AI",
    description="AI-powered college electronics asset intelligence system",
    version="1.0.0"
)


app.include_router(asset_router)


@app.get("/")
def home():
    return {
        "message": "AIT AssetGuard AI Backend is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }