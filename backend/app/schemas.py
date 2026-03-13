from typing import Any

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    branches: list[str] = Field(..., min_length=1, description="Lista de filiale")
    current_stock: dict[str, int] = Field(..., description="Stoc curent per filială")
    min_stock: dict[str, int] = Field(..., description="Stoc minim obligatoriu per filială")
    target_stock: dict[str, int] = Field(
        ..., description="Stoc țintă per filială (nivel dorit după redistribuire, >= minim)"
    )
    transferable_stock: dict[str, int] = Field(
        ...,
        description="Stoc disponibil pentru transfer per filială (ex. produse 30+ zile nevinzute)",
    )
    price: float = Field(..., gt=0, description="Preț pe produs (RON)")
    transport_costs: dict[str, dict[str, float]] = Field(
        ..., description="Matrice costuri transport: {from_branch: {to_branch: cost}}"
    )


class TransferItem(BaseModel):
    from_branch: str
    to_branch: str
    quantity: int
    unitTransportCost: float
    unitMargin: float
    lineProfit: float


class OptimizeResponse(BaseModel):
    status: str
    error: str | None = None
    surplus: dict[str, int] = Field(default_factory=dict)
    deficit: dict[str, int] = Field(default_factory=dict)
    transfers: list[TransferItem] = Field(default_factory=list)
    total_profit: float | None = None


def raw_result_to_response(raw: dict[str, Any]) -> OptimizeResponse:
    transfers = [
        TransferItem(
            from_branch=t["from"],
            to_branch=t["to"],
            quantity=t["quantity"],
            unitTransportCost=t["unitTransportCost"],
            unitMargin=t["unitMargin"],
            lineProfit=t["lineProfit"],
        )
        for t in raw.get("transfers", [])
    ]
    return OptimizeResponse(
        status=raw["status"],
        error=raw.get("error"),
        surplus=raw.get("surplus", {}),
        deficit=raw.get("deficit", {}),
        transfers=transfers,
        total_profit=raw.get("total_profit"),
    )
