import { Phone, Mail, Globe, MapPin, Clock, Wallet } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                IME Capital
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              IME Capital Tokenization LLC specializes in real-world asset tokenization, 
              making investment opportunities accessible through blockchain technology.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-accent" />
                <a href="tel:248-678-4819" className="hover:text-accent transition-colors">
                  248-678-4819
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-accent" />
                <a href="mailto:info@imecapitaltokenization.com" className="hover:text-accent transition-colors">
                  info@imecapitaltokenization.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Globe className="w-4 h-4 text-accent" />
                <a href="https://www.imecapitaltokenization.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  www.imecapitaltokenization.com
                </a>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-accent mt-0.5" />
                <span>124 Broadkill Ave, Milton, DE 19968</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span>Monday - Friday: 9:00 AM - 7:00 PM EST</span>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">IME Capital Tokenization LLC</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Licensed Asset Tokenization Platform</p>
              <p>Secure • Compliant • Professional</p>
              <p className="text-xs mt-4">
                © 2025 IME Capital Tokenization LLC. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;