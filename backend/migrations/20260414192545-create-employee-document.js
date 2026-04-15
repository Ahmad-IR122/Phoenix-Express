'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      document_type: {
        type: Sequelize.ENUM(
          'driving_license',
          'vehicle_license',
          'vehicle_insurance',
          'national_id'
        ),
        allowNull: false,
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('valid', 'expiring_soon', 'expired'),
        allowNull: false,
        defaultValue: 'valid',
      },
      verified_by_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_documents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_employee_documents_document_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_employee_documents_status";');
  },
};