import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, QrCode, Users, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="eTabecon" className="h-12" />
          <Button onClick={() => navigate("/auth")} variant="default" size="lg">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            eTabecon
          </h1>
          <p className="text-2xl text-muted-foreground mb-4">
            QR-Based Document Flow & Signatory Tracking System
          </p>
          <p className="text-lg text-muted-foreground mb-12">
            Municipality of Tubigon
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8 py-6">
              Get Started
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            <div className="p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Document Management</h3>
              <p className="text-sm text-muted-foreground">
                Upload and track official documents with ease
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">QR Code Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Real-time document status via QR codes
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Hierarchical Approvals</h3>
              <p className="text-sm text-muted-foreground">
                Structured signatory workflow system
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Audit Trail</h3>
              <p className="text-sm text-muted-foreground">
                Complete transparency and accountability
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
