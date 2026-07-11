import httpx
from anthropic import Anthropic
from openai import OpenAI
from ..core.config import get_settings
from ..models.schemas import ChatMessage

settings = get_settings()
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2"

# For production
# # Use Anthropic if key is set, otherwise OpenAI
# anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
# openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

# SYSTEM_PROMPT = """You are DevFlow AI, an intelligent assistant built into DevFlow — 
# a developer team productivity platform. You help teams with:
# - Understanding and summarizing issues and tasks
# - Answering questions about the team's projects
# - Suggesting solutions and next steps
# - Analyzing patterns in the team's work

# You have access to the team's issues, comments, and documents through semantic search.
# Be concise, technical, and helpful. Always cite the specific issues or documents you reference."""

# def chat_with_context(
#     messages: list[ChatMessage],
#     context: list[dict],
#     stream: bool = False
# ) -> str:
#     """Send messages to LLM with retrieved context injected"""

#     # Build context string from RAG results
#     context_str = ""
#     if context:
#         context_str = "\n\nRelevant context from your workspace:\n"
#         for item in context[:5]:  # top 5 most relevant
#             context_str += f"\n[{item['resource_type'].upper()}] {item['content']}\n"

#     # Build message list
#     formatted_messages = [
#         {
#             "role": msg.role,
#             "content": msg.content + (context_str if i == len(messages) - 1 else "")
#         }
#         for i, msg in enumerate(messages)
#     ]

#     if anthropic_client:
#         response = anthropic_client.messages.create(
#             model="claude-3-5-haiku-20241022",
#             max_tokens=2048,
#             system=SYSTEM_PROMPT,
#             messages=formatted_messages,
#         )
#         return response.content[0].text

#     elif openai_client:
#         response = openai_client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[{"role": "system", "content": SYSTEM_PROMPT}] + formatted_messages,
#             max_tokens=2048,
#         )
#         return response.choices[0].message.content

#     else:
#         raise ValueError("No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY")

# def summarize_content(content: str, content_type: str) -> str:
#     """Summarize an issue, thread, or document"""
#     prompt = f"""Summarize this {content_type} in 2-3 sentences. 
# Be specific about the problem, current status, and any decisions made.

# {content_type.upper()}:
# {content}"""

#     if anthropic_client:
#         response = anthropic_client.messages.create(
#             model="claude-3-5-haiku-20241022",
#             max_tokens=512,
#             messages=[{"role": "user", "content": prompt}],
#         )
#         return response.content[0].text

#     elif openai_client:
#         response = openai_client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[{"role": "user", "content": prompt}],
#             max_tokens=512,
#         )
#         return response.choices[0].message.content

#     raise ValueError("No AI provider configured")

# for local
SYSTEM_PROMPT = """You are DevFlow AI, an intelligent assistant built into DevFlow — 
a developer team productivity platform. You help teams with:
- Understanding and summarizing issues and tasks
- Answering questions about the team's projects
- Suggesting solutions and next steps
- Analyzing patterns in the team's work

You have access to the team's issues, comments, and documents through semantic search.
Be concise, technical, and helpful. Always cite the specific issues or documents you reference."""

def chat_with_context(
    messages: list[ChatMessage],
    context: list[dict],
    stream: bool = False
) -> str:
    """Send messages to local Ollama LLM with retrieved context injected"""

    # Build context string from RAG results
    context_str = ""
    if context:
        context_str = "\n\nRelevant context from your workspace:\n"
        for item in context[:5]:
            context_str += f"\n[{item['resource_type'].upper()}] {item['content']}\n"

    # Build message list for Ollama
    ollama_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for i, msg in enumerate(messages):
        content = msg.content
        # Inject context into the last user message
        if i == len(messages) - 1 and msg.role == "user" and context_str:
            content = content + context_str
        ollama_messages.append({"role": msg.role, "content": content})

    # Call local Ollama
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": ollama_messages,
                "stream": False,
            }
        )
        response.raise_for_status()
        return response.json()["message"]["content"]

def summarize_content(content: str, content_type: str) -> str:
    """Summarize using local Ollama"""
    prompt = f"""Summarize this {content_type} in 2-3 sentences. 
Be specific about the problem, current status, and any decisions made.

{content_type.upper()}:
{content}"""

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            }
        )
        response.raise_for_status()
        return response.json()["message"]["content"]