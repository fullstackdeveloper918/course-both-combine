import { Sequelize } from 'sequelize';
import { database } from '../config/config.js';
const sequelize = new Sequelize(
  database.name,
  database.user,
  database.password,
  {
    host: database.host, // e.g. "mysql-xxxxx.render.com"
    port: database.port ?? 3306,
    dialect: 'mysql',
    logging: database.logging ? console.log : false,
    define: { timestamps: true, underscored: true },
    pool: { max: 5, min: 0, acquire: 60000, idle: 10000 },
    dialectOptions: {
      connectTimeout: 30000,
      ssl: {
        require: true,
        rejectUnauthorized: false, // temporary; if Render provides CA cert, replace with that
      },
    },
  }
);
try {
  await sequelize.authenticate();
  console.log(':white_check_mark: Database connected successfully.');
} catch (err) {
  console.error(':x: Database connection error:', err);
}
export default sequelize;
// import { Sequelize } from "sequelize";
// import { database } from "../config/config.js";
// const sequelize = new Sequelize(
//   database.name,
//   database.user,
//   database.password,
//   {
//     host: database.host,
//     port: database.port,
//     dialect: "mysql",
//     logging: database.logging ? console.log : false,
//     define: {
//       timestamps: true,
//       underscored: true,
//     },
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//   }
// );
// try {
//   await sequelize.authenticate();
//   console.log(":white_check_mark: Database connected successfully.");
// } catch (err) {
//   console.error(":x: Database connection error:", err);
// }
// export default sequelize;