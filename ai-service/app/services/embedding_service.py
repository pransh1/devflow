from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.config import get_settings
from ..models.schemas import EmbeddingRequest

settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)

def generate_embedding(text: str) -> list[float]:
    """Generate embedding vector for a piece of text"""
    response = client.embeddings.create(
        model=settings.embedding_model,
        input=text,
        dimensions=settings.embedding_dimensions,
    )
    return response.data[0].embedding

def store_embedding(db: Session, request: EmbeddingRequest) -> bool:
    """Store embedding in pgvector table"""
    try:
        embedding = generate_embedding(request.text)

        # Upsert — update if exists, insert if not
        db.execute(
            text("""
                INSERT INTO embeddings (resource_id, resource_type, workspace_id, content, embedding)
                VALUES (:resource_id, :resource_type, :workspace_id, :content, :embedding)
                ON CONFLICT (resource_id, resource_type)
                DO UPDATE SET
                    content = EXCLUDED.content,
                    embedding = EXCLUDED.embedding,
                    updated_at = NOW()
            """),
            {
                "resource_id": request.resource_id,
                "resource_type": request.resource_type,
                "workspace_id": request.workspace_id,
                "content": request.text,
                "embedding": str(embedding),
            }
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error storing embedding: {e}")
        return False

def search_similar(
    db: Session,
    query: str,
    workspace_id: str,
    resource_types: list[str] | None = None,
    limit: int = 10,
) -> list[dict]:
    """Find semantically similar content using cosine similarity"""
    query_embedding = generate_embedding(query)

    type_filter = ""
    params = {
        "workspace_id": workspace_id,
        "embedding": str(query_embedding),
        "limit": limit,
    }

    if resource_types:
        type_filter = "AND resource_type = ANY(:resource_types)"
        params["resource_types"] = resource_types

    results = db.execute(
        text(f"""
            SELECT
                resource_id,
                resource_type,
                content,
                1 - (embedding <=> :embedding::vector) AS similarity
            FROM embeddings
            WHERE workspace_id = :workspace_id
            {type_filter}
            ORDER BY embedding <=> :embedding::vector
            LIMIT :limit
        """),
        params
    ).fetchall()

    return [
        {
            "resource_id": row.resource_id,
            "resource_type": row.resource_type,
            "content": row.content,
            "similarity": float(row.similarity),
            "metadata": {},
        }
        for row in results
    ]