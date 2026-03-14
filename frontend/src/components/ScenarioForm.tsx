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

  const displayNumber = (value: number | undefined) =>
    value && value > 0 ? String(value) : "";

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
      <div className="scenario-layout">
        <aside className="scenario-sidebar">
          <section className="branch-section">
            <h2>Adăugare filiale</h2>
            <div className="branch-add">
              <input
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                placeholder="Nume filială nouă"
              />
              <button type="button" className="secondary-action" onClick={addBranch}>
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

          <section className="price-card">
            <p className="section-kicker">Preț produs</p>
            <label className="price-input">
              <span>Preț per unitate (RON)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={displayNumber(scenario.price)}
                onChange={(e) => updatePrice(parseFloat(e.target.value) || 0)}
                placeholder="Introduceți prețul"
              />
            </label>
          </section>

          <div className="action-row">
            <button
              type="button"
              className="toggle-matrix secondary-action"
              onClick={() => setShowCostMatrix(!showCostMatrix)}
            >
              {showCostMatrix ? "Ascunde Prețuri Transport" : "Prețuri Transport"}
            </button>
            <button type="submit" className="primary-action" disabled={loading}>
              {loading ? "Se calculează..." : "Calculează planul optim"}
            </button>
          </div>
        </aside>

        <div className="scenario-main">
          <section className="stock-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Tabel stocuri</p>
                <h2>Stocuri pe filiale</h2>
              </div>
              <span className="branch-counter">{scenario.branches.length} filiale</span>
            </div>
            <div className="agenda-card table-agenda">
              <p className="section-kicker">Notițe</p>
              <h2>Ghid rapid pentru completare</h2>
              <div className="agenda-list">
                <p>
                  <strong>Stoc țintă</strong> = nivelul dorit după redistribuire.
                </p>
                <p>
                  <strong>Stoc minim</strong> = pragul sub care filiala nu trebuie
                  să ajungă.
                </p>
                <p>
                  <strong>Disponibil transfer</strong> = doar unitățile eligibile
                  pentru mutare, de exemplu produse 30+ zile.
                </p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Filială</th>
                    <th>Stoc curent</th>
                    <th>Stoc minim</th>
                    <th>Stoc țintă</th>
                    <th>Disponibil transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.branches.map((b) => (
                    <tr key={b}>
                      <td className="branch-name-cell">{b}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={displayNumber(scenario.current_stock[b])}
                          onChange={(e) =>
                            updateCurrentStock(b, parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={displayNumber(scenario.min_stock[b])}
                          onChange={(e) =>
                            updateMinStock(b, parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={displayNumber(
                            scenario.target_stock[b] ?? scenario.min_stock[b],
                          )}
                          onChange={(e) =>
                            updateTargetStock(b, parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={displayNumber(scenario.transferable_stock[b])}
                          onChange={(e) =>
                            updateTransferableStock(
                              b,
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          title="Doar aceste unități pot fi trimise către alte filiale"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {showCostMatrix && (
            <section className="transport-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Prețuri Transport</p>
                  <h2>Matrice costuri între filiale</h2>
                </div>
              </div>
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
                                value={displayNumber(scenario.transport_costs[from]?.[to])}
                                onChange={(e) =>
                                  updateTransportCost(
                                    from,
                                    to,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="0"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
