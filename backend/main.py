from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

from backend.api.router import router as api_router
from backend.core.logger import logger

# Garante carregamento do .env nativo da raiz do app
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from contextlib import asynccontextmanager
from backend.core.database import create_db_and_tables
from backend.services.dictionary import init_db_dictionary

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    init_db_dictionary()
    yield

app = FastAPI(title="RefinaVoz SOTA Backend", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "https://tauri.localhost", "http://tauri.localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    logger.info("Iniciando RefinaVoz Backend SOTA (State of the Art)...")
    uvicorn.run(app, host="127.0.0.1", port=14201, log_level="warning") # Desliga log raiz do Uvicorn para manter rastreabilidade limpa no nosso logger
