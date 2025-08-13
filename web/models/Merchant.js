import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Merchant extends Model {}

Merchant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    shopifyDomain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    shop: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopifyAccessToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        branding: {
          primaryColor: "#000000",
          secondaryColor: "#ffffff",
          font: "Arial",
          logoUrl: null,
        },
      },
    },

    // settings: {
    //   type: DataTypes.JSON,
    //   allowNull: true,
    //   defaultValue: {},
    // },
  },
  {
    sequelize,
    tableName: "merchants",
    timestamps: true,
  }
);

export default Merchant;

// streamSecureTokenApiKey
// streamApiKey
// streamLibraryId
