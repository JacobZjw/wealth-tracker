export interface SelectItem {
  name: string
  value?: string
  disabled?: boolean
}

export interface RecordsItem {
  page?: number
  size?: number
  total?: number
  data?: any[]
}

export type AssetType = 'GENERIC' | 'BANK_FIXED' | 'FUND' | 'STOCK'

export interface AssetsItem {
  type: string
  alias: string
  amount: number
  currency: string
  risk: string
  liquidity: string
  datetime: string
  note: string
  tags?: string
  asset_type?: AssetType
  // 银行定期专用字段
  principal?: number
  interest_rate?: number
  start_date?: string
  term_months?: number
  maturity_date?: string
  expected_interest?: number
  // 基金/股票专用字段
  shares?: number
  nav?: number
  // 子账户相关字段
  parent_id?: string
  code?: string
}

export interface Settings {
  [key: string]: string | number
}
