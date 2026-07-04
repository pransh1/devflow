from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pgvector.sqlalchemy import Vector
from .config import get_settings

settings = get_settings()

engine = create_engine(
  settings.database_url,
  pool_pre_ping = True, # verify connection before use
  pool_size = 5,
  max_overflow = 10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
  pass

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()
    
  
def init_db():
  """Enable pgvector extension and create vector tables"""
  with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()
  print("✅ pgvector extension enabled") 