import { Sequelize } from "sequelize";
import { database } from "../config/config.js";

const sequelize = new Sequelize(
  database.name,
  database.user,
  database.password,
  {
    host: database.host,
    port: database.port,
    dialect: "mysql",
    logging: database.logging ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

try {
  await sequelize.authenticate();
  console.log("✅ Database connected successfully.");
} catch (err) {
  console.error("❌ Database connection error:", err);
}

export default sequelize;
