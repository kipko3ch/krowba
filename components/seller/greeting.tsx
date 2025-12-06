"use client"

import { useEffect, useState } from "react"

interface GreetingProps {
    name: string
}

export function Greeting({ name }: GreetingProps) {
    const [greeting, setGreeting] = useState("Welcome back")

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting("Good morning")
        else if (hour < 18) setGreeting("Good afternoon")
        else setGreeting("Good evening")
    }, [])

    return (
        <div className="space-y-1">
            <h1 className="text-2xl font-light font-serif text-foreground">
                {greeting}, {name}
            </h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your store today.</p>
        </div>
    )
}
