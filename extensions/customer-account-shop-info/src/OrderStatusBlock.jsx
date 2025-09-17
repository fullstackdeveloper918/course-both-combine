import {
  BlockStack,
  reactExtension,
  TextBlock,
  Banner,
  useApi,
  useShop,
  useCustomer
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <PromotionBanner />
);

function PromotionBanner() {
  const { i18n } = useApi();
  const shop = useShop();
  const customer = useCustomer();

  return (
    <Banner>
      <BlockStack inlineAlignment="center">
        <TextBlock>
          {i18n.translate("earnPoints")}
        </TextBlock>

        <BlockStack>
          {customer ? (
            Object.entries(customer).map(([key, value]) => (
              <TextBlock key={key}>
                {key}: {JSON.stringify(value)}
              </TextBlock>
            ))
          ) : (
            <TextBlock>No customer data available</TextBlock>
          )}
        </BlockStack>

        <TextBlock>
          {shop.name} ({shop.myshopifyDomain})
        </TextBlock>
      </BlockStack>
    </Banner>
  );
}