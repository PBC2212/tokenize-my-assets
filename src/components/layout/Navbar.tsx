import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TokenizeRWA
          </span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/dashboard") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/assets"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/assets") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              My Assets
            </Link>
            <Link
              to="/marketplace"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/marketplace") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/liquidity"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/liquidity") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Liquidity
            </Link>
            <Link
              to="/activity"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/activity") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Activity
            </Link>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="gradient-primary">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;