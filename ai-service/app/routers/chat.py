from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import get_settings
from ..models.schemas import ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse
from ..services.rag_service import chat_with_rag, summarize_issue

router = APIRouter(prefix="/chat", tags=["chat"])
settings = get_settings()

def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != settings.node_api_internal_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_secret),
):
    """RAG-powered chat endpoint"""
    try:
        return chat_with_rag(db, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_internal_secret),
):
    """Summarize an issue, thread, or document"""
    try:
        summary = summarize_issue(db, request)
        return SummarizeResponse(
            summary=summary,
            resource_type=request.resource_type,
            resource_id=request.resource_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")