import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Lesson extends Model {}

Lesson.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processingStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0,
    },

    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "modules",
        key: "id",
      },
    },

    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "courses",
        key: "id",
      },
    },

    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: true, // make sure to set allowNull to false
      references: {
        model: "merchants",
        key: "id",
      },
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    libaryId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    videoId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // videoDuration: {
    //   type: DataTypes.INTEGER, // in seconds
    //   defaultValue: 0,
    // },
    isPreview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    status: {
      type: DataTypes.ENUM("draft", "published", "archived", "processing"),
      defaultValue: "draft",
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleteFlag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Lesson",
    tableName: "lessons",
    timestamps: true,
  }
);

export default Lesson;
