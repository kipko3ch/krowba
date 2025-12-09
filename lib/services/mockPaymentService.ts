// Mock Payment Service
// Simulates payment processing without live payment gateways

import type { MockPaymentRequest, MockPaymentResponse, PaymentMethod } from "@/types"

/**
 * Generate a random delay between min and max milliseconds
 */
const randomDelay = (min: number, max: number): Promise<void> => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Generate a mock transaction reference
 */
const generateReference = (method: PaymentMethod): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const prefix = method === "card" ? "MOCK_CARD" : "MOCK_MPESA"
    return `${prefix}_${timestamp}_${random}`
}

/**
 * Validate card number (basic Luhn algorithm check)
 */
const isValidCardNumber = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\s/g, "")
    if (!/^\d{16}$/.test(digits)) return false

    // Test cards that always succeed
    if (digits === "4242424242424242") return true
    // Test cards that always fail
    if (digits === "4000000000000002") return false

    // Basic Luhn algorithm
    let sum = 0
    let isEven = false
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i])
        if (isEven) {
            digit *= 2
            if (digit > 9) digit -= 9
        }
        sum += digit
        isEven = !isEven
    }
    return sum % 10 === 0
}

/**
 * Validate phone number (Kenyan format)
 */
const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, "")
    return /^(07|01)\d{8}$/.test(cleaned) || /^(254)\d{9}$/.test(cleaned)
}

export class MockPaymentService {
    /**
     * Simulate card payment processing
     * Success rate: 80% for valid cards
     */
    async processCardPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
        // Validate card number
        if (!request.card_number || !isValidCardNumber(request.card_number)) {
            return {
                success: false,
                reference: generateReference("card"),
                status: "failed",
                message: "Invalid card number. Try 4242 4242 4242 4242 for success.",
            }
        }

        // Simulate processing delay (500ms - 2000ms)
        await randomDelay(500, 2000)

        const reference = generateReference("card")

        // Special test card for guaranteed decline
        if (request.card_number.replace(/\s/g, "") === "4000000000000002") {
            return {
                success: false,
                reference,
                status: "failed",
                message: "Card declined by issuer. Insufficient funds.",
            }
        }

        // 80% success rate for other valid cards
        const shouldSucceed = Math.random() < 0.8

        if (shouldSucceed) {
            return {
                success: true,
                reference,
                status: "completed",
                message: "Payment successful! Funds locked in escrow.",
            }
        } else {
            const failureReasons = [
                "Card declined - Contact your bank",
                "Insufficient funds",
                "Transaction blocked for security reasons",
                "Card expired",
            ]
            return {
                success: false,
                reference,
                status: "failed",
                message: failureReasons[Math.floor(Math.random() * failureReasons.length)],
            }
        }
    }

    /**
     * Simulate mobile payment processing (MPesa-style)
     * Success rate: 85%
     */
    async processMobilePayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
        // Validate phone number
        if (!isValidPhoneNumber(request.buyer_phone)) {
            return {
                success: false,
                reference: generateReference("mobile"),
                status: "failed",
                message: "Invalid phone number. Use format: 07XX XXX XXX",
            }
        }

        // Simulate STK push delay (1000ms - 3000ms)
        await randomDelay(1000, 3000)

        const reference = generateReference("mobile")

        // 85% success rate
        const shouldSucceed = Math.random() < 0.85

        if (shouldSucceed) {
            return {
                success: true,
                reference,
                status: "completed",
                message: "Payment received! Funds locked in escrow.",
            }
        } else {
            const failureReasons = [
                "Payment cancelled by user",
                "Transaction timeout - No response from phone",
                "Insufficient balance in M-Pesa account",
                "M-Pesa service temporarily unavailable",
            ]
            return {
                success: false,
                reference,
                status: "failed",
                message: failureReasons[Math.floor(Math.random() * failureReasons.length)],
            }
        }
    }

    /**
     * Process payment based on method
     */
    async processPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
        if (request.payment_method === "card") {
            return this.processCardPayment(request)
        } else {
            return this.processMobilePayment(request)
        }
    }

    /**
     * Get payment status (for polling)
     */
    async getPaymentStatus(reference: string): Promise<MockPaymentResponse> {
        await randomDelay(200, 500)

        // Parse reference to determine status
        if (reference.includes("MOCK_CARD") || reference.includes("MOCK_MPESA")) {
            return {
                success: true,
                reference,
                status: "completed",
                message: "Payment completed successfully",
            }
        }

        return {
            success: false,
            reference,
            status: "failed",
            message: "Transaction not found",
        }
    }
}

export const mockPaymentService = new MockPaymentService()
