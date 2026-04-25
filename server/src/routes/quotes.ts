import { getStockPrice, updateAllStockNav, getFundNav, updateAllFundNav } from '../controllers/quotes'

// Stock and fund quote routes
export default [
  {
    method: 'GET',
    url: '/api/quotes/stock/:code',
    handler: getStockPrice,
  },
  {
    method: 'POST',
    url: '/api/quotes/stocks/update',
    handler: updateAllStockNav,
  },
  {
    method: 'GET',
    url: '/api/quotes/fund/:code',
    handler: getFundNav,
  },
  {
    method: 'POST',
    url: '/api/quotes/funds/update',
    handler: updateAllFundNav,
  },
]
