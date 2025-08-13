import { Model, DataTypes } from'sequelize';
import sequelize from '../config/database.js';

class Progress extends Model {}

Progress.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started'
  },
  progress: {
    type: DataTypes.INTEGER, // percentage (0-100)
    defaultValue: 0
  },
  lastPosition: {
    type: DataTypes.INTEGER, // video position in seconds
    defaultValue: 0
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Progress',
  tableName: 'progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'lesson_id']
    }
  ]
});

export default Progress; 