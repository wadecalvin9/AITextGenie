import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import { AuthForm } from "@/components/auth/AuthForm";
import Home from "@/pages/home";
import Admin from "@/pages/admin";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('Router rendering:', { isAuthenticated, isLoading, hasUser: !!user });
  
  // Force a re-render by using the authentication state as a key
  const renderKey = `${isAuthenticated}-${isLoading}-${!!user}`;

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-robot text-white text-2xl"></i>
          </div>
          <div className="text-lg font-medium text-slate-900">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm key={renderKey} />;
  }

  // User is authenticated, show the main app
  return (
    <div key={renderKey}>
      <Switch>
        <Route path="/" component={Home} />
        {user?.role === 'admin' && <Route path="/admin" component={Admin} />}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
