import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

interface ModelFormData {
  name: string;
  provider: string;
  modelId: string;
  contextLength: number;
  costPer1kTokens: number;
  isActive: boolean;
}

export default function ModelManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [formData, setFormData] = useState<ModelFormData>({
    name: "",
    provider: "",
    modelId: "",
    contextLength: 4096,
    costPer1kTokens: 0.03,
    isActive: true,
  });
  
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

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/models'],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createModelMutation = useMutation({
    mutationFn: async (modelData: ModelFormData) => {
      const response = await apiRequest('POST', '/api/models', modelData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Model created successfully.",
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
        description: "Failed to create model.",
        variant: "destructive",
      });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModelFormData> }) => {
      const response = await apiRequest('PUT', `/api/models/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setEditingModel(null);
      resetForm();
      toast({
        title: "Success",
        description: "Model updated successfully.",
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
        description: "Failed to update model.",
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      await apiRequest('DELETE', `/api/models/${modelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      toast({
        title: "Success",
        description: "Model deleted successfully.",
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
        description: "Failed to delete model.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      provider: "",
      modelId: "",
      contextLength: 4096,
      costPer1kTokens: 0.03,
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, data: formData });
    } else {
      createModelMutation.mutate(formData);
    }
  };

  const handleEdit = (model: any) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      contextLength: model.contextLength,
      costPer1kTokens: model.costPer1kTokens,
      isActive: model.isActive,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (modelId: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      deleteModelMutation.mutate(modelId);
    }
  };

  if (isLoading || modelsLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-slate-200 rounded flex-1"></div>
                    <div className="h-8 bg-slate-200 rounded flex-1"></div>
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
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Manage AI Models</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <i className="fas fa-plus mr-2"></i>Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingModel ? 'Edit Model' : 'Add New Model'}</DialogTitle>
                <DialogDescription>
                  {editingModel ? 'Update the model configuration.' : 'Add a new AI model from OpenRouter.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="provider" className="text-right">
                      Provider
                    </Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="modelId" className="text-right">
                      Model ID
                    </Label>
                    <Input
                      id="modelId"
                      value={formData.modelId}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., openai/gpt-4"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contextLength" className="text-right">
                      Context Length
                    </Label>
                    <Input
                      id="contextLength"
                      type="number"
                      value={formData.contextLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, contextLength: parseInt(e.target.value) }))}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right">
                      Cost per 1K tokens
                    </Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.001"
                      value={formData.costPer1kTokens}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPer1kTokens: parseFloat(e.target.value) }))}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right">
                      Active
                    </Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createModelMutation.isPending || updateModelMutation.isPending}>
                    {createModelMutation.isPending || updateModelMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model: any) => (
            <div key={model.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-brain text-white"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{model.name}</h3>
                    <p className="text-sm text-slate-500">{model.provider}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    model.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {model.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Context Length:</span>
                  <span className="text-slate-900">{model.contextLength?.toLocaleString() || 'N/A'} tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cost per 1K tokens:</span>
                  <span className="text-slate-900">${model.costPer1kTokens || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Model ID:</span>
                  <span className="text-slate-900 text-xs font-mono">{model.modelId}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(model)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDelete(model.id)}
                  disabled={deleteModelMutation.isPending}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Model Prompt */}
        {models.length === 0 && (
          <div className="mt-8 p-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-slate-400 transition-colors cursor-pointer"
               onClick={() => setIsAddDialogOpen(true)}>
            <div className="text-slate-400 mb-4">
              <i className="fas fa-plus-circle text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Add Your First Model</h3>
            <p className="text-slate-600">Connect an AI model from OpenRouter to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
