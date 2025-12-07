"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { toast } from "sonner"
import { Loader2, Truck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ShipOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [link, setLink] = useState<any>(null)
    const [proofImages, setProofImages] = useState<string[]>([])
    const [courier, setCourier] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [notes, setNotes] = useState("")
    const [aiAnalysis, setAiAnalysis] = useState<any>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    useEffect(() => {
        const fetchLink = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("krowba_links")
                .select("*")
                .eq("id", id)
                .single()

            if (error || !data) {
                toast.error("Order not found")
                router.push("/dashboard/links")
                return
            }
            setLink(data)
            setIsLoading(false)
        }
        fetchLink()
    }, [id, router])

    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return

        setIsAnalyzing(true)
        const uploadedUrls: string[] = []

        try {
            for (const file of files) {
                const signatureRes = await fetch("/api/upload/signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: "shipping_proof" }),
                })

                if (!signatureRes.ok) throw new Error("Failed to get upload signature")

                const { signature, timestamp, cloudName, apiKey, uploadPreset } = await signatureRes.json()

                const formData = new FormData()
                formData.append("file", file)
                formData.append("signature", signature)
                formData.append("timestamp", timestamp.toString())
                formData.append("api_key", apiKey)
                formData.append("upload_preset", uploadPreset)
                formData.append("folder", "krowba/shipping_proof")

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData,
                })

                if (!uploadRes.ok) throw new Error("Failed to upload image")

                const uploadData = await uploadRes.json()
                uploadedUrls.push(uploadData.secure_url)
            }

            setProofImages(prev => [...prev, ...uploadedUrls])
            toast.success("Proof uploaded")

            // Analyze the first image for verification
            if (uploadedUrls.length > 0) {
                await analyzeShippingProof(uploadedUrls[0])
            }

        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload proof")
            setIsAnalyzing(false)
        }
    }

    const analyzeShippingProof = async (imageUrl: string) => {
        try {
            const res = await fetch("/api/ai/verify-shipping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl })
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Verification failed")
            }

            const analysis = data.data

            if (analysis.isValid && analysis.confidence >= 7) {
                setAiAnalysis({
                    isValid: true,
                    description: analysis.reason,
                    confidence: analysis.confidence
                })

                // Auto-fill details if found
                if (analysis.extractedDetails?.courier) {
                    setCourier(prev => prev || analysis.extractedDetails.courier)
                }
                if (analysis.extractedDetails?.trackingNumber) {
                    setTrackingNumber(prev => prev || analysis.extractedDetails.trackingNumber)
                }

                toast.success("Shipping proof verified!")
            } else {
                setAiAnalysis({
                    isValid: false,
                    description: analysis.reason || "Image does not look like a valid shipping receipt.",
                    confidence: analysis.confidence
                })
                toast.error("Invalid shipping proof detected")
            }

        } catch (error) {
            console.error("Analysis error:", error)
            toast.error("Could not verify image. Please ensure it's clear.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (proofImages.length === 0) {
            toast.error("Please upload proof of shipping")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/orders/update-status", {
                method: "POST",
                body: JSON.stringify({
                    linkId: link.id,
                    status: 'shipped',
                    action: 'mark_shipped',
                    shipping_proof_url: proofImages[0],
                    shipping_courier: courier,
                    tracking_number: trackingNumber,
                    shipping_notes: notes
                })
            })

            if (!res.ok) throw new Error("Failed to update status")

            toast.success("Order marked as shipped!")
            router.push("/dashboard/links")
        } catch (error) {
            toast.error("Failed to submit")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <Link href="/dashboard/links" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Confirm Shipment</h1>
                <p className="text-muted-foreground mt-2">Upload proof of shipping to release funds to your account.</p>
            </div>

            <div className="grid gap-8">
                {/* Order Details Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Item:</span>
                            <p className="font-medium">{link.item_name}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Buyer:</span>
                            <p className="font-medium">{link.buyer_name || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">KES {link.item_price.toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium capitalize">{link.status}</p>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Proof</CardTitle>
                            <CardDescription>Upload a photo of the receipt, waybill, or the packaged item.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 transition-all hover:border-primary/50">
                                {proofImages.length > 0 ? (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/5">
                                        <img src={proofImages[0]} alt="Proof" className="h-full w-full object-contain" />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => {
                                                setProofImages([])
                                                setAiAnalysis(null)
                                            }}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <FileUpload onChange={handleFileUpload} />
                                )}
                            </div>

                            {/* AI Verification Result */}
                            {isAnalyzing && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying proof...
                                </div>
                            )}

                            {aiAnalysis && (
                                <div className={`border rounded-lg p-3 flex items-start gap-3 ${aiAnalysis.isValid
                                        ? "bg-green-500/10 border-green-500/20"
                                        : "bg-red-500/10 border-red-500/20"
                                    }`}>
                                    {aiAnalysis.isValid ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                    )}
                                    <div>
                                        <h4 className={`font-medium ${aiAnalysis.isValid ? "text-green-700" : "text-red-700"
                                            }`}>
                                            {aiAnalysis.isValid ? "Proof Verified" : "Verification Failed"}
                                        </h4>
                                        <p className={`text-sm ${aiAnalysis.isValid ? "text-green-600/90" : "text-red-600/90"
                                            }`}>
                                            {aiAnalysis.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Details Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tracking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="courier">Courier / Service</Label>
                                    <Input
                                        id="courier"
                                        placeholder="e.g. G4S, Wells Fargo, Boda"
                                        value={courier}
                                        onChange={e => setCourier(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tracking">Tracking Number (Optional)</Label>
                                    <Input
                                        id="tracking"
                                        placeholder="e.g. KE123456789"
                                        value={trackingNumber}
                                        onChange={e => setTrackingNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any instructions for the buyer..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || proofImages.length === 0}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    <Truck className="mr-2 h-4 w-4" /> Confirm Shipment
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
