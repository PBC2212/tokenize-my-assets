import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Gem, Palette, Shield, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Building2,
      title: "Real Estate Tokenization",
      description: "Convert physical properties into tradeable digital tokens with verified ownership and automated compliance.",
    },
    {
      icon: Gem,
      title: "Precious Metals & Commodities",
      description: "Tokenize gold, silver, and other valuable commodities for fractional ownership and enhanced liquidity.",
    },
    {
      icon: Palette,
      title: "Art & Collectibles",
      description: "Bring fine art and rare collectibles to the blockchain with authenticated provenance and shared ownership.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with multi-signature wallets, insurance coverage, and regulatory compliance.",
    },
    {
      icon: Zap,
      title: "Instant Liquidity",
      description: "Trade tokenized assets 24/7 with instant settlement and access to global liquidity pools.",
    },
    {
      icon: Globe,
      title: "Global Marketplace",
      description: "Access worldwide investment opportunities with transparent pricing and seamless cross-border transactions.",
    },
  ];

  const stats = [
    { label: "Total Assets Tokenized", value: "$2.5B+" },
    { label: "Active Investors", value: "50K+" },
    { label: "Countries Supported", value: "120+" },
    { label: "Transaction Volume", value: "$500M+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TokenizeRWA
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span>Powered by Fireblocks Enterprise Security</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Tokenize Real World Assets
              </span>
              <br />
              <span className="text-foreground">
                Unlock Global Liquidity
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform physical assets into digital tokens. Enable fractional ownership, 
              instant trading, and global accessibility with enterprise-grade security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="gradient-primary text-lg px-8 py-6 glow-primary">
                <Link to="/auth">
                  Start Tokenizing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Explore Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive platform for tokenizing, trading, and managing real-world assets
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="gradient-card border-0 hover:shadow-lg transition-all duration-300 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="gradient-card border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
            <CardContent className="relative z-10 p-12 text-center">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Tokenize Your Assets?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of investors and asset owners who are already benefiting 
                from the future of asset ownership and trading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="gradient-primary">
                  <Link to="/auth">
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">
                TokenizeRWA
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 TokenizeRWA. Powered by Fireblocks. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
