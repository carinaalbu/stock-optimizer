import { useState } from "react";
import type { Scenario } from "../types";

interface Props {
  scenario: Scenario;
  onScenarioChange: (s: Scenario) => void;
  onOptimize: (s: Scenario) => void;
  loading: boolean;
  error: string | null;
}

export default function ScenarioForm({
  scenario,
  onScenarioChange,
  onOptimize,
  loading,
  error,
}: Props) {
  const [newBranch, setNewBranch] = useState("");
  const [showCostMatrix, setShowCostMatrix] = useState(false);

  const addBranch = () => {
    const name = newBranch.trim();
    if (!name) return;
    if (scenario.branches.includes(name)) {
      alert("Filiala există deja.");
      return;
    }
    const branches = [...scenario.branches, name];
    const current_stock = { ...scenario.current_stock, [name]: 0 };
    const min_stock = { ...scenario.min_stock, [name]: 0 };
    const target_stock = { ...scenario.target_stock, [name]: 0 };
    const transferable_stock = { ...scenario.transferable_stock, [name]: 0 };
    const transport_costs = { ...scenario.transport_costs };
    transport_costs[name] = {};
    for (const b of scenario.branches) {
      transport_costs[b] = transport_costs[b] || {};
      transport_costs[b][name] = 0;
    }
    for (const b of branches) {
      transport_costs[name][b] = transport_costs[name][b] ?? 0;
    }
    onScenarioChange({
      branches,
      current_stock,
      min_stock,
      target_stock,
      transferable_stock,
      price: scenario.price,
      transport_costs,
    });
    setNewBranch("");
  };

  const removeBranch = (name: string) => {
    if (scenario.branches.length <= 1) return;
    const branches = scenario.branches.filter((b) => b !== name);
    const { [name]: _, ...current_stock } = scenario.current_stock;
    const { [name]: __, ...min_stock } = scenario.min_stock;
    const { [name]: ___, ...target_stock } = scenario.target_stock;
    const { [name]: ____, ...transferable_stock } = scenario.transferable_stock;
    const transport_costs = { ...scenario.transport_costs };
    delete transport_costs[name];
    for (const b of branches) {
      if (transport_costs[b]) delete transport_costs[b][name];
    }
    onScenarioChange({
      branches,
      current_stock,
      min_stock,
      target_stock,
      transferable_stock,
      price: scenario.price,
      transport_costs,
    });
  };

  const updateCurrentStock = (branch: string, value: number) => {
    onScenarioChange({
      ...scenario,
      current_stock: {
        ...scenario.current_stock,
        [branch]: Math.max(0, value),
      },
    });
  };

  const updateMinStock = (branch: string, value: number) => {
    onScenarioChange({
      ...scenario,
      min_stock: { ...scenario.min_stock, [branch]: Math.max(0, value) },
    });
  };

  const updateTargetStock = (branch: string, value: number) => {
    onScenarioChange({
      ...scenario,
      target_stock: { ...scenario.target_stock, [branch]: Math.max(0, value) },
    });
  };

  const updateTransferableStock = (branch: string, value: number) => {
    onScenarioChange({
      ...scenario,
      transferable_stock: {
        ...scenario.transferable_stock,
        [branch]: Math.max(0, value),
      },
    });
  };

  const updatePrice = (value: number) => {
    onScenarioChange({
      ...scenario,
      price: Math.max(0, value),
    });
  };

  const updateTransportCost = (from: string, to: string, value: number) => {
    if (from === to) return;
    const transport_costs = { ...scenario.transport_costs };
    transport_costs[from] = {
      ...transport_costs[from],
      [to]: Math.max(0, value),
    };
    onScenarioChange({ ...scenario, transport_costs });
  };

  const validate = (): string | null => {
    const dupes = scenario.branches.filter(
      (b, i) => scenario.branches.indexOf(b) !== i,
    );
    if (dupes.length) return "Există filiale duplicate.";
    for (const b of scenario.branches) {
      const cur = scenario.current_stock[b];
      const min = scenario.min_stock[b];
      const tinta = scenario.target_stock[b];
      if (cur === undefined || cur < 0)
        return `Stoc curent invalid pentru ${b}.`;
      if (min === undefined || min < 0)
        return `Stoc minim invalid pentru ${b}.`;
      if (tinta === undefined || tinta < 0)
        return `Stoc țintă invalid pentru ${b}.`;
      if (tinta < min)
        return `Stoc țintă pentru ${b} trebuie să fie >= stoc minim.`;
      const disp = scenario.transferable_stock[b];
      if (disp === undefined || disp < 0)
        return `Stoc disponibil transfer invalid pentru ${b}.`;
      const surplus = cur > tinta ? cur - tinta : 0;
      if (disp > surplus)
        return `Stoc disponibil transfer pentru ${b} nu poate depăși surplusul (${surplus}).`;
    }
    if (scenario.price <= 0) return "Prețul trebuie să fie pozitiv.";
    for (const from of scenario.branches) {
      for (const to of scenario.branches) {
        if (from === to) continue;
        const cost = scenario.transport_costs[from]?.[to];
        if (cost === undefined || cost < 0)
          return `Lipsește costul de transport ${from} → ${to}.`;
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    onOptimize(scenario);
  };

  return (
    <form className="scenario-form" onSubmit={handleSubmit}>
      <section>
        <h2>Filiale</h2>
        <div className="branch-add">
          <input
            type="text"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            placeholder="Nume filială nouă"
          />
          <button type="button" onClick={addBranch}>
            Adaugă
          </button>
        </div>
        <ul className="branch-list">
          {scenario.branches.map((b) => (
            <li key={b}>
              <span>{b}</span>
              <button
                type="button"
                onClick={() => removeBranch(b)}
                disabled={scenario.branches.length <= 1}
                title="Șterge filiala"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Stocuri</h2>
        <p className="hint">
          Stoc țintă = nivelul dorit după redistribuire (≥ minim). Stoc
          disponibil transfer = doar produsele învechite (ex. 30+ zile
          nevandute) pot fi trimise; introduceți câte unități din surplus sunt
          eligibile.
        </p>
        <table className="stock-table">
          <thead>
            <tr>
              <th>Filială</th>
              <th>Stoc curent</th>
              <th>Stoc minim</th>
              <th>Stoc țintă</th>
              <th>Stoc disponibil transfer (30+ zile)</th>
            </tr>
          </thead>
          <tbody>
            {scenario.branches.map((b) => (
              <tr key={b}>
                <td>{b}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={scenario.current_stock[b] ?? 0}
                    onChange={(e) =>
                      updateCurrentStock(b, parseInt(e.target.value, 10) || 0)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={scenario.min_stock[b] ?? 0}
                    onChange={(e) =>
                      updateMinStock(b, parseInt(e.target.value, 10) || 0)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={
                      scenario.target_stock[b] ?? scenario.min_stock[b] ?? 0
                    }
                    onChange={(e) =>
                      updateTargetStock(b, parseInt(e.target.value, 10) || 0)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={scenario.transferable_stock[b] ?? 0}
                    onChange={(e) =>
                      updateTransferableStock(
                        b,
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    title="Doar aceste unități (ex. 30+ zile) pot fi trimise către alte filiale"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <label>
          Preț produs (RON):{" "}
          <input
            type="number"
            min={0}
            step={0.01}
            value={scenario.price}
            onChange={(e) => updatePrice(parseFloat(e.target.value) || 0)}
          />
        </label>
      </section>

      <section>
        <button
          type="button"
          className="toggle-matrix"
          onClick={() => setShowCostMatrix(!showCostMatrix)}
        >
          {showCostMatrix ? "Ascunde" : "Editează"} matricea de costuri
          transport
        </button>
        {showCostMatrix && (
          <div className="cost-matrix-wrap">
            <table className="cost-matrix">
              <thead>
                <tr>
                  <th></th>
                  {scenario.branches.map((b) => (
                    <th key={b}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenario.branches.map((from) => (
                  <tr key={from}>
                    <th>{from}</th>
                    {scenario.branches.map((to) => (
                      <td key={to}>
                        {from === to ? (
                          <span className="na">—</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={scenario.transport_costs[from]?.[to] ?? ""}
                            onChange={(e) =>
                              updateTransportCost(
                                from,
                                to,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Se calculează..." : "Calculează planul optim"}
      </button>
    </form>
  );
}
