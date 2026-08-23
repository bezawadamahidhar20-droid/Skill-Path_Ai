from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routes import auth_routes, student_routes, admin_routes
from app.database import get_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize DB pool
    await get_pool()
    print("[OK] Database connected successfully!")
    yield
    # Shutdown: close DB pool
    await close_pool()
    print("[CLOSED] Database connection closed.")


app = FastAPI(title="CampusIQ Backend", lifespan=lifespan)

# CORS (allow frontend / test html)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(student_routes.router, prefix="/api/student", tags=["Student"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
def root():
    return {"message": "CampusIQ Backend Running"}
