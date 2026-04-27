from sqlmodel import SQLModel, create_engine, Session
# Import the models so SQLModel registers them before create_all is called
from backend.schemas.db_models import DictionaryContext, PromptHistory

sqlite_file_name = "refinavoz.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# Garante que a tabela é criada no momento do import (vital para pytest)
create_db_and_tables()
