import { Sequelize } from 'sequelize';
import { database } from '../config/config.js';

const sequelize = new Sequelize(
  database.name,
  database.user,
  database.password,
  {
    host: database.host,                // must be an external hostname/IP in Render, never 127.0.0.1 [13]
    port: database.port ?? 3306,
    dialect: 'mysql',
    logging: database.logging ? console.log : false,
    define: { timestamps: true, underscored: true },
    pool: { max: 5, min: 0, acquire: 60000, idle: 10000 }, // give more time to obtain a connection [14]
    dialectOptions: {
      connectTimeout: 30000,           // ms to establish the initial TCP connection [2][3]
      // ssl: {
      //   ca: process.env.MYSQL_CA,    // if provider requires SSL, provide CA/cert/key here
      //   cert: process.env.MYSQL_CERT,
      //   key: process.env.MYSQL_KEY,
      //   rejectUnauthorized: true     // avoid setting false unless only for temporary tests [6]
      // }
    },
  }
);

try {
  await sequelize.authenticate();
  console.log('✅ Database connected successfully.');
} catch (err) {
  console.error('❌ Database connection error:', err);
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
//   console.log("✅ Database connected successfully.");
// } catch (err) {
//   console.error("❌ Database connection error:", err);
// }

// export default sequelize;
