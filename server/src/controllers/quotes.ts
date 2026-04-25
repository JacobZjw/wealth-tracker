import axios from 'axios'
import * as iconv from 'iconv-lite'
import { Assets } from '../models/Assets'

interface StockQuote {
  price: number | null
  name: string | null
}

interface FundQuote {
  nav: number | null
  name: string | null
}

interface QuoteResult {
  type: string
  alias: string | null
  code?: string | null
  oldNav?: number | null
  newNav?: number | null
  oldAmount?: number | null
  newAmount?: number | null
  nameUpdated?: boolean
  success: boolean
  message?: string
}

// 腾讯股票API获取股票实时价格和名称
const fetchStockQuote = async (code: string): Promise<StockQuote> => {
  try {
    // 判断股票代码属于上交所还是深交所
    let market = 'sh'
    if (code.startsWith('00') || code.startsWith('30')) {
      market = 'sz'
    }

    const url = `http://qt.gtimg.cn/q=${market}${code}`
    const response = await axios.get(url, {
      timeout: 5000,
      responseType: 'arraybuffer',
    })

    // 使用 iconv-lite 解码 GBK 编码
    const data = iconv.decode(Buffer.from(response.data), 'gbk')

    // 格式: v_sh600519="1~贵州茅台~600519~1458.49~..."
    const match = data.match(/="([^"]+)"/)
    if (match && match[1]) {
      const parts = match[1].split('~')
      if (parts.length >= 4) {
        // parts[1]: 股票名称, parts[3]: 当前价格
        const name = parts[1] || null
        const price = parseFloat(parts[3])
        if (!isNaN(price)) {
          return { price, name }
        }
      }
    }

    return { price: null, name: null }
  } catch (error) {
    console.error(`获取股票 ${code} 信息失败:`, error)
    return { price: null, name: null }
  }
}

// 东方财富API获取基金净值和名称
const fetchFundQuote = async (code: string): Promise<FundQuote> => {
  try {
    const url = `http://fundgz.1234567.com.cn/js/${code}.js`
    const response = await axios.get(url, {
      timeout: 5000,
    })

    // 返回格式: jsonpgz({"fundcode":"000001","name":"华夏成长","jzrq":"2024-01-15","dwjz":"1.2340","gsz":"1.2350",...})
    // dwjz: 单位净值（上一交易日）, gsz: 实时估算净值
    const match = response.data.match(/jsonpgz\((.*)\)/)
    if (match && match[1]) {
      const data = JSON.parse(match[1])
      // 优先使用实时估算净值 gsz，如果没有则使用单位净值 dwjz
      const nav = parseFloat(data.gsz) || parseFloat(data.dwjz) || null
      const name = data.name || null
      return { nav, name }
    }

    return { nav: null, name: null }
  } catch (error) {
    console.error(`获取基金 ${code} 信息失败:`, error)
    return { nav: null, name: null }
  }
}

// 获取单只股票价格
export const getStockPrice = async (request, reply) => {
  const { code } = request.params

  if (!code) {
    return reply.code(400).send({
      statusCode: 400,
      message: 'Stock code is required',
    })
  }

  try {
    const quote = await fetchStockQuote(code)

    if (quote.price === null) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Stock not found or market closed',
      })
    }

    return reply.send({
      code,
      price: quote.price,
      name: quote.name,
      updateTime: new Date().toISOString(),
    })
  } catch (error: any) {
    return reply.code(500).send({
      statusCode: 500,
      message: error.message,
    })
  }
}

// 批量更新所有股票净值
export const updateAllStockNav = async (_, reply) => {
  try {
    // 查询所有股票类型的资产
    const stocks = await Assets.findAll({
      where: {
        asset_type: 'STOCK',
      },
    })

    const results: QuoteResult[] = []

    for (const stock of stocks) {
      if (!stock.code) {
        results.push({
          type: stock.type,
          alias: stock.alias,
          success: false,
          message: 'No stock code',
        })
        continue
      }

      const quote = await fetchStockQuote(stock.code)

      if (quote.price !== null) {
        // 更新净值、金额和名称
        const newAmount = Number(stock.shares) * quote.price
        const updateData: any = {
          nav: quote.price,
          amount: newAmount,
          updated: new Date(),
        }

        // 如果获取到名称，也更新 alias
        if (quote.name) {
          updateData.alias = quote.name
        }

        await Assets.update(updateData, { where: { type: stock.type } })

        results.push({
          type: stock.type,
          alias: quote.name || stock.alias,
          code: stock.code,
          oldNav: stock.nav,
          newNav: quote.price,
          oldAmount: stock.amount,
          newAmount: newAmount,
          nameUpdated: !!quote.name,
          success: true,
        })
      } else {
        results.push({
          type: stock.type,
          alias: stock.alias,
          code: stock.code,
          success: false,
          message: 'Failed to fetch price',
        })
      }
    }

    return reply.send({
      total: stocks.length,
      updated: results.filter((r) => r.success).length,
      results,
    })
  } catch (error: any) {
    return reply.code(500).send({
      statusCode: 500,
      message: error.message,
    })
  }
}

// 批量更新所有基金净值
export const updateAllFundNav = async (_, reply) => {
  try {
    // 查询所有基金类型的资产
    const funds = await Assets.findAll({
      where: {
        asset_type: 'FUND',
      },
    })

    const results: QuoteResult[] = []

    for (const fund of funds) {
      if (!fund.code) {
        results.push({
          type: fund.type,
          alias: fund.alias,
          success: false,
          message: 'No fund code',
        })
        continue
      }

      const quote = await fetchFundQuote(fund.code)

      if (quote.nav !== null) {
        // 更新净值、金额和名称
        const newAmount = Number(fund.shares) * quote.nav
        const updateData: any = {
          nav: quote.nav,
          amount: newAmount,
          updated: new Date(),
        }

        // 如果获取到名称，也更新 alias
        if (quote.name) {
          updateData.alias = quote.name
        }

        await Assets.update(updateData, { where: { type: fund.type } })

        results.push({
          type: fund.type,
          alias: quote.name || fund.alias,
          code: fund.code,
          oldNav: fund.nav,
          newNav: quote.nav,
          oldAmount: fund.amount,
          newAmount: newAmount,
          nameUpdated: !!quote.name,
          success: true,
        })
      } else {
        results.push({
          type: fund.type,
          alias: fund.alias,
          code: fund.code,
          success: false,
          message: 'Failed to fetch NAV',
        })
      }
    }

    return reply.send({
      total: funds.length,
      updated: results.filter((r) => r.success).length,
      results,
    })
  } catch (error: any) {
    return reply.code(500).send({
      statusCode: 500,
      message: error.message,
    })
  }
}

// 获取单只基金净值
export const getFundNav = async (request, reply) => {
  const { code } = request.params

  if (!code) {
    return reply.code(400).send({
      statusCode: 400,
      message: 'Fund code is required',
    })
  }

  try {
    const quote = await fetchFundQuote(code)

    if (quote.nav === null) {
      return reply.code(404).send({
        statusCode: 404,
        message: 'Fund not found',
      })
    }

    return reply.send({
      code,
      nav: quote.nav,
      name: quote.name,
      updateTime: new Date().toISOString(),
    })
  } catch (error: any) {
    return reply.code(500).send({
      statusCode: 500,
      message: error.message,
    })
  }
}
