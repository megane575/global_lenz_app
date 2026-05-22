from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter

from app.api import country_summaries
from app.api import comparison_summaries
from app.api import favorites
from app.api import topics
from app.api import search

router = APIRouter()

router.include_router(
    country_summaries.router,
    prefix="/api/country-summaries",
    tags=["CountrySummaries"]
)

router.include_router(
    comparison_summaries.router,
    prefix="/api/comparison-summaries",
    tags=["ComparisonSummaries"]
)

router.include_router(
    favorites.router,
    prefix="/api/favorites",
    tags=["favorites"]
)

router.include_router(
    topics.router,
    prefix="/api/topics",
    tags=["Topics"]
)

router.include_router(
    search.router,
    prefix="/api/search",
    tags=["Search"]
)