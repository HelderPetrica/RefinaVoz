from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class DictionaryContext(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scope: str = Field(index=True)
    wrong_term: str
    right_term: str

class PromptHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    trace_id: str = Field(index=True)
    mode: str
    raw_text: str
    final_text: str
    latency_ms: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
