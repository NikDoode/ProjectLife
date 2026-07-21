from fastapi import FastAPI

from .api import router as items_router
from .database import Base, engine
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)

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