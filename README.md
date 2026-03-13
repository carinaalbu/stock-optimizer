# Transportation Optimizer

Full-stack application for optimizing stock redistribution across branches to maximize profit. Uses linear programming (PuLP) to compute the optimal transfer plan.

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
3. Click **Editează matricea de costuri transport** to adjust transport costs between branches.
4. Click **Calculează planul optim** to run the optimization.
5. View the redistribution plan and estimated profit.

## API

- `GET /api/default-scenario` – Returns preloaded scenario (branches, stock, costs).
- `POST /api/optimize` – Runs optimization. Request body: `{ branches, current_stock, min_stock, price, transport_costs }`.
