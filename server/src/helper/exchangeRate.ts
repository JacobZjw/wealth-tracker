import CustomCurrency from '../models/customCurrency'
import UserSettings from '../models/userSettings'
import axios from 'axios'

// 默认汇率数据（基于 CNY）
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  BTC: 0.0000011941,
  CNY: 1,
  AED: 0.5026,
  AFN: 10.158,
  ALL: 13.0938,
  AMD: 54.7073,
  ANG: 0.245,
  AOA: 126.6161,
  ARS: 144.5145,
  AUD: 0.2185,
  AWG: 0.245,
  AZN: 0.2334,
  BAM: 0.2593,
  BBD: 0.2737,
  BDT: 16.6231,
  BGN: 0.2593,
  BHD: 0.05146,
  BIF: 407.1731,
  BMD: 0.1369,
  BND: 0.1857,
  BOB: 0.9515,
  BRL: 0.7935,
  BSD: 0.1369,
  BTN: 12.0023,
  BWP: 1.8982,
  BYN: 0.4513,
  BZD: 0.2737,
  CAD: 0.1963,
  CDF: 392.0926,
  CHF: 0.1245,
  CLP: 132.2965,
  COP: 566.4997,
  CRC: 69.8344,
  CUP: 3.2847,
  CVE: 14.6193,
  CZK: 3.3307,
  DJF: 24.3231,
  DKK: 0.9895,
  DOP: 8.5063,
  DZD: 18.5631,
  EGP: 6.9048,
  ERN: 2.0529,
  ETB: 17.5855,
  EUR: 0.1326,
  FJD: 0.3172,
  FKP: 0.1104,
  FOK: 0.9889,
  GBP: 0.1104,
  GEL: 0.3823,
  GGP: 0.1104,
  GHS: 2.1183,
  GIP: 0.1104,
  GMD: 9.955,
  GNF: 1177.5816,
  GTQ: 1.0609,
  GYD: 28.7677,
  HKD: 1.0688,
  HNL: 3.499,
  HRK: 0.999,
  HTG: 17.9432,
  HUF: 53.7579,
  IDR: 2226.4752,
  ILS: 0.4871,
  IMP: 0.1104,
  INR: 11.9918,
  IQD: 179.4322,
  IRR: 5973.1953,
  ISK: 19.3884,
  JEP: 0.1104,
  JMD: 21.6577,
  JOD: 0.09703,
  JPY: 20.7843,
  KES: 17.7214,
  KGS: 11.9999,
  KHR: 549.9481,
  KID: 0.2185,
  KMF: 65.2269,
  KRW: 199.0036,
  KWD: 0.04234,
  KYD: 0.1141,
  KZT: 70.0643,
  LAK: 3007.1916,
  LBP: 12249.0826,
  LKR: 40.8458,
  LRD: 27.3081,
  LSL: 2.5388,
  LYD: 0.6737,
  MAD: 1.3742,
  MDL: 2.5662,
  MGA: 641.6061,
  MKD: 8.1062,
  MMK: 393.1685,
  MNT: 474.7613,
  MOP: 1.1008,
  MRU: 5.4945,
  MUR: 6.3906,
  MVR: 2.1212,
  MWK: 238.2096,
  MXN: 2.8232,
  MYR: 0.6087,
  MZN: 8.7361,
  NAD: 2.5388,
  NGN: 205.9854,
  NIO: 5.0502,
  NOK: 1.5426,
  NPR: 19.2036,
  NZD: 0.2419,
  OMR: 0.05262,
  PAB: 0.1369,
  PEN: 0.5098,
  PGK: 0.5517,
  PHP: 7.9529,
  PKR: 38.2092,
  PLN: 0.5562,
  PYG: 1083.5974,
  QAR: 0.4982,
  RON: 0.658,
  RSD: 15.5123,
  RUB: 13.281,
  RWF: 191.8944,
  SAR: 0.5132,
  SBD: 1.1646,
  SCR: 2.0164,
  SDG: 61.371,
  SEK: 1.5,
  SGD: 0.1857,
  SHP: 0.1104,
  SLE: 3.1262,
  SLL: 3127.0105,
  SOS: 78.4185,
  SRD: 4.823,
  SSP: 592.7959,
  STN: 3.2483,
  SYP: 1774.7705,
  SZL: 2.5388,
  THB: 4.6314,
  TJS: 1.4993,
  TMT: 0.4802,
  TND: 0.4378,
  TOP: 0.3308,
  TRY: 4.9357,
  TTD: 0.9308,
  TVD: 0.2185,
  TWD: 4.5014,
  TZS: 352.8228,
  UAH: 5.694,
  UGX: 503.9568,
  USD: 0.1368,
  UYU: 5.9677,
  UZS: 1768.0458,
  VES: 8.3046,
  VND: 3462.2267,
  VUV: 16.7093,
  WST: 0.3878,
  XAF: 86.9692,
  XCD: 0.3695,
  XDR: 0.105,
  XOF: 86.9692,
  XPF: 15.8215,
  YER: 34.1211,
  ZAR: 2.5392,
  ZMW: 3.8698,
  ZWL: 0.8767,
}

// 从 API 获取实时汇率
const fetchLatestRates = async (apiKey: string, base = 'CNY'): Promise<Record<string, number> | null> => {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`, {
      timeout: 10000,
    })
    if (response.data && response.data.conversion_rates) {
      return response.data.conversion_rates
    }
    return null
  } catch (error) {
    console.error('Failed to fetch exchange rates from API:', error)
    return null
  }
}

// 获取合并后的汇率数据（实时汇率 + 自定义货币汇率）
export const getMergedExchangeRates = async (): Promise<Record<string, number>> => {
  let rates = { ...DEFAULT_EXCHANGE_RATES }

  try {
    // 获取 API Key
    const settings = await UserSettings.findOne({ where: {} })
    const apiKey = settings?.exchangeRateApiKey

    // 尝试从 API 获取实时汇率
    if (apiKey) {
      const apiRates = await fetchLatestRates(apiKey, 'CNY')
      if (apiRates) {
        rates = { ...rates, ...apiRates }
      }
    }

    // 合并自定义货币汇率
    const customCurrencies = await CustomCurrency.findAll({
      where: { isActive: true },
    })

    for (const custom of customCurrencies) {
      if (custom.code && custom.exchangeRate) {
        const ex = parseFloat(String(custom.exchangeRate))
        if (!Number.isNaN(ex)) {
          rates[custom.code] = parseFloat(ex.toFixed(10))
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
  }

  return rates
}

// 货币转换
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number => {
  if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
    return amount
  }

  // 先转换到基准货币（CNY），再转换到目标货币
  const baseAmount = amount / rates[fromCurrency]
  return Number((baseAmount * rates[toCurrency]).toFixed(2))
}
