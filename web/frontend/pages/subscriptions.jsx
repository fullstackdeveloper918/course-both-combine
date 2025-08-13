"use client"

import {
  Card,
  Page,
  Layout,
  DataTable,
  Button,
  Badge,
  Stack,
  EmptyState,
  TextContainer,
  DisplayText,
  ProgressBar,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
// import { CreditCardMajor } from "@shopify/polaris-icons"

export default function Subscriptions() {
  const { t } = useTranslation()
  const [subscription, setSubscription] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionData()
  }, [])


const fetchSubscriptionData = async () => {
  setLoading(true)
  try {
    // Set dummy subscription data
    const mockSubscription = {
      id: "sub_123456",
      plan: "Professional",
      status: "active",
      currentPeriodStart: "2024-01-01T00:00:00Z",
      currentPeriodEnd: "2024-02-01T00:00:00Z",
      amount: 49.99,
      currency: "USD",
      interval: "month",
      nextBillingDate: "2024-02-01T00:00:00Z",
    }

    const mockPaymentHistory = [
      {
        id: "inv_001",
        date: "2024-01-01T00:00:00Z",
        amount: 49.99,
        status: "paid",
        description: "Professional Plan - January 2024",
      },
      {
        id: "inv_002",
        date: "2023-12-01T00:00:00Z",
        amount: 49.99,
        status: "paid",
        description: "Professional Plan - December 2023",
      },
      {
        id: "inv_003",
        date: "2023-11-01T00:00:00Z",
        amount: 49.99,
        status: "paid",
        description: "Professional Plan - November 2023",
      },
    ]

    const mockUsage = {
      imagesGenerated: 156,
      imagesLimit: 500,
      leadsCollected: 42,
      leadsLimit: 1000,
      modelsActive: 8,
      modelsLimit: 20,
    }

    // Set all the mock data
    setSubscription(mockSubscription)
    setPaymentHistory(mockPaymentHistory)
    setUsage(mockUsage)
  } catch (error) {
    console.error("Error loading dummy data:", error)
  } finally {
    setLoading(false)
  }
}


  // const fetchSubscriptionData = async () => {
  //   setLoading(true)
  //   try {
  //     // Replace with actual API calls
  //     const mockSubscription = {
  //       id: "sub_123456",
  //       plan: "Professional",
  //       status: "active",
  //       currentPeriodStart: "2024-01-01T00:00:00Z",
  //       currentPeriodEnd: "2024-02-01T00:00:00Z",
  //       amount: 49.99,
  //       currency: "USD",
  //       interval: "month",
  //       nextBillingDate: "2024-02-01T00:00:00Z",
  //     }

  //     const mockPaymentHistory = [
  //       {
  //         id: "inv_001",
  //         date: "2024-01-01T00:00:00Z",
  //         amount: 49.99,
  //         status: "paid",
  //         description: "Professional Plan - January 2024",
  //       },
  //       {
  //         id: "inv_002",
  //         date: "2023-12-01T00:00:00Z",
  //         amount: 49.99,
  //         status: "paid",
  //         description: "Professional Plan - December 2023",
  //       },
  //       {
  //         id: "inv_003",
  //         date: "2023-11-01T00:00:00Z",
  //         amount: 49.99,
  //         status: "paid",
  //         description: "Professional Plan - November 2023",
  //       },
  //     ]

  //     const mockUsage = {
  //       imagesGenerated: 156,
  //       imagesLimit: 500,
  //       leadsCollected: 42,
  //       leadsLimit: 1000,
  //       modelsActive: 8,
  //       modelsLimit: 20,
  //     }

  //     setSubscription(mockSubscription)
  //     setPaymentHistory(mockPaymentHistory)
  //     setUsage(mockUsage)
  //   } catch (error) {
  //     console.error("Error fetching subscription data:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { status: "success", label: "Active" },
      past_due: { status: "critical", label: "Past Due" },
      canceled: { status: "critical", label: "Canceled" },
      trialing: { status: "info", label: "Trial" },
      paid: { status: "success", label: "Paid" },
      failed: { status: "critical", label: "Failed" },
      pending: { status: "attention", label: "Pending" },
    }
    const config = statusMap[status] || { status: "info", label: status }
    return <Badge status={config.status}>{config.label}</Badge>
  }

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getUsagePercentage = (used, limit) => {
    return Math.round((used / limit) * 100)
  }

  const paymentRows = paymentHistory.map((payment) => [
    formatDate(payment.date),
    payment.description,
    formatCurrency(payment.amount),
    getStatusBadge(payment.status),
  ])

  if (loading) {
    return (
      <Page title="Loading...">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: "center", padding: "2rem" }}>Loading subscription data...</div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }


  console.log(subscription,"Subscription")

  return (
    <Page
      title={t("subscriptions.heading")}
      primaryAction={{
        content: "Manage Billing",
        // icon: CreditCardMajor,
        onAction: () => {
          // Redirect to billing portal
          console.log("Redirecting to billing portal...")
        },
      }}
    >
      <TitleBar title={t("subscriptions.title")} />

      <Layout>
        {subscription ? (
          <>
            <Layout.Section>
              <Card title="Current Subscription" sectioned>
                <Stack distribution="equalSpacing" alignment="center">
                  <Stack vertical spacing="tight">
                    <DisplayText size="medium">{subscription.plan} Plan</DisplayText>
                    <Text>
                      {formatCurrency(subscription.amount)} / {subscription.interval}
                    </Text>
                    <Text color="subdued">Next billing: {formatDate(subscription.nextBillingDate)}</Text>
                  </Stack>
                  <Stack vertical spacing="tight" alignment="center">
                    {getStatusBadge(subscription.status)}
                    <Button size="slim">Change Plan</Button>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card title="Usage This Month" sectioned>
                <Stack vertical spacing="loose">
                  <Stack distribution="equalSpacing" alignment="center">
                    <TextContainer>
                      <Text variant="headingMd">Images Generated</Text>
                      <Text>
                        {usage.imagesGenerated} / {usage.imagesLimit}
                      </Text>
                    </TextContainer>
                    <div style={{ width: "200px" }}>
                      <ProgressBar
                        progress={getUsagePercentage(usage.imagesGenerated, usage.imagesLimit)}
                        size="small"
                      />
                    </div>
                  </Stack>

                  <Stack distribution="equalSpacing" alignment="center">
                    <TextContainer>
                      <Text variant="headingMd">Leads Collected</Text>
                      <Text>
                        {usage.leadsCollected} / {usage.leadsLimit}
                      </Text>
                    </TextContainer>
                    <div style={{ width: "200px" }}>
                      <ProgressBar progress={getUsagePercentage(usage.leadsCollected, usage.leadsLimit)} size="small" />
                    </div>
                  </Stack>

                  <Stack distribution="equalSpacing" alignment="center">
                    <TextContainer>
                      <Text variant="headingMd">Active Models</Text>
                      <Text>
                        {usage.modelsActive} / {usage.modelsLimit}
                      </Text>
                    </TextContainer>
                    <div style={{ width: "200px" }}>
                      <ProgressBar progress={getUsagePercentage(usage.modelsActive, usage.modelsLimit)} size="small" />
                    </div>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card title="Payment History" sectioned>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Date", "Description", "Amount", "Status"]}
                  rows={paymentRows}
                />
              </Card>
            </Layout.Section>
          </>
        ) : (
          <Layout.Section>
            <EmptyState
              heading="No active subscription"
              action={{
                content: "Choose a Plan",
                onAction: () => {
                  // Redirect to pricing page
                  console.log("Redirecting to pricing...")
                },
              }}
              image="/placeholder.svg?height=200&width=200"
            >
              <p>Subscribe to start generating AI jewelry designs and collecting customer leads.</p>
            </EmptyState>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  )
}
