import { createRoot } from "react-dom/client";
import App from "./App";
import { initI18n } from "./utils/i18nUtils";
import { BrowserRouter } from "react-router-dom";  // Import BrowserRouter

// Ensure that locales are loaded before rendering the app
initI18n().then(() => {
  const root = createRoot(document.getElementById("app"));
  
  // Wrap App with BrowserRouter here
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});




