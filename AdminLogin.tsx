import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (res) => {
          if (res.success && res.token) {
            localStorage.setItem("pulse_admin_token", res.token);
            toast({
              title: "Login successful",
              description: "Welcome to the admin dashboard.",
            });
            setLocation("/admin/dashboard");
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid credentials. Please try again.",
            });
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Server error. Please try again later.",
          });
        }
      }
    );
  };

  // If already logged in, redirect to dashboard
  if (typeof window !== "undefined" && localStorage.getItem("pulse_admin_token")) {
    setLocation("/admin/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <LockKeyhole className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl font-bold">Pulse Admin</CardTitle>
          <CardDescription className="text-base mt-2">Sign in to manage news and content</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <Input 
                id="username" 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
                placeholder="Enter admin username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                placeholder="Enter password"
              />
            </div>
          </CardContent>
          <CardFooter className="pb-8 pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
