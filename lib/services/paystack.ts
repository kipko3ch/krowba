// Paystack Payment Integration Service
// Documentation: https://paystack.com/docs/api

import crypto from "crypto"

interface PaystackResponse<T> {
    status: boolean
    message: string
    data: T
}

interface InitializePaymentData {
    authorization_url: string
    access_code: string
    reference: string
}

interface VerifyPaymentData {
    id: number
    status: "success" | "failed" | "pending" | "abandoned"
    reference: string
    amount: number
    currency: string
    channel: string
    customer: {
        id: number
        email: string
        customer_code: string
        phone?: string
    }
    authorization?: {
        authorization_code: string
        card_type: string
        last4: string
        bank: string
    }
    metadata: Record<string, string>
}

interface TransferRecipientData {
    active: boolean
    recipient_code: string
    name: string
    details: {
        account_number: string
        bank_code: string
        bank_name: string
    }
}

interface TransferData {
    reference: string
    integration: number
    domain: string
    amount: number
    currency: string
    source: string
    reason: string
    recipient: number
    status: string
    transfer_code: string
}

interface RefundData {
    transaction: {
        id: number
        reference: string
    }
    amount: number
    status: string
    refund_reference: string
}

interface BankData {
    name: string
    slug: string
    code: string
    country: string
    currency: string
    type: string
}

export class PaystackService {
    private secretKey: string
    private publicKey: string
    private baseUrl = "https://api.paystack.co"

    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || ""
        this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || ""

        if (!this.secretKey) {
            console.warn("[Paystack] No secret key configured - running in mock mode")
        }
    }

    private async request<T>(
        endpoint: string,
        method: "GET" | "POST" = "GET",
        body?: Record<string, unknown>
    ): Promise<PaystackResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        const result = await response.json()

        if (!response.ok) {
            console.error("[Paystack] API Error:", result)
            throw new Error(result.message || `Paystack API Error: ${response.status}`)
        }

        return result
    }

    // Initialize a payment transaction
    async initializePayment(params: {
        amount: number // in Kobo/cents (KES * 100)
        email: string
        reference?: string
        callback_url?: string
        metadata?: Record<string, string>
        channels?: ("card" | "bank" | "ussd" | "mobile_money" | "bank_transfer")[]
    }): Promise<{ success: boolean; data?: InitializePaymentData; error?: string }> {
        // Mock mode for development
        if (!this.secretKey) {
            const mockRef = `MOCK_${Date.now()}`
            return {
                success: true,
                data: {
                    authorization_url: `http://localhost:3000/pay/mock?ref=${mockRef}`,
                    access_code: "mock_access",
                    reference: mockRef,
                },
            }
        }

        try {
            const payload: Record<string, unknown> = {
                amount: params.amount,
                email: params.email,
                currency: "KES",
                reference: params.reference || `KRW_${Date.now()}`,
                callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
                metadata: params.metadata || {},
            }

            if (params.channels) {
                payload.channels = params.channels
            }

            const response = await this.request<InitializePaymentData>(
                "/transaction/initialize",
                "POST",
                payload
            )

            return {
                success: response.status,
                data: response.data,
            }
        } catch (error) {
            console.error("[Paystack] Initialize payment error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Payment initialization failed",
            }
        }
    }

    // Verify a payment transaction
    async verifyPayment(reference: string): Promise<{
        success: boolean
        data?: VerifyPaymentData
        error?: string
    }> {
        // Mock mode
        if (!this.secretKey) {
            return {
                success: true,
                data: {
                    id: 12345,
                    status: "success",
                    reference,
                    amount: 100000,
                    currency: "KES",
                    channel: "card",
                    customer: {
                        id: 1,
                        email: "test@example.com",
                        customer_code: "CUS_mock",
                    },
                    metadata: {},
                },
            }
        }

        try {
            const response = await this.request<VerifyPaymentData>(
                `/transaction/verify/${reference}`
            )

            return {
                success: response.status && response.data.status === "success",
                data: response.data,
            }
        } catch (error) {
            console.error("[Paystack] Verify payment error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Payment verification failed",
            }
        }
    }

    // List available banks
    async listBanks(country = "kenya"): Promise<BankData[]> {
        if (!this.secretKey) return []

        try {
            const response = await this.request<BankData[]>(`/bank?country=${country}`)
            return response.data || []
        } catch (error) {
            console.error("[Paystack] List banks error:", error)
            return []
        }
    }

    // Create a transfer recipient (for payouts)
    async createTransferRecipient(params: {
        type: "mobile_money" | "nuban"
        name: string
        account_number: string
        bank_code: string
        currency?: string
    }): Promise<{ success: boolean; data?: TransferRecipientData; error?: string }> {
        if (!this.secretKey) {
            return {
                success: true,
                data: {
                    active: true,
                    recipient_code: "RCP_mock_123",
                    name: params.name,
                    details: {
                        account_number: params.account_number,
                        bank_code: params.bank_code,
                        bank_name: "Mock Bank",
                    },
                },
            }
        }

        try {
            const response = await this.request<TransferRecipientData>(
                "/transferrecipient",
                "POST",
                {
                    type: params.type,
                    name: params.name,
                    account_number: params.account_number,
                    bank_code: params.bank_code,
                    currency: params.currency || "KES",
                }
            )

            return { success: response.status, data: response.data }
        } catch (error) {
            console.error("[Paystack] Create recipient error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create recipient",
            }
        }
    }

    // Initiate a transfer (payout to seller)
    async initiateTransfer(params: {
        amount: number // in Kobo (KES * 100)
        recipient: string // recipient_code
        reason?: string
        reference?: string
    }): Promise<{ success: boolean; data?: TransferData; error?: string }> {
        if (!this.secretKey) {
            return {
                success: true,
                data: {
                    reference: params.reference || `TRF_mock_${Date.now()}`,
                    integration: 12345,
                    domain: "test",
                    amount: params.amount,
                    currency: "KES",
                    source: "balance",
                    reason: params.reason || "Krowba Payout",
                    recipient: 1,
                    status: "success",
                    transfer_code: "TRF_mock",
                },
            }
        }

        try {
            const response = await this.request<TransferData>("/transfer", "POST", {
                source: "balance",
                amount: params.amount,
                recipient: params.recipient,
                reason: params.reason || "Krowba Payout",
                reference: params.reference,
            })

            return { success: response.status, data: response.data }
        } catch (error) {
            console.error("[Paystack] Transfer error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Transfer failed",
            }
        }
    }

    // Initiate a refund
    async initiateRefund(params: {
        transaction: string // transaction reference
        amount?: number // partial refund amount in Kobo
        reason?: string
    }): Promise<{ success: boolean; data?: RefundData; error?: string }> {
        if (!this.secretKey) {
            return {
                success: true,
                data: {
                    transaction: { id: 1, reference: params.transaction },
                    amount: params.amount || 0,
                    status: "processed",
                    refund_reference: `REF_mock_${Date.now()}`,
                },
            }
        }

        try {
            const response = await this.request<RefundData>("/refund", "POST", {
                transaction: params.transaction,
                amount: params.amount,
                merchant_note: params.reason || "Krowba Refund",
            })

            return { success: response.status, data: response.data }
        } catch (error) {
            console.error("[Paystack] Refund error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Refund failed",
            }
        }
    }

    // Verify webhook signature
    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.secretKey) return true // Skip in dev

        const hash = crypto
            .createHmac("sha512", this.secretKey)
            .update(payload)
            .digest("hex")

        return hash === signature
    }

    // Format phone number for M-Pesa (Paystack mobile_money)
    formatPhoneNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, "")

        if (cleaned.startsWith("0")) {
            cleaned = "254" + cleaned.slice(1)
        } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
            cleaned = "254" + cleaned
        } else if (cleaned.startsWith("+254")) {
            cleaned = cleaned.slice(1)
        }

        return cleaned
    }

    // Get public key for frontend
    getPublicKey(): string {
        return this.publicKey
    }
}

export const paystack = new PaystackService()
