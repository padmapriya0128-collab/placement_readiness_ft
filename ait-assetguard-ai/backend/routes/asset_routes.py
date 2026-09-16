from fastapi import APIRouter, HTTPException
from database.connection import assets_collection
from models.asset import AssetCreate
from datetime import datetime

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


@router.post("/")
def create_asset(asset: AssetCreate):

    existing_asset = assets_collection.find_one({
        "asset_id": asset.asset_id
    })

    if existing_asset:
        raise HTTPException(
            status_code=400,
            detail="Asset ID already exists"
        )

    asset_data = asset.model_dump()

    # Convert dates into strings for MongoDB
    for key, value in asset_data.items():
        if hasattr(value, "isoformat"):
            asset_data[key] = value.isoformat()

    asset_data["created_at"] = datetime.utcnow()

    result = assets_collection.insert_one(asset_data)

    return {
        "message": "Asset added successfully",
        "asset_id": asset.asset_id,
        "database_id": str(result.inserted_id)
    }


@router.get("/")
def get_assets():

    assets = list(
        assets_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(assets),
        "assets": assets
    }