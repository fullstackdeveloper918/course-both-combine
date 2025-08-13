"use client"

import { Badge } from "../components/ui/badge"

import {
  Card,
  Page,
  Layout,
  Form,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Stack,
  TextContainer,
  DisplayText,
  Banner,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
// import { SaveMinor, ResetMinor } from "@shopify/polaris-icons"

export default function Settings() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    storeName: "",
    contactEmail: "",
    apiKey: "",
    defaultModel: "",
    enableNotifications: true,
    autoApproveImages: false,
    maxImagesPerCustomer: 5,
    webhookUrl: "",
    customDomain: "",
    brandingEnabled: true,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const modelOptions = [
    { label: "Qubico/flux1-dev", value: "Qubico/flux1-dev" },
    { label: "Qubico/flux1-dev-hiphop", value: "Qubico/flux1-dev-hiphop" },
    { label: "Qubico/flux1-dev-bridal", value: "Qubico/flux1-dev-bridal" },
    { label: "Qubico/flux1-dev-minimal", value: "Qubico/flux1-dev-minimal" },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Replace with actual API call
      const mockSettings = {
        storeName: "My Jewelry Store",
        contactEmail: "contact@myjewelrystore.com",
        apiKey: "sk-1234567890abcdef",
        defaultModel: "Qubico/flux1-dev",
        enableNotifications: true,
        autoApproveImages: false,
        maxImagesPerCustomer: 5,
        webhookUrl: "https://mystore.com/webhooks/jewelry-ai",
        customDomain: "jewelry.mystore.com",
        brandingEnabled: true,
      }
      setSettings(mockSettings)
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    fetchSettings()
  }

  const handleChange = (field) => (value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Page
      title={t("settings.heading")}
      primaryAction={{
        content: "Save Settings",
      
        onAction: handleSubmit,
        loading: loading,
      }}
      secondaryActions={[
        {
          content: "Reset",
          onAction: handleReset,
        },
      ]}
    >
      <TitleBar title={t("settings.title")} />

      <Layout>
        {saved && (
          <Layout.Section>
            <Banner status="success" onDismiss={() => setSaved(false)}>
              Settings saved successfully!
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card title="Store Information" sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="Store Name"
                  value={settings.storeName}
                  onChange={handleChange("storeName")}
                  placeholder="Your jewelry store name"
                  autoComplete="off"
                />

                <TextField
                  label="Contact Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={handleChange("contactEmail")}
                  placeholder="contact@yourstore.com"
                  helpText="This email will be used for customer inquiries"
                  autoComplete="off"
                />

                <TextField
                  label="Custom Domain"
                  value={settings.customDomain}
                  onChange={handleChange("customDomain")}
                  placeholder="jewelry.yourstore.com"
                  helpText="Optional: Custom domain for your jewelry design page"
                  autoComplete="off"
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="AI Configuration" sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  label="AI API Key"
                  type="password"
                  value={settings.apiKey}
                  onChange={handleChange("apiKey")}
                  placeholder="sk-1234567890abcdef"
                  helpText="Your AI service provider API key"
                  autoComplete="off"
                />

                <Select
                  label="Default AI Model"
                  options={modelOptions}
                  value={settings.defaultModel}
                  onChange={handleChange("defaultModel")}
                  helpText="The default model to use when no specific category is selected"
                />

                <TextField
                  label="Max Images Per Customer"
                  type="number"
                  value={settings.maxImagesPerCustomer.toString()}
                  onChange={(value) => handleChange("maxImagesPerCustomer")(Number.parseInt(value) || 5)}
                  helpText="Maximum number of images a customer can generate per session"
                  autoComplete="off"
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Notifications & Automation" sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <Checkbox
                  label="Enable email notifications"
                  checked={settings.enableNotifications}
                  onChange={handleChange("enableNotifications")}
                  helpText="Receive email notifications when new leads are generated"
                />

                <Checkbox
                  label="Auto-approve generated images"
                  checked={settings.autoApproveImages}
                  onChange={handleChange("autoApproveImages")}
                  helpText="Automatically approve AI-generated images without manual review"
                />

                <Checkbox
                  label="Enable custom branding"
                  checked={settings.brandingEnabled}
                  onChange={handleChange("brandingEnabled")}
                  helpText="Show your store branding on the jewelry design page"
                />

                <TextField
                  label="Webhook URL"
                  value={settings.webhookUrl}
                  onChange={handleChange("webhookUrl")}
                  placeholder="https://yourstore.com/webhooks/jewelry-ai"
                  helpText="Optional: Webhook URL to receive real-time notifications"
                  autoComplete="off"
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Integration Status" sectioned>
            <Stack vertical spacing="loose">
              <Stack distribution="equalSpacing" alignment="center">
                <TextContainer>
                  <DisplayText size="small">Shopify Integration</DisplayText>
                  <Text color="subdued">Connected and active</Text>
                </TextContainer>
                <Badge status="success">Connected</Badge>
              </Stack>

              <Stack distribution="equalSpacing" alignment="center">
                <TextContainer>
                  <DisplayText size="small">AI Service</DisplayText>
                  <Text color="subdued">API connection verified</Text>
                </TextContainer>
                <Badge status="success">Active</Badge>
              </Stack>

              <Stack distribution="equalSpacing" alignment="center">
                <TextContainer>
                  <DisplayText size="small">Payment Processing</DisplayText>
                  <Text color="subdued">Subscription active</Text>
                </TextContainer>
                <Badge status="success">Active</Badge>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
