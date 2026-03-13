import type { OptimizeResult } from '../types'

interface Props {
  result: OptimizeResult
}

export default function ResultsPanel({ result }: Props) {
  const isSuccess = result.status === 'optimal'
  const hasError = result.error

  return (
    <section className="results-panel">
      <h2>Rezultate</h2>
      {hasError && (
        <div className={`result-status ${result.status}`}>
          <strong>Status:</strong> {result.error}
        </div>
      )}
      {isSuccess && result.total_profit != null && (
        <div className="total-profit">
          Profit net estimat: <strong>{result.total_profit.toFixed(2)} RON</strong>
        </div>
      )}
      {Object.keys(result.surplus).length > 0 && (
        <div className="surplus-deficit">
          <h3>Surplus (oferta)</h3>
          <ul>
            {Object.entries(result.surplus).map(([b, q]) => (
              <li key={b}>
                {b}: {q} unități
              </li>
            ))}
          </ul>
        </div>
      )}
      {Object.keys(result.deficit).length > 0 && (
        <div className="surplus-deficit">
          <h3>Deficit (cererea)</h3>
          <ul>
            {Object.entries(result.deficit).map(([b, q]) => (
              <li key={b}>
                {b}: {q} unități
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.transfers.length > 0 && (
        <div className="transfers">
          <h3>Plan de redistribuire</h3>
          <table>
            <thead>
              <tr>
                <th>De la</th>
                <th>Către</th>
                <th>Cantitate</th>
                <th>Cost transport/unit.</th>
                <th>Marjă/unit.</th>
                <th>Profit linie</th>
              </tr>
            </thead>
            <tbody>
              {result.transfers.map((t, i) => (
                <tr key={i}>
                  <td>{t.from_branch}</td>
                  <td>{t.to_branch}</td>
                  <td>{t.quantity}</td>
                  <td>{t.unitTransportCost.toFixed(2)}</td>
                  <td>{t.unitMargin.toFixed(2)}</td>
                  <td>{t.lineProfit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="transfer-summary">
            {result.transfers.map((t, i) => (
              <li key={i}>
                Trimite {t.quantity} unități din {t.from_branch} → către {t.to_branch}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
