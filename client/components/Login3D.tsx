import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, Users, KeyRound, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Background3D, Background3DProvider } from "./Background3D";

export function Login3D() {
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };

  const demoCredentials = [
    {
      role: "Admin",
      username: "vinesh",
      password: "vinesh123",
      description: "Full system access",
      icon: Shield,
      location: "Johannesburg",
      color: "from-red-500 to-red-600"
    },
    {
      role: "Supervisor",
      username: "sune",
      password: "sune123",
      description: "Supervisor (Apollos)",
      icon: Shield,
      location: "Cape Town",
      color: "from-purple-500 to-purple-600"
    },
    {
      role: "Supervisor",
      username: "frans",
      password: "frans123",
      description: "Supervisor (Apollos)",
      icon: Shield,
      location: "Johannesburg",
      color: "from-purple-500 to-purple-600"
    },
    {
      role: "Staff",
      username: "lebo",
      password: "lebo123",
      description: "Johannesburg Team",
      icon: Users,
      location: "Johannesburg",
      color: "from-blue-500 to-blue-600"
    },
    {
      role: "Staff",
      username: "freedom",
      password: "freedom123",
      description: "Johannesburg Team",
      icon: Users,
      location: "Johannesburg",
      color: "from-blue-500 to-blue-600"
    },
    {
      role: "Staff",
      username: "keenan",
      password: "keenan123",
      description: "Cape Town Team",
      icon: Users,
      location: "Cape Town",
      color: "from-green-500 to-green-600"
    },
    {
      role: "Staff",
      username: "zaundre",
      password: "zaundre123",
      description: "Cape Town Team",
      icon: Users,
      location: "Cape Town",
      color: "from-green-500 to-green-600"
    },
  ];

  const handleDemoLogin = (username: string, password: string) => {
    setCredentials({ username, password });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <Background3DProvider>
      {/* 3D Background using the same component as dashboard */}
      <Background3D enabled={true} className="fixed inset-0" />
      
      <div className="relative min-h-screen w-full bg-transparent">
        {/* Login Form - Centered */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Main Login Card */}
            <Card className="bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-float animate-glow">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white animate-slide-in">
                  Welcome to JobFlow
                </CardTitle>
                <p className="text-gray-300 text-sm animate-slide-in" style={{ animationDelay: '0.2s' }}>
                  Access your futuristic job management system
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials({ ...credentials, username: e.target.value })
                      }
                      placeholder="Enter your username"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({ ...credentials, password: e.target.value })
                        }
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
                      <AlertDescription className="text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 shadow-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accessing System...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Access JobFlow
                      </>
                    )}
                  </Button>
                </form>

                {/* Demo Accounts Toggle */}
                <div className="mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    className="w-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <span className="mr-2">Demo Accounts</span>
                    {showDemoAccounts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {/* Demo Accounts Grid */}
                  {showDemoAccounts && (
                    <div className="mt-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-300">
                      {demoCredentials.map((demo, index) => {
                        const Icon = demo.icon;
                        return (
                          <Card
                            key={index}
                            className="cursor-pointer transition-all duration-300 hover:scale-105 bg-white/5 hover:bg-white/10 border-white/20 hover:border-white/30 group"
                            onClick={() => handleDemoLogin(demo.username, demo.password)}
                          >
                            <CardContent className="p-3">
                              <div className="text-center space-y-2">
                                <div className={`mx-auto rounded-full bg-gradient-to-r ${demo.color} p-2 w-fit shadow-lg group-hover:shadow-xl transition-shadow`}>
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-white">
                                    {demo.username}
                                  </div>
                                  <div className="text-xs text-gray-300">
                                    {demo.role}
                                  </div>
                                  <div className="text-xs text-blue-400">
                                    {demo.location}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Background3DProvider>
  );
}
