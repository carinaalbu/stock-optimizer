"""
Rezolvă problema de redistribuire a stocurilor pentru a maximiza profitul net.
Refactored from optimization-logic.py with structured API-friendly output.
"""
from typing import Any

import pulp


def optimizare_retea_stocuri(
    filiale: list[str],
    stoc_curent: dict[str, int],
    stoc_minim: dict[str, int],
    stoc_tinta: dict[str, int],
    pret_produs: float,
    costuri_transport: dict[str, dict[str, float]],
) -> dict[str, Any]:
    """
    Rezolvă problema de redistribuire a stocurilor pentru a maximiza profitul net.
    Stoc țintă (stoc_tinta) = nivelul dorit după redistribuire; transportăm până la acest nivel,
    nu doar până la minim, astfel încât la prima vânzare filiala să nu reintre în deficit.
    Returns a structured dict suitable for API response.
    """
    surplus: dict[str, int] = {}
    deficit: dict[str, int] = {}

    for f in filiale:
        cur = stoc_curent.get(f, 0)
        tinta = stoc_tinta.get(f, stoc_minim.get(f, 0))
        tinta = max(tinta, stoc_minim.get(f, 0))  # țintă >= minim
        if cur > tinta:
            surplus[f] = cur - tinta
        elif cur < tinta:
            deficit[f] = tinta - cur

    # Validare fezabilitate
    if sum(surplus.values()) < sum(deficit.values()):
        return {
            "status": "infeasible",
            "error": "Deficitul total este mai mare decât surplusul disponibil în rețea.",
            "surplus": surplus,
            "deficit": deficit,
            "transfers": [],
            "total_profit": None,
        }

    # Validare: toate perechile surplus->deficit trebuie să aibă cost în matrice
    missing_costs = []
    for i in surplus:
        for j in deficit:
            if j not in costuri_transport.get(i, {}):
                missing_costs.append(f"{i} -> {j}")
    if missing_costs:
        return {
            "status": "validation_error",
            "error": f"Lipsesc costuri de transport pentru: {', '.join(missing_costs)}",
            "surplus": surplus,
            "deficit": deficit,
            "transfers": [],
            "total_profit": None,
        }

    # Inițializarea modelului de Maximizare
    model = pulp.LpProblem("Maximizare_Profit_Stocuri", pulp.LpMaximize)

    # Variabile de decizie
    x = pulp.LpVariable.dicts(
        "Transfer",
        [(i, j) for i in surplus for j in deficit],
        lowBound=0,
        cat="Integer",
    )

    # Funcția Obiectiv
    model += pulp.lpSum(
        [
            (pret_produs - costuri_transport[i][j]) * x[(i, j)]
            for i in surplus
            for j in deficit
        ]
    ), "Profit_Total"

    # Constrângeri
    for i in surplus:
        model += pulp.lpSum([x[(i, j)] for j in deficit]) <= surplus[i], f"Max_Surplus_{i}"
    for j in deficit:
        model += pulp.lpSum([x[(i, j)] for i in surplus]) == deficit[j], f"Exact_Deficit_{j}"

    model.solve(pulp.PULP_CBC_CMD(msg=False))

    if pulp.LpStatus[model.status] != "Optimal":
        return {
            "status": "solver_failed",
            "error": f"Modelul nu a putut găsi o soluție optimă. Status: {pulp.LpStatus[model.status]}",
            "surplus": surplus,
            "deficit": deficit,
            "transfers": [],
            "total_profit": None,
        }

    transfers = []
    for i in surplus:
        for j in deficit:
            cantitate = x[(i, j)].varValue
            if cantitate and cantitate > 0:
                qty = int(cantitate)
                unit_cost = costuri_transport[i][j]
                unit_margin = pret_produs - unit_cost
                line_profit = qty * unit_margin
                transfers.append(
                    {
                        "from": i,
                        "to": j,
                        "quantity": qty,
                        "unitTransportCost": unit_cost,
                        "unitMargin": unit_margin,
                        "lineProfit": line_profit,
                    }
                )

    profit_estimat = pulp.value(model.objective)

    return {
        "status": "optimal",
        "error": None,
        "surplus": surplus,
        "deficit": deficit,
        "transfers": transfers,
        "total_profit": profit_estimat,
    }
