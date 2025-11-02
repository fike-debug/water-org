import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, TrendingUp, Users, Shield, ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/app");
      }
    };
    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: Receipt,
      title: "Smart Receipt Processing",
      description: "Upload PDF and Word documents to automatically extract transaction data with advanced table parsing."
    },
    {
      icon: Users,
      title: "Agent-Based Organization", 
      description: "Organize transactions by financial agents with unique codes and comprehensive tracking."
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Visualize performance with charts, rankings, and comprehensive financial insights."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your financial data is protected with enterprise-grade security and user authentication."
    }
  ];

  const stats = [
    { label: "Active Users", value: "500+" },
    { label: "Receipts Processed", value: "25K+" },
    { label: "Ethiopian Businesses", value: "100+" },
    { label: "ETB Transactions", value: "₹2M+" }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow">
              <Receipt className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Financial Receipt
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Management</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your financial operations with intelligent receipt processing, 
            agent-based organization, and powerful analytics. Built for Ethiopian businesses using ETB currency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary text-primary-foreground shadow-glow hover:shadow-elevated transition-smooth text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-border hover:bg-secondary transition-smooth text-lg px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card border-border shadow-card text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-smooth">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Testimonial Section */}
        <Card className="bg-gradient-card border-border shadow-card mb-16">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
            <blockquote className="text-lg text-foreground mb-4 italic">
              "This app has revolutionized how we handle financial receipts. The agent-based organization 
              and automatic data extraction saves us hours every week."
            </blockquote>
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold">Mesfin Tadesse</p>
              <p>Finance Manager, Addis Tech Solutions</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-card border-border shadow-elevated">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Receipt Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Ethiopian businesses using our platform to streamline financial operations 
              and gain valuable insights from their transaction data.
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary text-primary-foreground shadow-glow hover:shadow-elevated transition-smooth text-lg px-12 py-4"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;