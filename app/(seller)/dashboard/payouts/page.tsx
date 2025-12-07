import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PayoutSettings } from "@/components/seller/payout-settings"
import { PayoutHistory } from "@/components/seller/payout-history"

export default function PayoutsPage() {
    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your payout settings and view transaction history
                </p>
            </div>

            <Tabs defaultValue="settings" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-6">
                    <PayoutSettings />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <PayoutHistory />
                </TabsContent>
            </Tabs>
        </main>
    )
}
