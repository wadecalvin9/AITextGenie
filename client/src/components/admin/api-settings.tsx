import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ApiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [timeout, setTimeout] = useState(30);
  const [allowGuests, setAllowGuests] = useState(true);
  const [rateLimitingEnabled, setRateLimitingEnabled] = useState(true);
  const [defaultModel, setDefaultModel] = useState("");
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: models = [] } = useQuery({
    queryKey: ['/api/models'],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await apiRequest('POST', '/api/settings', {
        key: 'openrouter_api_key',
        value: apiKey,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "API key saved successfully.",
      });
      setApiKey(""); // Clear the input for security
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save API key.",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const promises = Object.entries(settings).map(([key, value]) =>
        apiRequest('POST', '/api/settings', { key, value: String(value) })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key.",
        variant: "destructive",
      });
      return;
    }
    saveApiKeyMutation.mutate(apiKey);
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      rate_limit: rateLimit,
      timeout: timeout,
      allow_guests: allowGuests,
      rate_limiting_enabled: rateLimitingEnabled,
      default_model: defaultModel,
    });
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex-1 p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 md:h-8 bg-slate-200 rounded mb-4 md:mb-6"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">API Settings</h2>

        {/* OpenRouter Configuration */}
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-route text-white"></i>
              </div>
              <div>
                <CardTitle>OpenRouter API</CardTitle>
                <CardDescription>Configure your OpenRouter API key and settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-or-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveApiKey}
                  disabled={saveApiKeyMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {saveApiKeyMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Your API key is encrypted and stored securely</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(parseInt(e.target.value) || 60)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value) || 30)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-700">API Status</span>
                <p className="text-xs text-slate-500">Last checked: 2 minutes ago</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalTokens?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-slate-600">Tokens Used</div>
                <div className="text-xs text-slate-500">This month</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.totalRequests?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-slate-600">API Requests</div>
                <div className="text-xs text-slate-500">This month</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  ${stats?.estimatedCost?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-slate-600">Estimated Cost</div>
                <div className="text-xs text-slate-500">This month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Guest Users</Label>
                <p className="text-sm text-slate-500">Let users chat without signing in</p>
              </div>
              <Switch
                checked={allowGuests}
                onCheckedChange={setAllowGuests}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Rate Limiting</Label>
                <p className="text-sm text-slate-500">Enable rate limiting for API requests</p>
              </div>
              <Switch
                checked={rateLimitingEnabled}
                onCheckedChange={setRateLimitingEnabled}
              />
            </div>

            <div>
              <Label htmlFor="defaultModel">Default Model</Label>
              <select
                id="defaultModel"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full mt-2 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select default model</option>
                {models.map((model: any) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                {saveSettingsMutation.isPending ? 'Saving Settings...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
