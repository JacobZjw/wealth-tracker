import $ajax from './ajax'

const genApiPath = (path) => {
  return `/api/${path}`
}

export const createAssets = (data) => {
  return $ajax.post(genApiPath('assets'), data)
}

export const getAssets = (data = {}) => {
  return $ajax.get(genApiPath('assets'), data)
}

export const getAssetsWithSubAccounts = () => {
  return $ajax.get(genApiPath('assets'), { include_sub: 'true' })
}

export const getParentAccounts = () => {
  return $ajax.get(genApiPath('assets/parents'), {})
}

export const getSubAccounts = (parentId: string) => {
  return $ajax.get(genApiPath(`assets/${parentId}/subaccounts`), {})
}

export const updateAssets = (data) => {
  return $ajax.put(genApiPath('assets'), data)
}

export const destroyAssets = (data) => {
  return $ajax.delete(genApiPath('assets'), data)
}

export const checkPassword = (data = {}) => {
  return $ajax.get(genApiPath('password/check'), data)
}

export const verifyPassword = (password: string) => {
  return $ajax.post(genApiPath('password/verify'), { password })
}

export const setPassword = (password: string) => {
  return $ajax.post(genApiPath('password/set'), { password })
}

export const getRecords = (data = {}) => {
  return $ajax.get(genApiPath('records'), data)
}

export const updateRecords = (data) => {
  return $ajax.post(genApiPath('records'), data)
}

export const destroyRecords = (data) => {
  return $ajax.delete(genApiPath('records'), data)
}

export const createInsights = (data) => {
  return $ajax.post(genApiPath('insights'), data)
}

export const getInsights = (data = {}) => {
  return $ajax.get(genApiPath('insights'), data)
}

export const updateInsights = (data) => {
  return $ajax.put(genApiPath('insights'), data)
}

export const destroyInsights = (data) => {
  return $ajax.delete(genApiPath('insights'), data)
}

export const getInsightsCalendarData = (data) => {
  return $ajax.get(genApiPath('insights/calendar'), data)
}

export const resetDatabase = () => {
  return $ajax.post(genApiPath('reset'), {})
}

export const generateAdvice = (data) => {
  return $ajax.post(genApiPath('generate-advice'), data)
}

export const getUserSettings = () => {
  return $ajax.get(genApiPath('settings'), {})
}

export const updateUserSettings = (data) => {
  return $ajax.put(genApiPath('settings'), data)
}

export const getCustomCurrencies = () => {
  return $ajax.get(genApiPath('currencies'), {})
}

export const getAllCustomCurrencies = () => {
  return $ajax.get(genApiPath('currencies/all'), {})
}

export const createCustomCurrency = (data) => {
  return $ajax.post(genApiPath('currencies'), data)
}

export const updateCustomCurrency = (id, data) => {
  return $ajax.put(genApiPath(`currencies/${id}`), data)
}

export const deleteCustomCurrency = (id) => {
  return $ajax.delete(genApiPath(`currencies/${id}`), {})
}

export const getStockPrice = (code: string) => {
  return $ajax.get(genApiPath(`quotes/stock/${code}`), {})
}

export const updateAllStockNav = () => {
  return $ajax.post(genApiPath('quotes/stocks/update'), {})
}

export const getFundNav = (code: string) => {
  return $ajax.get(genApiPath(`quotes/fund/${code}`), {})
}

export const updateAllFundNav = () => {
  return $ajax.post(genApiPath('quotes/funds/update'), {})
}
