"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileUpload } from "@/components/ui/file-upload"
import { MovingBorderContainer } from "@/components/ui/moving-border"
import { CometCard } from "@/components/ui/comet-card"
import { toast } from "sonner"
import { Loader2, Sparkles, Shield, AlertTriangle, ArrowRight, CheckCircle2, ArrowLeft, ScanLine, Gem, Copy, Share2, ExternalLink, Camera } from "lucide-react"
import type { EscrowMode } from "@/types"
import { cn } from "@/lib/utils"
import QRCode from "react-qr-code"

export function CreateLinkWizard() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2 | 3 | 4 | "loading" | "success">(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Form State
    const [images, setImages] = useState<string[]>([])
    const [itemName, setItemName] = useState("")
    const [description, setDescription] = useState("")
    const [itemPrice, setItemPrice] = useState("")
    const [deliveryFee, setDeliveryFee] = useState("")
    const [depositAmount, setDepositAmount] = useState("")
    const [accessPin, setAccessPin] = useState("")
    const [escrowMode, setEscrowMode] = useState<EscrowMode>("full_escrow")

    // Success State
    const [createdLink, setCreatedLink] = useState<{ short_code: string; id: string } | null>(null)

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<{
        condition?: string
        confidence?: number
        suggested_price?: { min: number, max: number }
        defects?: string[]
        missing_details?: string[]
    } | null>(null)
    const [extraDetails, setExtraDetails] = useState<Record<string, string>>({})

    // Handle file upload and Cloudinary upload
    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return

        setIsAnalyzing(true)
        const uploadedUrls: string[] = []

        try {
            for (const file of files) {
                const signatureRes = await fetch("/api/upload/signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: "products" }),
                })

                if (!signatureRes.ok) throw new Error("Failed to get upload signature")

                const { signature, timestamp, cloudName, apiKey, uploadPreset } = await signatureRes.json()

                const formData = new FormData()
                formData.append("file", file)
                formData.append("signature", signature)
                formData.append("timestamp", timestamp.toString())
                formData.append("api_key", apiKey)
                formData.append("upload_preset", uploadPreset)
                formData.append("folder", "krowba/products")

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData,
                })

                if (!uploadRes.ok) throw new Error("Failed to upload image")

                const uploadData = await uploadRes.json()
                uploadedUrls.push(uploadData.secure_url)
            }

            setImages(prev => [...prev, ...uploadedUrls])
            toast.success(`${uploadedUrls.length} image(s) uploaded`)

            await analyzeImages(uploadedUrls)

        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload images")
            setIsAnalyzing(false)
        }
    }

    const analyzeImages = async (urls: string[]) => {
        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images: urls }),
            })
            const result = await response.json()

            if (result.success) {
                setItemName(result.data.item_name || "")
                setDescription(result.data.description || "")
                setAiAnalysis(result.data)
                toast.success("Item Analyzed Successfully", {
                    icon: <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />,
                })
                setTimeout(() => setStep(2), 1000)
            } else {
                toast.error("AI couldn't analyze the image", {
                    description: result.error || "Please enter details manually."
                })
                setStep(2)
            }
        } catch (error) {
            console.error("Analysis failed", error)
            toast.error("Analysis failed", {
                description: "Please enter details manually."
            })
            setStep(2)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSubmit = async () => {
        setStep("loading")
        try {
            const response = await fetch("/api/seller/create-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_name: itemName,
                    description,
                    item_price: Number(itemPrice),
                    delivery_fee: Number(deliveryFee) || 0,
                    deposit_amount: escrowMode === "split_risk" ? Number(depositAmount) : null,
                    access_pin: accessPin || null,
                    escrow_mode: escrowMode,
                    images
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                console.error("Create link error:", result)
                throw new Error(result.error || "Failed to create link")
            }

            setCreatedLink(result.data)
            setStep("success")
            toast.success("Secure Link Created!")

        } catch (error: any) {
            console.error("Submit error:", error)
            toast.error(error.message || "Failed to create link")
            setStep(3) // Go back to pricing step on error
        }
    }

    const resetImages = () => {
        setImages([])
        setAiAnalysis(null)
        setItemName("")
        setDescription("")
    }

    const getLinkUrl = () => {
        if (!createdLink) return ""
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        return `${baseUrl}/pay/${createdLink.short_code}`
    }

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(getLinkUrl())
        toast.success("Link copied!")
    }

    const shareToWhatsApp = () => {
        const text = `Check out this item: ${itemName} - ${getLinkUrl()}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }

    const shareToTwitter = () => {
        const text = `Check out this item: ${itemName}`
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getLinkUrl())}`, "_blank")
    }

    const shareNative = async () => {
        if (navigator.share) {
            await navigator.share({
                title: itemName,
                text: `Check out this item: ${itemName}`,
                url: getLinkUrl()
            })
        } else {
            copyToClipboard()
        }
    }

    // --- LOADING SCREEN ---
    if (step === "loading") {
        return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                <div className="max-w-md w-full mx-auto p-8 space-y-8">
                    {/* Skeleton Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-muted rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                        <div className="flex justify-between">
                            <div className="h-8 bg-muted rounded w-24" />
                            <div className="h-8 bg-muted rounded w-24" />
                        </div>
                    </div>

                    {/* Loading Text */}
                    <div className="text-center space-y-3">
                        <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                        <p className="text-lg font-medium">Creating your secure link...</p>
                        <p className="text-sm text-muted-foreground">Setting up escrow protection</p>
                    </div>
                </div>
            </div>
        )
    }

    // --- SUCCESS SCREEN ---
    if (step === "success" && createdLink) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500 p-4 overflow-y-auto">
                <div className="w-full max-w-[360px] mx-auto py-6">
                    {/* Comet Card - Vertical Rectangle */}
                    <CometCard className="mx-auto" rotateDepth={8} translateDepth={12}>
                        <div className="w-full bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
                            {/* Product Image - 16:9 for much shorter card */}
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                {images[0] && (
                                    <img
                                        src={images[0]}
                                        alt={itemName}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Success Badge */}
                                <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Created
                                </div>

                                {/* Product Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="font-semibold text-white text-base truncate">{itemName}</h3>
                                    <p className="text-white font-bold text-lg">KES {Number(itemPrice).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* QR & Link Section */}
                            <div className="p-4 space-y-3 bg-card">
                                {/* QR Code */}
                                <div className="p-4 flex justify-center">
                                    <div className="dark:invert">
                                        <QRCode value={getLinkUrl()} size={100} bgColor="transparent" />
                                    </div>
                                </div>

                                {/* Link */}
                                <div className="bg-muted rounded-lg p-2 flex items-center gap-2">
                                    <code className="flex-1 text-[10px] text-muted-foreground truncate font-mono">{getLinkUrl()}</code>
                                    <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7 w-7 p-0 shrink-0">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Share Buttons - Inside Card */}
                                <div className="grid grid-cols-3 gap-2">
                                    <Button onClick={shareToWhatsApp} size="sm" className="bg-[#25D366] hover:bg-[#20BD5A] text-white h-9">
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </Button>
                                    <Button onClick={shareToTwitter} size="sm" variant="outline" className="h-9">
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </Button>
                                    <Button onClick={shareNative} size="sm" variant="outline" className="h-9">
                                        <Share2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Button variant="outline" onClick={() => router.push("/dashboard/links")} className="h-10 text-sm">
                                        All Links
                                    </Button>
                                    <Button onClick={() => window.open(getLinkUrl(), "_blank")} className="h-10 text-sm bg-primary hover:bg-primary/90">
                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CometCard>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-12 relative max-w-lg mx-auto">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
                {[1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-4",
                            typeof step === "number" && step >= s
                                ? "bg-primary border-background text-primary-foreground shadow-[0_0_15px_rgba(68,249,31,0.4)] scale-110"
                                : "bg-card border-border text-muted-foreground"
                        )}
                    >
                        {typeof step === "number" && step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                    </div>
                ))}
            </div>

            {/* STEP 1: MEDIA UPLOAD */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-[#44F91F]/30 blur-2xl rounded-full animate-pulse" />
                            <div className="bg-card border border-[#44F91F]/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto relative shadow-[0_0_30px_-5px_rgba(68,249,31,0.4)]">
                                <Sparkles className="h-8 w-8 text-[#44F91F]" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-medium tracking-tight">What are you selling?</h2>
                            <p className="text-muted-foreground mt-2">Upload a photo. Our AI will identify your item instantly.</p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    {images.length === 0 && !isAnalyzing && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border hover:border-[#44F91F]/30 rounded-2xl overflow-hidden transition-all duration-500">
                                <FileUpload onChange={handleFileUpload} />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full py-8 border-dashed border-2 flex flex-col gap-2 h-auto hover:bg-accent/50 hover:border-primary/50 transition-all"
                                onClick={() => document.getElementById('camera-input')?.click()}
                            >
                                <Camera className="h-8 w-8 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium">Take a Photo</span>
                            </Button>

                            <input
                                id="camera-input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileUpload(Array.from(e.target.files))
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Analyzing State */}
                    {isAnalyzing && (
                        <MovingBorderContainer
                            borderRadius="1rem"
                            duration={4000}
                            containerClassName="w-full"
                            className="p-12"
                        >
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <Sparkles className="h-14 w-14 text-blue-500 animate-pulse" style={{ animationDuration: '1.5s' }} />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-xl font-medium text-foreground">
                                        Analyzing with AI<span className="animate-pulse">...</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">Identifying item, condition, and market price</p>
                                </div>
                            </div>
                        </MovingBorderContainer>
                    )}

                    {/* Uploaded Images Preview */}
                    {images.length > 0 && !isAnalyzing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-3">
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                                        <img src={url} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                                        {idx === 0 && (
                                            <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                                                Main
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={resetImages} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                ← Upload different images
                            </button>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={() => setStep(2)}
                            disabled={images.length === 0 || isAnalyzing}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 2: VERIFY DETAILS */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif font-medium">Verify Details</h2>
                        {aiAnalysis && (
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium shadow-sm",
                                (aiAnalysis.confidence || 0) >= 7
                                    ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]"
                                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                            )}>
                                {(aiAnalysis.confidence || 0) >= 7 ? <Sparkles className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                <span>{aiAnalysis.confidence}/10 Confidence</span>
                            </div>
                        )}
                    </div>

                    {aiAnalysis && (aiAnalysis.confidence || 0) < 7 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-medium text-yellow-700 dark:text-yellow-400">Low Confidence Analysis</h3>
                                <p className="text-sm text-yellow-600/90 dark:text-yellow-400/90">
                                    The AI isn't fully sure about this item.
                                    {/* @ts-ignore */}
                                    {aiAnalysis.low_confidence_reason ? ` Reason: ${aiAnalysis.low_confidence_reason}.` : ""}
                                    <br />Consider uploading more clear photos for better accuracy.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStep(1);
                                        setImages([]); // Optional: clear images or keep them
                                        setAiAnalysis(null);
                                    }}
                                    className="mt-2 border-yellow-500/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10"
                                >
                                    Upload Better Photos
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6">
                        <div className={cn(
                            "bg-card border rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-500",
                            aiAnalysis ? "border-purple-500/30 dark:border-purple-500/40 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]" : "border-border"
                        )}>
                            <div className="space-y-2">
                                <Label className="text-base">Item Name</Label>
                                <Input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="bg-background border-input focus:border-purple-500 dark:focus:border-purple-400 h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base">Description</Label>
                                <div className="relative">
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-background border-input focus:border-purple-500 dark:focus:border-purple-400 min-h-[120px] resize-none"
                                    />
                                    {aiAnalysis && (
                                        <div className="absolute bottom-3 right-3 text-[10px] text-purple-600/60 dark:text-purple-400/60 flex items-center gap-1 bg-background/80 px-2 py-1 rounded-md border border-purple-500/10">
                                            <Gem className="h-3 w-3" /> AI Generated
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {aiAnalysis?.missing_details && aiAnalysis.missing_details.length > 0 && (
                            <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <h3 className="font-medium text-purple-600 dark:text-purple-400">Add details to enhance your listing</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {aiAnalysis.missing_details.map((detail) => (
                                        <div key={detail} className="space-y-1">
                                            <Label className="text-sm capitalize">{detail}</Label>
                                            <Input
                                                placeholder={`Enter ${detail}`}
                                                value={extraDetails[detail] || ""}
                                                onChange={(e) => setExtraDetails(prev => ({ ...prev, [detail]: e.target.value }))}
                                                className="h-10 bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const detailsText = Object.entries(extraDetails)
                                            .filter(([_, v]) => v)
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(", ");

                                        if (!detailsText) {
                                            toast.error("Please add at least one detail");
                                            return;
                                        }

                                        const toastId = toast.loading("AI is enhancing your description...");

                                        try {
                                            // Call AI to regenerate description with new details
                                            const response = await fetch("/api/ai/enhance-description", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    current_description: description,
                                                    item_name: itemName,
                                                    extra_details: extraDetails
                                                }),
                                            });

                                            toast.dismiss(toastId);

                                            if (response.ok) {
                                                const result = await response.json();
                                                setDescription(result.enhanced_description);
                                                toast.success("Description enhanced with AI!", {
                                                    icon: <Sparkles className="h-4 w-4 text-purple-500" />
                                                });
                                            } else {
                                                // Fallback to manual enhancement
                                                setDescription(prev => `${prev} (${detailsText})`);
                                                toast.success("Details added to description");
                                            }
                                        } catch (error) {
                                            toast.dismiss(toastId);
                                            // Fallback to manual enhancement
                                            setDescription(prev => `${prev} (${detailsText})`);
                                            toast.success("Details added to description");
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }}
                                    disabled={isAnalyzing}
                                    className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 mr-2" />
                                    )}
                                    {isAnalyzing ? "Enhancing..." : "Enhance with AI"}
                                </Button>
                            </div>
                        )}

                        {aiAnalysis?.condition && (
                            <div className="bg-card border border-purple-500/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                <div className="bg-purple-500/10 p-3 rounded-xl">
                                    <ScanLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium">Condition Report</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Detected as <span className="font-semibold text-foreground">{aiAnalysis.condition}</span>.
                                        {aiAnalysis.defects && aiAnalysis.defects.length > 0
                                            ? ` Noted issues: ${aiAnalysis.defects.join(", ")}.`
                                            : " No visible defects found."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={() => setStep(1)} className="hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            onClick={() => setStep(3)}
                            disabled={!itemName}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            Looks Good <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: PRICING */}
            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-serif font-medium">Set Price & Protection</h2>
                        <p className="text-muted-foreground">Choose how you want to secure this transaction.</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-base">Price (KES)</Label>
                                <Input
                                    type="number"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(e.target.value)}
                                    className="h-12 text-lg bg-background"
                                    placeholder="0"
                                />
                                {aiAnalysis?.suggested_price && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 text-blue-400" />
                                        Suggested: {aiAnalysis.suggested_price.min?.toLocaleString()} - {aiAnalysis.suggested_price.max?.toLocaleString()} KES
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base">Delivery Fee (KES)</Label>
                                <Input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                    className="h-12 text-lg bg-background"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base">Escrow Mode</Label>
                            <RadioGroup
                                value={escrowMode}
                                onValueChange={(v) => setEscrowMode(v as EscrowMode)}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            >
                                <div
                                    className={cn(
                                        "relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                                        escrowMode === "full_escrow"
                                            ? "border-primary bg-primary/5 shadow-[0_0_20px_-5px_rgba(68,249,31,0.15)]"
                                            : "border-border hover:border-primary/30"
                                    )}
                                    onClick={() => setEscrowMode("full_escrow")}
                                >
                                    <RadioGroupItem value="full_escrow" id="full_escrow" className="sr-only" />
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn("p-2 rounded-lg", escrowMode === "full_escrow" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold">Full Escrow</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-[3.25rem]">Maximum safety. Funds held until delivery.</p>
                                </div>

                                <div
                                    className={cn(
                                        "relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                                        escrowMode === "split_risk"
                                            ? "border-yellow-500 bg-yellow-500/5 shadow-[0_0_20px_-5px_rgba(234,179,8,0.15)]"
                                            : "border-border hover:border-yellow-500/30"
                                    )}
                                    onClick={() => setEscrowMode("split_risk")}
                                >
                                    <RadioGroupItem value="split_risk" id="split_risk" className="sr-only" />
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn("p-2 rounded-lg", escrowMode === "split_risk" ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground")}>
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold">Deposit Only</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-[3.25rem]">Buyer pays deposit now. Balance on delivery.</p>
                                </div>
                            </RadioGroup>

                            {escrowMode === "split_risk" && (
                                <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-base">Deposit Amount (KES)</Label>
                                    <Input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="h-12 text-lg bg-background"
                                        placeholder="0"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={() => setStep(2)} className="hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            onClick={() => setStep(4)}
                            disabled={!itemPrice}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 4: ACCESS PIN (Optional) & Submit */}
            {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-serif font-medium">Access Protection</h2>
                        <p className="text-muted-foreground">Optionally add a PIN to restrict access to this link.</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Access PIN (Optional)</Label>
                                <Input
                                    type="password"
                                    maxLength={6}
                                    value={accessPin}
                                    onChange={(e) => setAccessPin(e.target.value)}
                                    placeholder="Enter 4-6 digit PIN"
                                    className="h-12 bg-background text-center text-2xl tracking-widest font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If set, buyers will need this PIN to view and pay for this item. Leave blank for public access.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={() => setStep(3)} className="hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Link...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Create Link
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
