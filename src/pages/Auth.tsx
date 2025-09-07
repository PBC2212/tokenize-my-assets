import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import WalletConnect from "@/components/WalletConnect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Shield, Zap } from "lucide-react";

const Auth = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TokenizeRWA
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your wallet to access the platform
          </p>
        </div>

        {/* Authentication Card */}
        <Card className="gradient-card border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Wallet Authentication
            </CardTitle>
            <CardDescription className="text-center">
              Connect your MetaMask wallet to get started. No email or password required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Secure Authentication</p>
                  <p className="text-xs text-muted-foreground">Your wallet signature is your login</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Instant Access</p>
                  <p className="text-xs text-muted-foreground">Connect once and stay logged in</p>
                </div>
              </div>
            </div>
            
            <WalletConnect />
            
            <p className="text-xs text-muted-foreground text-center">
              By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have MetaMask?{" "}
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Install it here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;