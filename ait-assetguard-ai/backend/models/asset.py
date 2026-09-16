from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class AssetCreate(BaseModel):
    asset_id: str = Field(..., min_length=3)
    equipment_name: str
    equipment_type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    department: str
    location: str
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    warranty_expiry: Optional[date] = None
    usage_level: str = "Medium"
    condition: str = "Good"
    status: str = "Working"


class AssetResponse(AssetCreate):
    id: str