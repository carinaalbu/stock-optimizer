from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.optimizer.transportation import optimizare_retea_stocuri
from app.schemas import OptimizeRequest, OptimizeResponse, raw_result_to_response

app = FastAPI(title="Transportation Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_BRANCHES = ["Bucuresti", "Cluj", "Iasi", "Timisoara"]
DEFAULT_CURRENT_STOCK = {"Bucuresti": 120, "Cluj": 15, "Iasi": 50, "Timisoara": 10}
DEFAULT_MIN_STOCK = {"Bucuresti": 40, "Cluj": 30, "Iasi": 20, "Timisoara": 25}
DEFAULT_TARGET_STOCK = {"Bucuresti": 40, "Cluj": 45, "Iasi": 20, "Timisoara": 35}
DEFAULT_PRICE = 200.0
DEFAULT_TRANSPORT_COSTS = {
    "Bucuresti": {"Cluj": 15, "Iasi": 20, "Timisoara": 20},
    "Cluj": {"Bucuresti": 15, "Iasi": 10, "Timisoara": 12},
    "Iasi": {"Bucuresti": 20, "Cluj": 10, "Timisoara": 25},
    "Timisoara": {"Bucuresti": 20, "Cluj": 12, "Iasi": 25},
}


@app.get("/api/default-scenario")
def get_default_scenario():
    """Return a preloaded scenario that users can edit in the UI."""
    return {
        "branches": DEFAULT_BRANCHES,
        "current_stock": DEFAULT_CURRENT_STOCK,
        "min_stock": DEFAULT_MIN_STOCK,
        "target_stock": DEFAULT_TARGET_STOCK,
        "price": DEFAULT_PRICE,
        "transport_costs": DEFAULT_TRANSPORT_COSTS,
    }


@app.post("/api/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest):
    """Run the optimization and return the redistribution plan."""
    # Validate that all branches have stock entries
    for b in req.branches:
        if b not in req.current_stock:
            raise HTTPException(400, f"Lipsește stocul curent pentru filiala '{b}'")
        if b not in req.min_stock:
            raise HTTPException(400, f"Lipsește stocul minim pentru filiala '{b}'")
        if b not in req.target_stock:
            raise HTTPException(400, f"Lipsește stocul țintă pentru filiala '{b}'")

    raw = optimizare_retea_stocuri(
        filiale=req.branches,
        stoc_curent=req.current_stock,
        stoc_minim=req.min_stock,
        stoc_tinta=req.target_stock,
        pret_produs=req.price,
        costuri_transport=req.transport_costs,
    )
    return raw_result_to_response(raw)
