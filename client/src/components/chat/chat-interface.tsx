import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available models
  const { data: models = [] } = useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const res = await fetch('/api/models?active=true');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json();
    },
  });

  // Set default model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, modelId }: { message: string; modelId: string }) => {
      const response = await apiRequest('POST', '/api/chat/message', {
        message,
        modelId,
        sessionId: currentSession,
        isGuest: !isAuthenticated,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        model: models.find(m => m.id === variables.modelId)?.name || 'AI',
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session ID if new
      if (data.sessionId && !currentSession) {
        setCurrentSession(data.sessionId);
      }

      // Invalidate chat sessions to refresh history
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      }
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedModel) return;
    if (sendMessageMutation.isPending) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage.trim();
    setInputMessage("");

    // Send to API
    sendMessageMutation.mutate({ message: messageContent, modelId: selectedModel });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSession(null);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-slate-900">AI Chat</h2>
            <div className="flex items-center space-x-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewChat}
                className="text-slate-600"
              >
                <i className="fas fa-plus mr-1"></i>New Chat
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Connected</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-robot text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Start a conversation</h3>
            <p>Ask me anything! I'm here to help.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
              </div>
            )}
            <div className={`max-w-3xl ${message.role === 'user' ? 'flex-shrink-0' : 'flex-1'}`}>
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 rounded-tl-md'
              }`}>
                <div className={`whitespace-pre-wrap ${message.role === 'user' ? '' : 'prose prose-sm max-w-none'}`}>
                  {message.content}
                </div>
              </div>
              <div className={`flex items-center mt-1 space-x-2 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}>
                <span className="text-xs text-slate-500">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                {message.role === 'user' ? (
                  <span className="text-xs text-slate-500">You</span>
                ) : (
                  <span className="text-xs text-slate-500">{message.model || 'AI'}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {sendMessageMutation.isPending && (
          <div className="flex">
            <div className="flex-shrink-0 mr-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm text-slate-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-slate-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Shift + Enter for new line)"
                className="min-h-[60px] resize-none"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !selectedModel || sendMessageMutation.isPending}
              className="px-6 py-3"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            {!isAuthenticated ? (
              <span>Sign in to save your chat history</span>
            ) : (
              <span>Your messages are automatically saved</span>
            )}
            <span className="flex items-center space-x-1">
              <span>{Math.ceil(inputMessage.length / 4)}</span>
              <span>/</span>
              <span>4096 tokens</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
