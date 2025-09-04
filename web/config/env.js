// Environment configuration
const config = {
  development: {
    APP_EMAIL: process.env.APP_EMAIL || "your-app@gmail.com",
    APP_EMAIL_PASSWORD: process.env.APP_EMAIL_PASSWORD || "your-app-password",
    NODE_ENV: "development",
  },
  production: {
    APP_EMAIL: process.env.APP_EMAIL,
    APP_EMAIL_PASSWORD: process.env.APP_EMAIL_PASSWORD,
    NODE_ENV: "production",
  },
};
// Get current environment
const currentEnv = "production";
// Export environment variables
const env = config[currentEnv];
export default env;