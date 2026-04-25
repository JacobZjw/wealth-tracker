import { Assets } from '../models/Assets'
import { Record } from '../models/records'
import dayjs from 'dayjs'


export const processMaturedDeposits = async () => {
  const today = dayjs().format('YYYY-MM-DD')

  try {
    const maturedAssets = await Assets.findAll({
      where: {
        asset_type: 'BANK_FIXED',
        maturity_date: today,
      },
    })

    for (const asset of maturedAssets) {
      const totalAmount = Number(asset.principal) + Number(asset.expected_interest)

      // 如果是子账户，销毁子账户并更新父账户
      if (asset.parent_id) {
        const parent = await Assets.findByPk(asset.parent_id)

        if (parent) {
          // 父账户当前金额已包含子账户的金额
          // 需要更新为：(父账户金额 - 子账户原金额) + 到期金额
          const newParentAmount = Number(parent.amount) - Number(asset.amount) + totalAmount
          await Assets.update(
            {
              amount: newParentAmount,
              updated: new Date(),
            },
            { where: { type: asset.parent_id } },
          )

          // 创建到期记录到 Record 表
          await Record.create({
            type: asset.type,
            alias: asset.alias,
            amount: totalAmount,
            currency: asset.currency,
            datetime: today,
            note: `定期存款到期，本金+利息 ${totalAmount} 已并入父账户【${parent.alias}】`,
            risk: asset.risk,
            liquidity: asset.liquidity,
            tags: asset.tags,
            asset_type: 'BANK_FIXED',
            principal: asset.principal,
            interest_rate: asset.interest_rate,
            start_date: asset.start_date,
            term_months: asset.term_months,
            maturity_date: asset.maturity_date,
            expected_interest: asset.expected_interest,
            parent_id: asset.parent_id,
            code: asset.code,
            created: new Date(),
          })

          // 销毁子账户
          await Assets.destroy({ where: { type: asset.type } })

          console.log(`✅ 定期存款到期处理完成: ${asset.alias} (${asset.type}) -> 并入父账户 ${parent.alias}`)
        }
      } else {
        // 独立账户（非子账户），更新自身金额
        await Assets.update(
          {
            amount: totalAmount,
            principal: totalAmount,
            expected_interest: 0,
            note: `${asset.note || ''}\n[到期] ${today} 利息已并入本金`,
            updated: new Date(),
          },
          { where: { type: asset.type } },
        )

        await Record.create({
          type: asset.type,
          alias: asset.alias,
          amount: totalAmount,
          currency: asset.currency,
          datetime: today,
          note: `定期存款到期，利息已并入本金`,
          risk: asset.risk,
          liquidity: asset.liquidity,
          tags: asset.tags,
          asset_type: 'BANK_FIXED',
          principal: totalAmount,
          interest_rate: asset.interest_rate,
          start_date: asset.start_date,
          term_months: asset.term_months,
          maturity_date: asset.maturity_date,
          expected_interest: 0,
          created: new Date(),
        })

        console.log(`✅ 定期存款到期处理完成: ${asset.alias} (${asset.type})`)
      }
    }

    return { processed: maturedAssets.length }
  } catch (err: any) {
    console.error('处理到期定期存款时出错:', err)
    return { processed: 0, error: err.message }
  }
}

let schedulerInterval: NodeJS.Timeout | null = null

export const startMaturityScheduler = () => {
  // 启动后延迟 1 分钟执行首次检查
  setTimeout(async () => {
    console.log('🔍 执行定期存款到期检查...')
    await processMaturedDeposits()
  }, 60000)

  // 每分钟检查一次是否到了午夜
  schedulerInterval = setInterval(async () => {
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('🔍 执行定期存款到期检查...')
      await processMaturedDeposits()
    }
  }, 60000)

  console.log('📅 定期存款到期调度器已启动')
}

// 手动触发到期处理（用于测试）
export const triggerMaturityCheck = async () => {
  console.log('🔍 手动执行定期存款到期检查...')
  return await processMaturedDeposits()
}

export const stopMaturityScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}
