import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Course extends Model {}

Course.init(
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
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    thumbnailDestinationPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopifyProductId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    shopifyHandle: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "archived"),
      defaultValue: "draft",
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    totalLessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalDuration: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0,
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Colletionid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Course",
    tableName: "courses",
    timestamps: true,
  }
);

export default Course;
