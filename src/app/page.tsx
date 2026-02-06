"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "localAuthEmail";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Home() {
  const [email, setEmail] = useState("");
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    setStoredEmail(existing);
    if (existing) {
      setEmail(existing);
    }
  }, []);

  const handleSignIn = () => {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    window.localStorage.setItem(STORAGE_KEY, email.toLowerCase());
    setStoredEmail(email.toLowerCase());
  };

  const handleSignOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setStoredEmail(null);
    setEmail("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {storedEmail ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-base font-medium">{storedEmail}</p>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleSignIn} className="w-full">
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
