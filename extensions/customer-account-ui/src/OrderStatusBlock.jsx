/* See the locales/en.default.json tab for the translation keys and values for this example */
import {
  useAuthenticatedAccountCustomer,
  useCustomer,
  useI18n,
  reactExtension,
} from "@shopify/ui-extensions-react/customer-account";
import { Banner, Link } from "@shopify/ui-extensions/customer-account";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <Extension />
);

function Extension() {
  const i18n = useI18n();
  const authenticatedCustomer = useAuthenticatedAccountCustomer();
  const orderStatusCustomer = useCustomer();
  console.log("authenticatedCustomer...", authenticatedCustomer);
  console.log("orderStatusCustomer...", orderStatusCustomer);

  if (
    authenticatedCustomer?.id &&
    orderStatusCustomer?.id?.endsWith(authenticatedCustomer?.id)
  ) {
    return (
      <Banner>
        <Link to={"extension:manageLoyaltyPoints/"}>Add Loyalty Points</Link>
      </Banner>
    );
  }
  return null;
}
