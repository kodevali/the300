
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// The domain to restrict access to.
const ALLOWED_DOMAIN = "jsbl.com";

interface LocalUser {
  email: string;
  name: string;
  displayName: string;
  uid: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem('localAuthUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userDomain = parsedUser.email?.split('@')[1];
        if (userDomain?.toLowerCase() === ALLOWED_DOMAIN.toLowerCase()) {
          setUser(parsedUser);
          setAccessDenied(false);
        } else {
          localStorage.removeItem('localAuthUser');
        }
      } catch (e) {
        localStorage.removeItem('localAuthUser');
      }
    }
    setLoading(false);
  }, []);

  const handleSignIn = async () => {
    setIsAuthorizing(true);
    setAuthError(null);
    
    if (!email) {
      setAuthError("Please enter your email.");
      setIsAuthorizing(false);
      return;
    }

    const userDomain = email.split('@')[1];
    if (userDomain?.toLowerCase() !== ALLOWED_DOMAIN.toLowerCase()) {
      setAccessDenied(true);
      setAuthError(null);
      setIsAuthorizing(false);
      return;
    }

    const derivedName = email.split("@")[0] || "User";

    // Create local user object
    const localUser: LocalUser = {
      email: email.toLowerCase(),
      name: derivedName,
      displayName: derivedName,
      uid: email.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    };

    // Store in localStorage
    localStorage.setItem('localAuthUser', JSON.stringify(localUser));
    setUser(localUser);
    setAccessDenied(false);
    setIsAuthorizing(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('localAuthUser');
    setUser(null);
    setEmail("");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
         <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
            <p className="text-muted-foreground">Sign in to access the application</p>
         </div>
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Input
            type="email"
            placeholder="your.email@jsbl.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAuthorizing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSignIn();
              }
            }}
          />
          <Button 
            onClick={handleSignIn} 
            disabled={isAuthorizing}
            size="lg"
            className="w-full"
          >
            {isAuthorizing ? "Signing in..." : "Sign In"}
          </Button>
        </div>
        {authError && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>
                {authError}
              </AlertDescription>
            </Alert>
        )}
        {accessDenied && !authError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Please use an account from the {ALLOWED_DOMAIN} domain.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
