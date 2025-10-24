"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      if (error?.code) {
        const errorMessages: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered. Please login instead."
        };
        toast.error(errorMessages[error.code] || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AlgoMart</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Sign up to start buying and selling on AlgoMart
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
