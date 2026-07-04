from sqlalchemy.orm import Session
from .embedding_service import search_similar
from .llm_service import chat_with_context, summarize_content
from ..models.schemas import ChatRequest, ChatResponse, SummarizeRequest

def chat_with_rag(db: Session, request: ChatRequest) -> ChatResponse:
    """RAG pipeline — retrieve relevant context then generate response"""

    # Get the latest user message for retrieval
    user_query = next(
        (m.content for m in reversed(request.messages) if m.role == "user"),
        ""
    )

    # Retrieve relevant context from the workspace
    context = search_similar(
        db=db,
        query=user_query,
        workspace_id=request.workspace_id,
        resource_types=None,  # search all types
        limit=5,
    )

    # Generate response with context
    response_text = chat_with_context(
        messages=request.messages,
        context=context,
    )

    from ..models.schemas import SearchResult
    sources = [SearchResult(**item) for item in context]

    return ChatResponse(
        message=response_text,
        sources=sources,
        tokens_used=0,  # we'll add token counting later
    )

def summarize_issue(db: Session, request: SummarizeRequest) -> str:
    """Fetch issue data and summarize it"""
    import httpx
    from ..core.config import get_settings
    settings = get_settings()

    # Fetch issue content from Node API
    with httpx.Client() as client:
        response = client.get(
            f"{settings.node_api_url}/api/v1/internal/issues/{request.resource_id}",
            headers={"x-internal-secret": settings.node_api_internal_secret},
        )

    if response.status_code != 200:
        raise ValueError(f"Issue not found: {request.resource_id}")

    issue = response.json()["data"]
    content = f"Title: {issue['title']}\n\nDescription: {issue.get('description', 'No description')}"

    if issue.get("comments"):
        content += "\n\nComments:\n"
        for comment in issue["comments"]:
            content += f"- {comment['author']['username']}: {comment['content']}\n"

    return summarize_content(content, "issue")