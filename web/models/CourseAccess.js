import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CourseAccess extends Model {}

CourseAccess.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
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
    accessType: {
      type: DataTypes.ENUM("purchase", "subscription", "free"),
      defaultValue: "purchase",
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "revoked"),
      defaultValue: "active",
    },
    shopifyOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    canDownload: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    modelName: "CourseAccess",
    tableName: "course_access",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "course_id"],
      },
    ],
  }
);

export default CourseAccess;
