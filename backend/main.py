from fastapi import FastAPI
from backend.db import init_db
from backend.routes import escrow_routes, admin_routes, product_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Algo-E-Cart Backend (TestNet Live)", version="3.3")

# ✅ Initialize DB
@app.on_event("startup")
def on_startup():
    init_db()

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routers
app.include_router(escrow_routes.router)
app.include_router(admin_routes.router)
app.include_router(product_routes.router) # This is the correct, standard way

@app.get("/")
def root():
    return {"message": "Algo-E-Cart Backend running successfully 🚀"}