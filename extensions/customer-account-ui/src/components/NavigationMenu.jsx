import {
  reactExtension,
  NavigationMenu,
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension("customer-account.navigation-menu.render", () => {
  return (
    <NavigationMenu
      items={[
        {
          id: "wishlists",
          label: "Wishlists",
          url: "/apps/customer-account-ui", // must match handle in toml
        },
      ]}
    />
  );
});
