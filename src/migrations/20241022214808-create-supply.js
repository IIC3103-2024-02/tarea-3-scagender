'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Supplies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sku: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      minimum: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.bulkInsert('Supplies', [
      {
        sku: 'CAFEGRANO',
        status: 'NO',
        minimum: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'LECHEENTERA',
        status: 'NO',
        minimum: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'AZUCARSACHET',
        status: 'NO',
        minimum: 35,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'ENDULZANTESACHET',
        status: 'NO',
        minimum: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'VASOCAFE',
        status: 'NO',
        minimum: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'VASOCAFEDOBLE',
        status: 'NO',
        minimum: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sku: 'VASOCAFEEXPRESO',
        status: 'NO',
        minimum: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Supplies');
  }
};