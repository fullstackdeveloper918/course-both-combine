import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class File extends Model {}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("video", "pdf", "zip", "image", "other", "png"),
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER, // in bytes
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "lessons",
        key: "id",
      },
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "courses",
        key: "id",
      },
    },
    isDownloadable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    storageProvider: {
      type: DataTypes.ENUM("s3", "backblaze", "bunny"),
      defaultValue: "bunny",
    },
    bucket: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    key: {
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
    modelName: "File",
    tableName: "files",
    timestamps: true,
  }
);

export default File;
