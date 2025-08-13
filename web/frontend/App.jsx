import React from "react";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import { QueryProvider, PolarisProvider } from "./components";
import './index.css';

// Define the App component without `useNavigate` here
export default function App() {
  // const [loading, setLoading] = useState(false); // State to track loading
  const { t } = useTranslation();

  // Use useEffect to listen for location changes
  // useEffect(() => {
  //   setLoading(true);  // Set loading to true initially

  //   // Set a timeout to simulate a 5-second delay
  //   const timeoutId = setTimeout(() => {
  //     setLoading(false); // Set loading to false after 5 seconds
  //   }, 1000);  // 5000 ms = 5 seconds

  //   // Cleanup the timeout when the component unmounts or effect reruns
  //   return () => {
  //     clearTimeout(timeoutId); // Clean up timeout if the component is unmounted
  //   };
  // }, []);

  // Pages loaded dynamically
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });

  return (
    <PolarisProvider>
      {/* Loading Spinner */}
      {/* {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
        </div>
      )} */}

      <QueryProvider>
        <NavMenu>
          <a href="/" rel="Dashboard">
            {t("NavigationMenu.dashboard")}
          </a>
          <a href="/course-manager">Courses</a>
          <a href="/student-portal">Student Portal</a>
          {/*    <a href="/custom-settings">{t("NavigationMenu.custom_settings")}</a>
          <a href="/models">{t("NavigationMenu.models")}</a>
          <a href="/subscriptions">{t("NavigationMenu.subscriptions")}</a>
          <a href="/images">{t("NavigationMenu.images")}</a>
          <a href="/settings">{t("NavigationMenu.settings")}</a> */}
        </NavMenu>

        <Routes pages={pages} />
      </QueryProvider>
    </PolarisProvider>
  );
}

