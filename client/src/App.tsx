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

  let content;

  if (isLoading) {
    content = (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-robot text-white text-2xl"></i>
          </div>
          <div className="text-lg font-medium text-slate-900">Loading...</div>
        </div>
      </div>
    );
  } else if (isAuthenticated) {
    content = (
      <Switch>
        <Route path="/" component={Home} />
        {user?.role === 'admin' && <Route path="/admin" component={Admin} />}
        <Route component={NotFound} />
      </Switch>
    );
  } else {
    content = <AuthForm />;
  }

  return content;
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
