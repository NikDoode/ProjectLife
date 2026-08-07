from fastapi import FastAPI

from .api import router as items_router
from .database import Base, SessionLocal, engine
from .relations_api import router as relations_router
from .workspaces_api import router as workspaces_router
from .crud import ensure_general_workspace
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    ensure_general_workspace(db)

app = FastAPI(
    title="Spatial Task Manager",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)
app.include_router(workspaces_router)
app.include_router(relations_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Spatial Task Manager API работает"
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok"
    }
