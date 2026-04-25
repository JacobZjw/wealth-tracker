<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import dayjs from 'dayjs'
  import { _ } from 'svelte-i18n'
  import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
  import { Modal } from 'flowbite'
  import InputTag from '../InputTag.svelte'
  import SvgIcon from '../SvgIcon.svelte'
  import CustomSelect from './../Select.svelte'
  import { createAssets, updateAssets, updateRecords, getParentAccounts } from './../../helper/apis'
  import {
    ACTION_TYPES,
    ASSETS_RISK_ARR,
    ASSETS_LIQUIDITY_ARR,
    ASSET_TYPES,
    TERM_MONTHS_OPTIONS,
    DEFAULT_ACCOUNT_ITEM,
    getAllCurrencies,
  } from './../../helper/constant'
  import { alert, customCurrencies } from './../../stores'
  import { deepClone } from './../../helper/utils'
  import { trackEvent } from './../../helper/analytics'
  import type { ModalOptions } from 'flowbite'

  dayjs.extend(isSameOrBefore)

  const dispatch = createEventDispatcher()
  const MODAL_KEY = 'update-modal'
  let modal = null
  let datetimeError = ''
  let isUpdate = false
  let isChange = false
  let supportedCurrencys: Currencys[] = []
  let parentAccountOptions: { name: string; value: string }[] = []

  export let action = ''
  export let items = deepClone(DEFAULT_ACCOUNT_ITEM)

  type Currencys = {
    name?: string
    value: string
  }

  $: {
    const allCurrencies = getAllCurrencies($customCurrencies)
    supportedCurrencys = allCurrencies.map((item) => {
      const name = item.isCustom
        ? (item as any).name || item.value
        : $_(`currencys.${item.value}`) || item.value
      return {
        name,
        value: item.value,
      }
    })
  }

  $: isUpdate = action === ACTION_TYPES.update

  $: isChange = action === ACTION_TYPES.update || action === ACTION_TYPES.change

  // 判断是否为子账户
  $: isSubAccount = !!items.parent_id

  $: localizedRiskArr = ASSETS_RISK_ARR.map((item) => ({
    name: $_(item.key),
    value: item.value,
  }))

  $: localizedLiquidityArr = ASSETS_LIQUIDITY_ARR.map((item) => ({
    name: $_(item.key),
    value: item.value,
  }))

  // 父账户只能选择"通用资产"，子账户可以选择所有类型
  $: localizedAssetTypeArr = isSubAccount
    ? ASSET_TYPES.map((item) => ({
        name: $_(`assetTypes.${item.key}`) || item.name,
        value: item.value,
      }))
    : [{ name: $_('assetTypes.generic') || '通用资产', value: 'GENERIC' }]

  // 银行定期计算
  $: calculatedMaturityDate =
    items.asset_type === 'BANK_FIXED' && items.start_date && items.term_months
      ? dayjs(items.start_date).add(items.term_months, 'month').format('YYYY-MM-DD')
      : ''

  $: calculatedExpectedInterest =
    items.asset_type === 'BANK_FIXED' && items.principal && items.interest_rate && items.term_months
      ? (items.principal * (items.interest_rate / 100) * (items.term_months / 12)).toFixed(2)
      : '0.00'

  // 基金/股票计算
  $: calculatedAmount =
    items.asset_type === 'FUND' || items.asset_type === 'STOCK'
      ? ((items.shares || 0) * (items.nav || 0)).toFixed(2)
      : items.amount?.toFixed(2) || '0.00'

  // tags 本地绑定数组，解决 Svelte 只能绑定到标识符/成员表达式的问题
  let tags: string[] = []

  const fetchParentAccounts = async () => {
    try {
      const data = await getParentAccounts()
      // 添加"无"选项作为默认选项
      parentAccountOptions = [
        { name: $_('none') || '无', value: '' },
        ...data.map((item) => ({
          name: item.alias || item.type,
          value: item.type,
        })),
      ]
    } catch (error) {
      console.error('Error fetching parent accounts:', error)
      parentAccountOptions = [{ name: $_('none') || '无', value: '' }]
    }
  }

  onMount(async () => {
    // 初始化（若 items.tags 存在且为字符串）
    if (typeof items?.tags === 'string') {
      tags = items.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    // 获取父账户列表
    await fetchParentAccounts()

    const $targetEl = document.getElementById(MODAL_KEY)
    const options: ModalOptions = {
      placement: 'top-center',
      backdropClasses: 'fixed inset-0 z-40',
      backdrop: 'static',
      closable: true,
      onHide: () => {
        dispatch('close')
      },
      onShow: () => {},
    }
    modal = new Modal($targetEl, options)
    modal.show()
  })

  onDestroy(() => {
    modal = null
  })

  const validateDatetimeInput = (params) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const isValidFormat = dateRegex.test(params.datetime)
    const nowDateTime = dayjs(items.datetime, 'YYYY-MM-DD')
    const isValidDate = nowDateTime.isValid()

    if (!isValidFormat || !isValidDate) {
      return (datetimeError = $_('fillValidDateTip'))
    }

    if (isUpdate) {
      const rawDateTime = dayjs(params.rawDatetime, 'YYYY-MM-DD')
      const isEarlier = rawDateTime.isSameOrBefore(nowDateTime, 'day')
      return (datetimeError = isEarlier ? '' : $_('fillLaterDateTip'))
    }
    datetimeError = ''
  }

  const genRiskActive = (risk) => {
    return ASSETS_RISK_ARR.findIndex((item) => item.value === risk)
  }

  const genLiquidityActive = (liquidity) => {
    return ASSETS_LIQUIDITY_ARR.findIndex((item) => item.value === liquidity)
  }

  const genCurrencyActive = (currency) => {
    return supportedCurrencys.findIndex((item) => item.value === currency)
  }

  const genAssetTypeActive = (assetType) => {
    const index = localizedAssetTypeArr.findIndex((item) => item.value === assetType)
    return index >= 0 ? index : 0
  }

  const genTermMonthsActive = (termMonths) => {
    return TERM_MONTHS_OPTIONS.findIndex((item) => item.value === termMonths)
  }

  const genParentAccountActive = (parentId) => {
    if (!parentId) return 0
    const index = parentAccountOptions.findIndex((item) => item.value === parentId)
    return index >= 0 ? index : 0
  }

  const sendUpdateRequest = async () => {
    try {
      // 提交前将本地 tags 同步回 items.tags（以逗号分隔字符串保存）
      if (Array.isArray(tags)) {
        items.tags = tags.join(',')
      }
      if (action === ACTION_TYPES.create) {
        await createAssets(items)
        trackEvent('asset-create', {
          asset_type: items.type,
          currency: items.currency,
        })
      }
      if (action === ACTION_TYPES.update) {
        await updateAssets(items)
        trackEvent('asset-update', {
          asset_type: items.type,
          currency: items.currency,
        })
      }
      if (action === ACTION_TYPES.change) {
        await updateRecords(items)
        trackEvent('record-update', {
          asset_type: items.type,
          currency: items.currency,
        })
      }
      dispatch('confirm', items)
      modal.hide()
      modal = null
    } catch (error) {
      console.error('Error updating assets:', error)
    }
  }

  /*----------------CallBackEvent----------------*/

  const closeModal = () => {
    modal.hide()
    modal = null
s  }

  const onConfirmClick = () => {
    if (!items.alias || !items.alias.trim()) {
      alert.set($_('fillAccountTypeTip'))
      return
    }
    validateDatetimeInput(items)
    if (datetimeError) {
      alert.set(datetimeError)
      return
    }
    sendUpdateRequest()
  }

  const handleRiskSelect = (event) => {
    if (!event.detail?.value) return
    items.risk = event.detail.value
  }

  const handleCurrencySelect = (event) => {
    if (!event.detail?.value) return
    items.currency = event.detail.value
  }

  const handleLiquiditySelect = (event) => {
    if (!event.detail?.value) return
    items.liquidity = event.detail.value
  }

  const handleAssetTypeSelect = (event) => {
    if (!event.detail?.value) return
    items.asset_type = event.detail.value
    // 切换类型时重置特定字段
    if (items.asset_type !== 'BANK_FIXED') {
      items.principal = 0
      items.interest_rate = 0
      items.start_date = dayjs().format('YYYY-MM-DD')
      items.term_months = 12
    }
    if (items.asset_type !== 'FUND' && items.asset_type !== 'STOCK') {
      items.shares = 0
      items.nav = 0
      items.code = ''
    }
    if (items.asset_type !== 'GENERIC') {
      items.amount = 0
    }
  }

  const handleTermMonthsSelect = (event) => {
    if (!event.detail?.value) return
    items.term_months = event.detail.value
  }

  const handleParentAccountSelect = (event) => {
    if (!event.detail) return
    // 空值表示"无"选项
    items.parent_id = event.detail.value || null
    // 如果当前资产类型不在新选项中，重置为 GENERIC
    const willBeSubAccount = !!event.detail.value
    if (!willBeSubAccount && items.asset_type !== 'GENERIC') {
      items.asset_type = 'GENERIC'
    }
  }
</script>

<div
  id="update-modal"
  tabindex="-1"
  class="z-9999 fixed left-0 right-0 top-0 hidden h-[calc(100%-1rem)] w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0 md:h-full">
  <div class="relative h-full w-full max-w-lg md:h-auto md:max-w-md">
    <!-- Modal content -->
    <div class="relative mt-16 rounded-lg bg-white pb-8 shadow">
      <!-- Modal header -->
      <div class="flex items-center justify-between rounded-t border-b p-5">
        <h3 class="flex items-center text-lg font-medium text-gray-900 md:text-base">
          <SvgIcon name="adjustment" width={20} height={20} color="#1e293b" />
          {isChange ? $_('updateAssetRecords') : $_('newAssetAccount')}
        </h3>
        <button
          type="button"
          on:click={closeModal}
          class="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
          <SvgIcon name="close" width={20} height={20} />
          <span class="sr-only">Close modal</span>
        </button>
      </div>
      <!-- Modal body -->
      <div class="flex flex-col items-center justify-center p-6">
        <div class="module-warp">
          <label for="update-alias" class="custom-label">
            {$_('account')}
            <i class="text-mark">*</i>
          </label>
          <input
            type="text"
            id="update-alias"
            bind:value={items.alias}
            class="custom-input"
            placeholder={$_('placeholderOfAlias')}
            required />
        </div>

        <!-- 父账户选择器 -->
        {#if parentAccountOptions.length > 1}
          <div class="module-warp">
            <label for="update-parent-account" class="custom-label">
              {$_('parentAccount')}
            </label>
            <div class="w-full">
              <CustomSelect
                options={parentAccountOptions}
                active={genParentAccountActive(items.parent_id)}
                listboxClass="w-full"
                on:selected={handleParentAccountSelect} />
            </div>
          </div>
        {/if}

        <div class="module-warp">
          <label for="update-asset-type" class="custom-label">
            {$_('assetType')}
          </label>
          <div class="w-full">
            <CustomSelect
              options={localizedAssetTypeArr}
              active={genAssetTypeActive(items.asset_type)}
              listboxClass="w-full"
              on:selected={handleAssetTypeSelect} />
          </div>
        </div>
        <div class="module-warp">
          <label for="update-currency" class="custom-label">
            {$_('currency')}
          </label>
          <div class="w-full">
            <CustomSelect
              options={supportedCurrencys}
              active={genCurrencyActive(items.currency)}
              listboxClass="w-full"
              on:selected={handleCurrencySelect} />
          </div>
        </div>

        <!-- 非子账户才显示风险、流动性、标签 -->
        {#if !isSubAccount}
          <div class="module-warp">
            <label for="update-currency" class="custom-label">
              {$_('risk')}
            </label>
            <div class="w-full">
              <CustomSelect
                options={localizedRiskArr}
                active={genRiskActive(items.risk)}
                listboxClass="w-full"
                on:selected={handleRiskSelect} />
            </div>
          </div>
          <div class="module-warp">
            <label for="update-currency" class="custom-label">
              {$_('liquidity')}
            </label>
            <div class="w-full">
              <CustomSelect
                options={localizedLiquidityArr}
                active={genLiquidityActive(items.liquidity)}
                listboxClass="w-full"
                on:selected={handleLiquiditySelect} />
            </div>
          </div>
          <div class="module-warp">
            <label for="update-tags" class="custom-label">
              {$_('tags')}
            </label>
            <InputTag
              bind:modelValue={tags}
              placeholder={$_('placeholderOfTags')}
              max={3}
              delimiter={','}
              id="update-tags"
              tabindex="0"
              maxlength="50"
              minlength="0"
              ariaLabel="tags" />
          </div>
        {/if}

        <div class="inline-flex w-full items-center justify-center pb-4">
          <hr class="my-6 h-px w-full border-0 bg-gray-200" />
          <span
            class="text-grey absolute left-1/2 -translate-x-1/2 bg-white px-3 text-center font-medium leading-5">
            {$_('lowFrequencyTip')}
          </span>
        </div>

        {#if items.asset_type === 'BANK_FIXED'}
          <!-- 银行定期字段 -->
          <div class="module-warp">
            <label for="update-principal" class="custom-label">
              {$_('principal')}
            </label>
            <input
              type="number"
              step="0.01"
              id="update-principal"
              bind:value={items.principal}
              class="custom-input"
              placeholder={$_('placeholderOfPrincipal')}
              required />
          </div>
          <div class="module-warp">
            <label for="update-interest-rate" class="custom-label">
              {$_('interestRate')} (%)
            </label>
            <input
              type="number"
              step="0.01"
              id="update-interest-rate"
              bind:value={items.interest_rate}
              class="custom-input"
              placeholder="3.50"
              required />
          </div>
          <div class="module-warp">
            <label for="update-start-date" class="custom-label">
              {$_('startDate')}
            </label>
            <input
              type="text"
              id="update-start-date"
              bind:value={items.start_date}
              class="custom-input"
              placeholder="YYYY-MM-DD"
              required />
          </div>
          <div class="module-warp">
            <label for="update-term-months" class="custom-label">
              {$_('termMonths')}
            </label>
            <div class="w-full">
              <CustomSelect
                options={TERM_MONTHS_OPTIONS}
                active={genTermMonthsActive(items.term_months)}
                listboxClass="w-full"
                on:selected={handleTermMonthsSelect} />
            </div>
          </div>
          <!-- 计算结果显示 -->
          <div class="module-warp rounded bg-gray-50 p-3">
            <div class="text-sm text-gray-600">
              <p>{$_('maturityDate')}: <span class="font-medium text-gray-900">{calculatedMaturityDate}</span></p>
              <p>{$_('expectedInterest')}: <span class="font-medium text-gray-900">{calculatedExpectedInterest}</span></p>
            </div>
          </div>
        {:else if items.asset_type === 'FUND' || items.asset_type === 'STOCK'}
          <!-- 基金/股票字段 -->
          <div class="module-warp">
            <label for="update-code" class="custom-label">
              {$_('code')}
            </label>
            <input
              type="text"
              id="update-code"
              bind:value={items.code}
              class="custom-input"
              placeholder={$_('placeholderOfCode')}
              required />
          </div>
          <div class="module-warp">
            <label for="update-shares" class="custom-label">
              {$_('shares')}
            </label>
            <input
              type="number"
              step="0.0001"
              id="update-shares"
              bind:value={items.shares}
              class="custom-input"
              placeholder={$_('placeholderOfShares')}
              required />
          </div>
          <div class="module-warp">
            <label for="update-nav" class="custom-label">
              {$_('nav')}
            </label>
            <input
              type="number"
              step="0.0001"
              id="update-nav"
              bind:value={items.nav}
              class="custom-input"
              placeholder={$_('placeholderOfNav')}
              required />
          </div>
          <!-- 计算结果显示 -->
          <div class="module-warp rounded bg-gray-50 p-3">
            <div class="text-sm text-gray-600">
              <p>{$_('calculatedAmount')}: <span class="font-medium text-gray-900">{calculatedAmount}</span></p>
            </div>
          </div>
        {:else}
          <!-- 通用资产金额字段 -->
          <div class="module-warp">
            <label for="update-amount" class="custom-label">
              {$_('amount')}
            </label>
            <input
              type="number"
              step="0.01"
              id="update-amount"
              bind:value={items.amount}
              class="custom-input"
              placeholder={$_('placeholderOfAmount')}
              required />
          </div>
        {/if}
        <div class="module-warp">
          <label for="update-datetime" class="custom-label">
            {$_('datetime')}
          </label>
          <div class="w-full">
            <input
              type="text"
              id="update-datetime"
              bind:value={items.datetime}
              class="custom-input"
              placeholder={$_('placeholderOfDate')}
              on:input={() => validateDatetimeInput(items)}
              required />
            {#if datetimeError}
              <p class="text-mark text-sm">{datetimeError}</p>
            {/if}
          </div>
        </div>
        <div class="module-warp">
          <label for="update-note" class="custom-label">
            {$_('remark')}
          </label>
          <input
            type="text"
            id="update-note"
            bind:value={items.note}
            class="custom-input"
            placeholder={$_('placeholderOfRemark')}
            required />
        </div>
      </div>
      <div class="flex items-center justify-center">
        <button type="button" on:click={onConfirmClick} class="regular-btn">{$_('confirm')}</button>
      </div>
    </div>
  </div>
</div>
