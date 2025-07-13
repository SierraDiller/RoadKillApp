const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow anonymous reports
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    location: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    animalType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    size: {
      type: DataTypes.ENUM('Small', 'Medium', 'Large'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'in-progress', 'resolved'),
      defaultValue: 'pending',
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sendUpdates: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    submittedToCityAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cityResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['location'],
        using: 'GIST',
      },
    ],
    hooks: {
      beforeCreate: (report) => {
        // Ensure location is in the correct format
        if (report.location && typeof report.location === 'object') {
          report.location = {
            type: 'Point',
            coordinates: [report.location.longitude, report.location.latitude],
          };
        }
      },
      beforeUpdate: (report) => {
        // Ensure location is in the correct format
        if (report.location && typeof report.location === 'object') {
          report.location = {
            type: 'Point',
            coordinates: [report.location.longitude, report.location.latitude],
          };
        }
      },
    },
  });

  Report.associate = (models) => {
    Report.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Instance methods
  Report.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Format location for API response
    if (values.location && values.location.coordinates) {
      values.location = {
        latitude: values.location.coordinates[1],
        longitude: values.location.coordinates[0],
      };
    }
    
    return values;
  };

  // Class methods
  Report.findNearby = function(latitude, longitude, radiusInMeters = 100) {
    return this.findAll({
      where: sequelize.literal(`
        ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusInMeters}
        )
      `),
      order: [['createdAt', 'DESC']],
    });
  };

  Report.findInOakRidge = function() {
    // Approximate Oak Ridge city limits polygon
    const oakRidgePolygon = [
      [-84.35, 35.95], // Southwest
      [-84.25, 35.95], // Southeast
      [-84.25, 36.05], // Northeast
      [-84.35, 36.05], // Northwest
      [-84.35, 35.95], // Close polygon
    ];

    return this.findAll({
      where: sequelize.literal(`
        ST_Contains(
          ST_GeomFromText('POLYGON((${oakRidgePolygon.map(coord => coord.join(' ')).join(',')}))', 4326),
          location
        )
      `),
      order: [['createdAt', 'DESC']],
    });
  };

  return Report;
}; 