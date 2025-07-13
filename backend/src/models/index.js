const { Sequelize } = require('sequelize');
const User = require('./User');
const Report = require('./Report');
const CityContact = require('./CityContact');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'roadkill_reporter',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

// Initialize models
const models = {
  User: User(sequelize, Sequelize),
  Report: Report(sequelize, Sequelize),
  CityContact: CityContact(sequelize, Sequelize),
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models
}; 