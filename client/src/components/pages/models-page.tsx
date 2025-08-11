import { useQuery } from "@tanstack/react-query";

interface AiModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  contextLength: number;
  costPer1kTokens: number;
  isActive: boolean;
}

export default function ModelsPage() {
  // Get available models
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const res = await fetch('/api/models?active=true');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json() as AiModel[];
    },
  });

  const formatCost = (cost: number) => {
    if (cost === 0) return "Free";
    if (cost < 0.001) return `$${(cost * 1000).toFixed(4)}/1K tokens`;
    return `$${cost.toFixed(3)}/1K tokens`;
  };

  const formatContextLength = (length: number) => {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M context`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K context`;
    return `${length} context`;
  };

  return (
    <div className="flex-1 p-3 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Available Models</h2>
        <div className="bg-white rounded-lg border p-4 md:p-6 mb-6">
          <p className="text-slate-600 mb-6">
            These are the AI models currently available in the system. You can select any of these models in the chat interface.
          </p>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-robot text-slate-300 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No Models Available</h3>
              <p className="text-slate-500">No active AI models are currently configured in the system.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((model) => (
                <div key={model.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{model.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 flex-shrink-0">
                      {model.provider}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{model.modelId}</p>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      <i className="fas fa-memory mr-1"></i>
                      {formatContextLength(model.contextLength)}
                    </div>
                    <div className="text-xs text-slate-500">
                      <i className="fas fa-dollar-sign mr-1"></i>
                      {formatCost(model.costPer1kTokens)}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center text-xs text-green-600">
                      <i className="fas fa-check-circle mr-1"></i>
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && models.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
                <div>
                  <h4 className="font-medium text-blue-800">Model Selection</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You can select any of these models in the chat interface. Each model has different capabilities, 
                    context lengths, and pricing. Choose the one that best fits your needs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}