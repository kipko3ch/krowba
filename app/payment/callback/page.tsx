import { Suspense } from "react"
import PaymentCallbackContent from "./content"

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-primary/20" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Loading...</h1>
                        <p className="text-muted-foreground mt-2">Please wait...</p>
                    </div>
                </div>
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    )
}
