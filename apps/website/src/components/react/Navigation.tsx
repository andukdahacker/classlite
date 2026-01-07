import { Button } from "@workspace/ui/components/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">IELTS Nook</h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </a>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a href="/sign-in">
              <Button>Get Started</Button>
            </a>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <a
                href="#features"
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                Pricing
              </a>
              <div className="pt-4 pb-3 border-t">
                <div className="flex flex-col space-y-2">
                  <a href="http://localhost:5173/">
                    <Button className="w-full">Get Started</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
