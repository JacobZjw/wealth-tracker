import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { sequelize } from './index'

interface AssetAttributes {
  type: string
  alias: string | null
  amount: number
  note: string | null
  risk: string
  liquidity: string
  tags: string | null
  currency: string
  datetime: string
  created: Date | null
  updated: Date
  asset_type: string
  principal: number | null
  interest_rate: number | null
  start_date: string | null
  term_months: number | null
  maturity_date: string | null
  expected_interest: number | null
  shares: number | null
  nav: number | null
  parent_id: string | null
  code: string | null
}

export class Assets extends Model<InferAttributes<Assets>, InferCreationAttributes<Assets>> implements AssetAttributes {
  declare type: string
  declare alias: CreationOptional<string>
  declare amount: number
  declare note: CreationOptional<string>
  declare risk: CreationOptional<string>
  declare liquidity: CreationOptional<string>
  declare tags: CreationOptional<string>
  declare currency: string
  declare datetime: string
  declare created: CreationOptional<Date>
  declare updated: Date
  declare asset_type: CreationOptional<string>
  declare principal: CreationOptional<number>
  declare interest_rate: CreationOptional<number>
  declare start_date: CreationOptional<string>
  declare term_months: CreationOptional<number>
  declare maturity_date: CreationOptional<string>
  declare expected_interest: CreationOptional<number>
  declare shares: CreationOptional<number>
  declare nav: CreationOptional<number>
  declare parent_id: CreationOptional<string>
  declare code: CreationOptional<string>
}

Assets.init(
  {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    alias: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    risk: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'LOW',
    },
    liquidity: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'GOOD',
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    currency: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // 资产类型：GENERIC(通用)、BANK_FIXED(银行定期)、FUND(基金)、STOCK(股票)
    asset_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GENERIC',
    },
    // 银行定期专用字段
    principal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    term_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maturity_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expected_interest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    // 基金/股票专用字段
    shares: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    nav: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    // 子账户相关字段
    parent_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Assets',
    tableName: 'assets',
    timestamps: false,
  },
)
