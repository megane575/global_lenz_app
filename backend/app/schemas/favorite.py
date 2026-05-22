from pydantic import BaseModel
from typing import Optional

class FavoriteCreate(BaseModel):

    country_summary_id: Optional[int] = None
    comparison_summary_id: Optional[int] = None
    subscription_id: Optional[int] = None