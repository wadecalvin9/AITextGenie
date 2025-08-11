import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function ChatHistory() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: isAuthenticated,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      toast({
        title: "Success",
        description: "Chat session deleted successfully.",
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
        description: "Failed to delete chat session.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  if (isLoading || sessionsLoading) {
    return (
      <div className="flex-1 p-3 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Chat History</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
              onClick={() => {
                if (confirm('Are you sure you want to clear all chat history?')) {
                  // TODO: Implement clear all history
                  toast({
                    title: "Feature Coming Soon",
                    description: "Clear all history feature will be implemented soon.",
                  });
                }
              }}
            >
              <i className="fas fa-trash mr-2"></i>
              <span className="hidden sm:inline">Clear History</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center mt-12">
            <div className="text-slate-400 mb-4">
              <i className="fas fa-history text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No chat history yet</h3>
            <p className="text-slate-600 mb-4">Start a conversation to see your chat history here</p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/'}
            >
              Start Chatting
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: any) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // Navigate to chat with session context
                  window.location.href = `/?sessionId=${session.id}`;
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 mb-1">{session.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {session.title.length > 100 ? session.title.substring(0, 100) + '...' : session.title}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      {session.model && <span>{session.model.name}</span>}
                      <span>{session.messageCount || 0} messages</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-500"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    disabled={deleteSessionMutation.isPending}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
