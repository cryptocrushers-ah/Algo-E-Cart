"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ✅ Updated alias imports (make sure paths in tsconfig.json match your folder structure)
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Redirect logged-in users to home
  useEffect(() => {
    if (!sessionLoading && session?.user) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  // ✅ Handle Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: "/",
      });

      if (error?.code) {
        toast.error(
          "Invalid email or password. Please make sure your account exists and try again."
        );
        setLoading(false);
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred during login");
      setLoading(false);
    }
  };

  // ✅ Show loader while session state is resolving
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ Login Form UI
  return (
    <div className="min-h-screen bg-linear-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Heading */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AlgoMart</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Register Link */}
              <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Create one now
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
