import { Assets } from './../models/assets'
import { Record } from './../models/records'
import dayjs from 'dayjs'

// 计算到期日期
const calculateMaturityDate = (startDate: string, termMonths: number): string => {
  return dayjs(startDate).add(termMonths, 'month').format('YYYY-MM-DD')
}

// 计算预计利息（简单利息）
const calculateExpectedInterest = (principal: number, interestRate: number, termMonths: number): number => {
  return Number((principal * interestRate * (termMonths / 12)).toFixed(2))
}

// 根据资产类型计算金额
const calculateAmount = (assetType: string, params: any): number => {
  switch (assetType) {
    case 'BANK_FIXED':
      return params.principal || 0
    case 'FUND':
    case 'STOCK':
      return Number(((params.shares || 0) * (params.nav || 0)).toFixed(2))
    default:
      return params.amount || 0
  }
}

// 重新计算父账户金额
const recalculateParentAmount = async (parentId: string) => {
  if (!parentId) return

  const subAccounts = await Assets.findAll({
    where: { parent_id: parentId },
  })

  const totalAmount = subAccounts.reduce((sum: number, acc: any) => {
    return sum + Number(acc.amount || 0)
  }, 0)

  await Assets.update(
    { amount: totalAmount, updated: new Date() },
    { where: { type: parentId } },
  )
}

// 构建资产选项
const buildAssetOptions = (params: any) => {
  const assetType = params.asset_type || 'GENERIC'
  const now = new Date()

  const baseOptions: any = {
    type: params.type,
    alias: params.alias || params.type,
    currency: params.currency,
    note: params.note,
    datetime: params.datetime,
    risk: params.risk,
    liquidity: params.liquidity,
    tags: params.tags || '',
    asset_type: assetType,
    updated: now,
    parent_id: params.parent_id || null,
    code: params.code || null,
  }

  // 子账户不使用风险、流动性、标签
  if (params.parent_id) {
    baseOptions.risk = 'LOW'
    baseOptions.liquidity = 'GOOD'
    baseOptions.tags = ''
  }

  if (assetType === 'BANK_FIXED') {
    const maturityDate = calculateMaturityDate(params.start_date, params.term_months)
    const expectedInterest = calculateExpectedInterest(params.principal, params.interest_rate, params.term_months)

    return {
      ...baseOptions,
      principal: params.principal,
      interest_rate: params.interest_rate,
      start_date: params.start_date,
      term_months: params.term_months,
      maturity_date: maturityDate,
      expected_interest: expectedInterest,
      amount: params.principal,
      shares: null,
      nav: null,
    }
  }

  if (assetType === 'FUND' || assetType === 'STOCK') {
    const amount = calculateAmount(assetType, params)

    return {
      ...baseOptions,
      shares: params.shares,
      nav: params.nav,
      amount,
      principal: null,
      interest_rate: null,
      start_date: null,
      term_months: null,
      maturity_date: null,
      expected_interest: null,
    }
  }

  // GENERIC 类型
  return {
    ...baseOptions,
    amount: params.amount,
    principal: null,
    interest_rate: null,
    start_date: null,
    term_months: null,
    maturity_date: null,
    expected_interest: null,
    shares: null,
    nav: null,
  }
}

export const create = async (request, reply) => {
  const params = request?.body
  try {
    // 如果创建子账户，验证父账户存在且为 GENERIC 类型
    if (params.parent_id) {
      const parent = await Assets.findByPk(params.parent_id)
      if (!parent) {
        return reply.code(400).send({
          statusCode: 400,
          message: 'Parent account not found',
        })
      }
      if (parent.asset_type !== 'GENERIC') {
        return reply.code(400).send({
          statusCode: 400,
          message: 'Parent account must be GENERIC type',
        })
      }
    }

    const options = buildAssetOptions(params)
    const assets = await Assets.create(options)
    await Record.create(assets.dataValues)

    // 如果是子账户，重新计算父账户金额
    if (params.parent_id) {
      await recalculateParentAmount(params.parent_id)
    }

    return reply.send(assets)
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}

export const get = async (request, reply) => {
  try {
    const { include_sub } = request.query
    const whereClause: any = {}

    // 默认只返回父账户，除非明确要求包含子账户
    if (include_sub !== 'true') {
      whereClause.parent_id = null
    }

    const data = await Assets.findAll({ where: whereClause })

    // 为每个账户添加子账户数量
    const dataWithSubCount = await Promise.all(
      data.map(async (item) => {
        const subCount = await Assets.count({
          where: { parent_id: item.type },
        })
        return {
          ...item.toJSON(),
          sub_account_count: subCount,
        }
      }),
    )

    return reply.send(dataWithSubCount)
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}

// 获取子账户列表
export const getSubAccounts = async (request, reply) => {
  const { parentId } = request.params
  try {
    const data = await Assets.findAll({
      where: { parent_id: parentId },
    })
    return reply.send(data)
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}

// 获取可作为父账户的账户列表（GENERIC 类型且不是子账户）
export const getParentAccounts = async (_, reply) => {
  try {
    const data = await Assets.findAll({
      where: {
        asset_type: 'GENERIC',
        parent_id: null,
      },
    })
    return reply.send(data)
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}

export const update = async (request, reply) => {
  const params = request?.body
  try {
    // 获取原账户信息以判断 parent_id 是否变更
    const originalAsset = await Assets.findByPk(params.type)
    const originalParentId = originalAsset?.parent_id

    const options = buildAssetOptions(params)
    options.created = params.created

    const data = await Assets.update(options, {
      where: { type: params.type },
    })
    await Record.create({
      ...options,
      created: new Date(),
    })

    // 如果 parent_id 变更，重新计算相关父账户金额
    if (params.parent_id !== originalParentId) {
      if (originalParentId) {
        await recalculateParentAmount(originalParentId)
      }
      if (params.parent_id) {
        await recalculateParentAmount(params.parent_id)
      }
    } else if (params.parent_id) {
      // parent_id 未变更但金额可能变更
      await recalculateParentAmount(params.parent_id)
    }

    return reply.send(data)
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}

export const destroy = async (request, reply) => {
  const { type = '' } = request?.body
  try {
    // 获取要删除的账户信息
    const asset = await Assets.findByPk(type)
    const parentId = asset?.parent_id

    // 检查是否是父账户且有子账户
    const subAccountCount = await Assets.count({
      where: { parent_id: type },
    })
    if (subAccountCount > 0) {
      return reply.code(400).send({
        statusCode: 400,
        message: 'Cannot delete parent account with sub-accounts',
      })
    }

    await Assets.destroy({ where: { type } })
    await Record.destroy({ where: { type } })

    // 如果是子账户，重新计算父账户金额
    if (parentId) {
      await recalculateParentAmount(parentId)
    }

    return reply.send({ result: true })
  } catch (error: any) {
    return reply.code(400).send({
      statusCode: 400,
      message: error.message,
    })
  }
}
