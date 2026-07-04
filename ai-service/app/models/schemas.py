from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class EmbeddingRequest(BaseModel):
  text: str
  resource_type: str   # 'issue', 'comment', 'message', 'document'
  resource_id: str
  workspace_id: str

class EmbeddingResponse(BaseModel):
  resource_id: str
  resource_type: str
  success: bool
  message: str = ""

class SearchRequest(BaseModel):
  query: str
  workspace_id: str
  resource_types: Optional[List[str]] = None  # filter by type
  limit: int = 10

class SearchResult(BaseModel):
  resource_id: str
  resource_type: str
  content: str
  similarity: float
  metadata: dict = {}

class SearchResponse(BaseModel):
  results: List[SearchResult]
  query: str

class ChatMessage(BaseModel):
  role: str   # 'user' or 'assistant'
  content: str

class ChatRequest(BaseModel):
  messages: List[ChatMessage]
  workspace_id: str
  context_type: str = "general"  # 'general', 'issue', 'document'
  context_id: Optional[str] = None
  stream: bool = False

class ChatResponse(BaseModel):
  message: str
  sources: List[SearchResult] = []
  tokens_used: int = 0

class SummarizeRequest(BaseModel):
  resource_type: str   # 'issue', 'channel'
  resource_id: str
  workspace_id: str

class SummarizeResponse(BaseModel):
  summary: str
  resource_type: str
  resource_id: str