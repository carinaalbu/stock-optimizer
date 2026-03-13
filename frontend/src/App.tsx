import { useEffect, useState } from 'react'
import ScenarioForm from './components/ScenarioForm'
import ResultsPanel from './components/ResultsPanel'
import type { Scenario, OptimizeResult } from './types'

const API_BASE = '/api'

export default function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/default-scenario`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!data?.branches?.length || !data?.target_stock || !data?.transferable_stock) {
          throw new Error('Răspuns invalid de la server.')
        }
        setScenario(data)
      })
      .catch((e) =>
        setError(
          e.message?.startsWith('API ')
            ? 'Backend-ul nu răspunde. Porniți-l cu: cd backend && .\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001'
            : 'Nu s-a putut încărca scenariul implicit.'
        )
      )
  }, [])

  const handleOptimize = async (payload: Scenario) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg || '').join('; ')
          : data.detail || 'Eroare la optimizare.'
        setError(msg)
        return
      }
      setResult(data)
    } catch (e) {
      setError('Eroare de rețea. Verificați că backend-ul rulează pe portul 8001.')
    } finally {
      setLoading(false)
    }
  }

  const handleScenarioChange = (next: Scenario) => setScenario(next)

  if (error && !scenario) {
    return (
      <div className="app">
        <header>
          <h1>Optimizator Redistribuire Stocuri</h1>
        </header>
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="app">
        <header>
          <h1>Optimizator Redistribuire Stocuri</h1>
        </header>
        <p>Se încarcă scenariul implicit...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Optimizator Redistribuire Stocuri</h1>
      </header>
      {scenario && (
        <ScenarioForm
          scenario={scenario}
          onScenarioChange={handleScenarioChange}
          onOptimize={handleOptimize}
          loading={loading}
          error={error}
        />
      )}
      {result && <ResultsPanel result={result} />}
    </div>
  )
}
