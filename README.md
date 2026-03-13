# Transportation Optimizer

Full-stack application for optimizing stock redistribution across branches to maximize profit. Uses linear programming (PuLP) to compute the optimal transfer plan.

## Transportation Model & Linear Programming

### The Transportation Problem

The app models a classic **transportation problem**: a network of branches (supply sources) and destinations (branches with deficit). Each branch either has **surplus** stock (above its minimum) or **deficit** (below minimum). The goal is to move units from surplus branches to deficit branches in a way that **maximizes net profit**, given transport costs between each pair.

- **Supply (surplus)**: Branches with current stock > target/minimum. They can send units out.
- **Demand (deficit)**: Branches with current stock < target/minimum. They need units to reach their target.
- **Transport cost matrix**: Cost per unit to ship from branch *i* to branch *j*.

### Linear Programming Formulation

The problem is formulated as a **linear program (LP)** and solved with PuLP (CBC solver):

**Decision variables**

- $x_{ij}$ = number of units transferred from surplus branch *i* to deficit branch *j*
- All $x_{ij} \geq 0$ and **integer** (no fractional units).

**Objective function (maximize)**

$$\text{Profit} = \sum_{i,j} (p - c_{ij}) \cdot x_{ij}$$

where $p$ = unit selling price and $c_{ij}$ = transport cost from *i* to *j*. Each unit sold yields $(p - c_{ij})$ margin.

**Constraints**

1. **Supply**: For each surplus branch *i*, total outflows cannot exceed available surplus:
   $$\sum_j x_{ij} \leq \text{surplus}_i$$

2. **Demand**: For each deficit branch *j*, total inflows must exactly cover the deficit:
   $$\sum_i x_{ij} = \text{deficit}_j$$

The solver finds integer values for all $x_{ij}$ that satisfy these constraints and maximize total profit.

## Structure

- **frontend/** – React + TypeScript + Vite UI
- **backend/** – FastAPI service wrapping the PuLP optimizer
- **optimization-logic.py** – Original prototype (logic moved to `backend/app/optimizer/`)

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Uses port 8001 by default (8000 is often in use). The frontend proxy is configured for 8001.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. The app loads a default scenario (București, Cluj, Iași, Timișoara) with sample stock and transport costs.
2. Edit **stoc curent** and **stoc minim** per branch, and the product **preț**.
3. Click **Prețuri Transport** to adjust transport costs between branches.
4. Click **Calculează planul optim** to run the optimization.
5. View the redistribution plan and estimated profit.

## API

- `GET /api/default-scenario` – Returns preloaded scenario (branches, stock, costs).
- `POST /api/optimize` – Runs optimization. Request body: `{ branches, current_stock, min_stock, price, transport_costs }`.
