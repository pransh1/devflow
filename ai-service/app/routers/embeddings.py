from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import get_settings
from ..models.schemas import EmbeddingRequest, EmbeddingResponse, SearchRequest, SearchResponse, SearchResult
from ..services.embedding_service import store_embedding, search_similar

router = APIRouter(prefix="/embeddings", tags=["embeddings"])
settings = get_settings()

def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != settings.node_api_internal_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")

@router.post("/", response_model=EmbeddingResponse)
async def create_embedding(
    request: EmbeddingRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_secret),
):
    """Called by Node API when issues/comments/messages are created"""
    success = store_embedding(db, request)
    return EmbeddingResponse(
        resource_id=request.resource_id,
        resource_type=request.resource_type,
        success=success,
        message="Embedding stored" if success else "Failed to store embedding",
    )

@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_secret),
):
    """Semantic search across workspace content"""
    results = search_similar(
        db=db,
        query=request.query,
        workspace_id=request.workspace_id,
        resource_types=request.resource_types,
        limit=request.limit,
    )
    return SearchResponse(
        results=[SearchResult(**r) for r in results],
        query=request.query,
    )