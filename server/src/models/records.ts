import { DataTypes, Model } from 'sequelize'
import { sequelize } from './index'

export class Record extends Model {}

Record.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    modelName: 'Record',
    tableName: 'record',
    timestamps: false,
  },
)
