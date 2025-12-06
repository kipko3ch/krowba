// PayHero M-Pesa Integration Service
// Documentation: https://payhero.co.ke/docs

interface STKPushRequest {
  amount: number
  phone_number: string
  channel_id: string
  external_reference: string
  callback_url: string
  network_code?: string
  description?: string
}

interface STKPushResponse {
  success: boolean
  reference?: string
  status?: string
  error?: string
}

interface PaymentStatusResponse {
  success: boolean
  status: "QUEUED" | "SUCCESS" | "FAILED" | "PENDING"
  amount?: number
  phone_number?: string
  provider_reference?: string
}

export class PayHeroService {
  private apiUsername: string
  private apiPassword: string
  private channelId: string
  private baseUrl = "https://backend.payhero.co.ke/api/v2"

  constructor() {
    this.apiUsername = process.env.PAYHERO_API_USERNAME || ""
    this.apiPassword = process.env.PAYHERO_API_PASSWORD || ""
    this.channelId = process.env.PAYHERO_CHANNEL_ID || ""
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: Record<string, unknown>,
  ): Promise<T> {
    const auth = Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString("base64")

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`PayHero API Error: ${error}`)
    }

    return response.json()
  }

  // Format phone number to 254XXXXXXXXX format
  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "")

    // Handle different formats
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1)
    } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
      cleaned = "254" + cleaned
    } else if (cleaned.startsWith("+254")) {
      cleaned = cleaned.slice(1)
    }

    return cleaned
  }

  // Initiate STK Push (M-Pesa payment prompt)
  async initiateSTKPush(params: {
    amount: number
    phone: string
    reference: string
    description?: string
  }): Promise<STKPushResponse> {
    // If no API credentials configured, return mock response for development
    if (!this.apiUsername || !this.channelId) {
      console.log("[PayHero] Mock mode - no API credentials configured")
      return {
        success: true,
        reference: `MOCK_${Date.now()}`,
        status: "QUEUED",
      }
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payhero`

    const payload: STKPushRequest = {
      amount: params.amount,
      phone_number: this.formatPhoneNumber(params.phone),
      channel_id: this.channelId,
      external_reference: params.reference,
      callback_url: callbackUrl,
      network_code: "63902", // Safaricom
      description: params.description || "Krowba Payment",
    }

    try {
      const response = await this.request<{
        success: boolean
        reference: string
        status: string
      }>("/payments", "POST", payload)

      return {
        success: response.success,
        reference: response.reference,
        status: response.status,
      }
    } catch (error) {
      console.error("[PayHero] STK Push error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment initiation failed",
      }
    }
  }

  // Check payment status
  async getPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    // Mock mode
    if (!this.apiUsername) {
      return {
        success: true,
        status: "SUCCESS",
        amount: 1000,
        phone_number: "254712345678",
      }
    }

    try {
      const response = await this.request<{
        success: boolean
        status: string
        amount: number
        phone_number: string
        provider_reference: string
      }>(`/payments/${reference}`)

      return {
        success: response.success,
        status: response.status as PaymentStatusResponse["status"],
        amount: response.amount,
        phone_number: response.phone_number,
        provider_reference: response.provider_reference,
      }
    } catch (error) {
      console.error("[PayHero] Status check error:", error)
      return {
        success: false,
        status: "PENDING",
      }
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.PAYHERO_WEBHOOK_SECRET
    if (!webhookSecret) return true // Skip verification in dev

    const crypto = require("crypto")
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex")

    return signature === expectedSignature
  }
}

export const payhero = new PayHeroService()
