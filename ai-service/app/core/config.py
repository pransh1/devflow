from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
  # server
  port: int = 8000
  environment: str = "development"
  
  # database
  database_url: str
  
  # AI providers
  openai_api_key: str = ""
  anthropic_api_key: str = ""
  
  # Internal
  node_api_url: str = "http://localhost:5454"
  node_api_internal_secret: str

  # Embedding config
  embedding_model: str = "text-embedding-3-small"
  embedding_dimensions: int = 1536
  
  class Config:
    env_file = ".env"
    extra = "ignore"
    
@lru_cache()
def get_settings() -> Settings:
  return Settings()
    