"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"

interface Bank {
    name: string
    code: string
}

interface PayoutSettings {
    account_type: "bank" | "mpesa"
    account_details: {
        bank_code?: string
        bank_name?: string
        account_number?: string
        phone_number?: string
    }
    is_verified: boolean
}

export function PayoutSettings() {
    const [accountType, setAccountType] = useState<"bank" | "mpesa">("bank")
    const [banks, setBanks] = useState<Bank[]>([])
    const [selectedBank, setSelectedBank] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [loading, setLoading] = useState(false)
    const [loadingBanks, setLoadingBanks] = useState(true)
    const [currentSettings, setCurrentSettings] = useState<PayoutSettings | null>(null)

    // Fetch banks on mount
    useEffect(() => {
        fetchBanks()
        fetchCurrentSettings()
    }, [])

    const fetchBanks = async () => {
        try {
            const response = await fetch("/api/seller/banks")
            const data = await response.json()

            if (data.success) {
                // Remove duplicate bank codes (Paystack API sometimes returns duplicates)
                const uniqueBanks = data.data.reduce((acc: Bank[], bank: Bank) => {
                    if (!acc.find(b => b.code === bank.code)) {
                        acc.push(bank)
                    }
                    return acc
                }, [])
                setBanks(uniqueBanks)
            }
        } catch (error) {
            console.error("Failed to fetch banks:", error)
        } finally {
            setLoadingBanks(false)
        }
    }

    const fetchCurrentSettings = async () => {
        try {
            const response = await fetch("/api/seller/payout-settings")
            const data = await response.json()

            if (data.success && data.data) {
                setCurrentSettings(data.data)
                setAccountType(data.data.account_type)

                if (data.data.account_type === "bank") {
                    setSelectedBank(data.data.account_details.bank_code || "")
                    setAccountNumber(data.data.account_details.account_number || "")
                } else {
                    setPhoneNumber(data.data.account_details.phone_number || "")
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error)
        }
    }

    const handleSave = async () => {
        // Validation
        if (accountType === "bank") {
            if (!selectedBank || !accountNumber) {
                toast.error("Please select a bank and enter account number")
                return
            }
        } else {
            if (!phoneNumber) {
                toast.error("Please enter M-Pesa phone number")
                return
            }

            // Validate phone format
            const phoneRegex = /^(?:254|\+254|0)?([71]\\d{8})$/
            if (!phoneRegex.test(phoneNumber)) {
                toast.error("Invalid phone number. Format: 0712345678 or 254712345678")
                return
            }
        }

        setLoading(true)

        try {
            const selectedBankData = banks.find((b) => b.code === selectedBank)

            const payload = {
                account_type: accountType,
                account_details:
                    accountType === "bank"
                        ? {
                            bank_code: selectedBank,
                            bank_name: selectedBankData?.name,
                            account_number: accountNumber,
                        }
                        : {
                            phone_number: phoneNumber,
                        },
            }

            const response = await fetch("/api/seller/payout-settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Payout settings saved successfully!")
                fetchCurrentSettings()
            } else {
                toast.error(data.error || "Failed to save payout settings")
            }
        } catch (error) {
            console.error("Save error:", error)
            toast.error("An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>
                    Configure where you want to receive your payouts
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current settings indicator */}
                {currentSettings?.is_verified && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                Account Verified
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                                {currentSettings.account_type === "bank"
                                    ? `${currentSettings.account_details.bank_name} - ${currentSettings.account_details.account_number}`
                                    : `M-Pesa - ${currentSettings.account_details.phone_number}`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Account type selection */}
                <div className="space-y-3">
                    <Label>Payout Method</Label>
                    <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as "bank" | "mpesa")}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bank" id="bank" />
                            <Label htmlFor="bank" className="cursor-pointer">
                                Bank Transfer
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mpesa" id="mpesa" />
                            <Label htmlFor="mpesa" className="cursor-pointer">
                                M-Pesa
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Bank transfer form */}
                {accountType === "bank" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-select">Bank Name</Label>
                            {loadingBanks ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading banks...
                                </div>
                            ) : (
                                <Select value={selectedBank} onValueChange={setSelectedBank}>
                                    <SelectTrigger id="bank-select">
                                        <SelectValue placeholder="Select your bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {banks.map((bank, index) => (
                                            <SelectItem key={`${bank.code}-${index}`} value={bank.code}>
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input
                                id="account-number"
                                placeholder="Enter account number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* M-Pesa form */}
                {accountType === "mpesa" && (
                    <div className="space-y-2">
                        <Label htmlFor="phone-number">M-Pesa Phone Number</Label>
                        <Input
                            id="phone-number"
                            placeholder="0712345678 or 254712345678"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter your Safaricom number registered with M-Pesa
                        </p>
                    </div>
                )}

                {/* Save button */}
                <Button onClick={handleSave} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Payout Details
                </Button>
            </CardContent>
        </Card>
    )
}
