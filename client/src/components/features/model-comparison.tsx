import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface ComparisonResult {
  model1: {
    name: string;
    response: string;
    time: number;
    tokens: number;
  };
  model2: {
    name: string;
    response: string;
    time: number;
    tokens: number;
  };
}

export default function ModelComparison() {
  const [prompt, setPrompt] = useState("");
  const [model1, setModel1] = useState("");
  const [model2, setModel2] = useState("");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const { toast } = useToast();

  const { data: models = [] } = useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const res = await fetch('/api/models?active=true');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json();
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      if (!prompt.trim() || !model1 || !model2 || model1 === model2) {
        throw new Error('Please provide a prompt and select two different models');
      }

      const startTime = Date.now();
      
      const [response1, response2] = await Promise.all([
        apiRequest('POST', '/api/chat/message', {
          message: prompt,
          modelId: model1,
          isGuest: true,
        }).then(res => res.json()),
        apiRequest('POST', '/api/chat/message', {
          message: prompt,
          modelId: model2,
          isGuest: true,
        }).then(res => res.json())
      ]);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      return {
        model1: {
          name: models.find((m: any) => m.id === model1)?.name || 'Model 1',
          response: response1.content,
          time: totalTime / 2, // Rough estimate since they ran in parallel
          tokens: response1.tokenCount || 0,
        },
        model2: {
          name: models.find((m: any) => m.id === model2)?.name || 'Model 2',
          response: response2.content,
          time: totalTime / 2,
          tokens: response2.tokenCount || 0,
        },
      };
    },
    onSuccess: (data) => {
      setComparison(data);
      toast({
        title: "Comparison complete",
        description: "Both models have responded. See results below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Comparison failed",
        description: error.message || "Failed to compare models",
        variant: "destructive",
      });
    },
  });

  const handleCompare = () => {
    compareMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Compare AI Models</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prompt to compare
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to test both models with..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Model 1
              </label>
              <Select value={model1} onValueChange={setModel1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Model 2
              </label>
              <Select value={model2} onValueChange={setModel2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id} disabled={model.id === model1}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={!prompt.trim() || !model1 || !model2 || model1 === model2 || compareMutation.isPending}
            className="w-full"
          >
            {compareMutation.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Comparing Models...
              </>
            ) : (
              <>
                <i className="fas fa-balance-scale mr-2"></i>
                Compare Models
              </>
            )}
          </Button>
        </div>
      </div>

      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-slate-900">{comparison.model1.name}</h4>
              <div className="flex space-x-4 text-xs text-slate-500 mt-1">
                <span>{comparison.model1.time}ms response time</span>
                <span>{comparison.model1.tokens} tokens</span>
              </div>
            </div>
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                  {comparison.model1.response}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-slate-900">{comparison.model2.name}</h4>
              <div className="flex space-x-4 text-xs text-slate-500 mt-1">
                <span>{comparison.model2.time}ms response time</span>
                <span>{comparison.model2.tokens} tokens</span>
              </div>
            </div>
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                  {comparison.model2.response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}