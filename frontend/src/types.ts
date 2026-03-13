export interface Scenario {
  branches: string[]
  current_stock: Record<string, number>
  min_stock: Record<string, number>
  target_stock: Record<string, number>
  price: number
  transport_costs: Record<string, Record<string, number>>
}

export interface TransferItem {
  from_branch: string
  to_branch: string
  quantity: number
  unitTransportCost: number
  unitMargin: number
  lineProfit: number
}

export interface OptimizeResult {
  status: string
  error: string | null
  surplus: Record<string, number>
  deficit: Record<string, number>
  transfers: TransferItem[]
  total_profit: number | null
}
