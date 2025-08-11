import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import VoiceInput from '@/components/features/voice-input';

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
        model: models.find((m: any) => m.id === variables.modelId)?.name || 'AI',
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

  const handleVoiceTranscript = (transcript: string) => {
    setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h2 className="text-lg font-semibold text-slate-900 hidden sm:block">AI Chat</h2>
            <h2 className="text-lg font-semibold text-slate-900 sm:hidden">Chat</h2>
            <div className="flex items-center space-x-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-32 md:w-48 text-sm">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="text-xs md:text-sm">{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewChat}
                className="text-slate-600 hidden sm:flex"
              >
                <i className="fas fa-plus mr-1"></i>New Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewChat}
                className="text-slate-600 sm:hidden"
              >
                <i className="fas fa-plus"></i>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500 hidden md:block">Connected</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4 md:space-y-6" style={{ height: 'calc(100vh - 220px)', paddingBottom: '80px' }}>
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-8 md:mt-12">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-robot text-white text-lg md:text-2xl"></i>
            </div>
            <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">Start a conversation</h3>
            <p className="text-sm md:text-base">Ask me anything! I'm here to help.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : ''} w-full`}>
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 mr-2 md:mr-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-white text-xs md:text-sm"></i>
                </div>
              </div>
            )}
            <div className={`${message.role === 'user' ? 'max-w-[85%] md:max-w-3xl' : 'flex-1 max-w-full md:max-w-4xl'}`}>
              <div className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 rounded-tl-md'
              }`}>
                <div className={`text-sm md:text-base ${message.role === 'user' ? 'whitespace-pre-wrap' : ''}`}>
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <div className="prose prose-sm md:prose max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-code:text-blue-600 prose-pre:bg-slate-50 prose-pre:border prose-blockquote:border-l-blue-500">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return (
                              <code className={`${className || 'bg-slate-100 px-1 py-0.5 rounded text-sm'}`} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="my-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="my-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-sm md:text-base">{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex items-center mt-1 space-x-2 px-1 ${
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
                {message.role === 'assistant' && (
                  <div className="flex space-x-1">
                    <button className="text-xs text-slate-400 hover:text-slate-600 p-1">
                      <i className="fas fa-copy"></i>
                    </button>
                    <button className="text-xs text-slate-400 hover:text-slate-600 p-1">
                      <i className="fas fa-thumbs-up"></i>
                    </button>
                    <button className="text-xs text-slate-400 hover:text-slate-600 p-1">
                      <i className="fas fa-thumbs-down"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {sendMessageMutation.isPending && (
          <div className="flex w-full">
            <div className="flex-shrink-0 mr-2 md:mr-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-xs md:text-sm"></i>
              </div>
            </div>
            <div className="flex-1 max-w-full md:max-w-4xl">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-3 md:px-4 py-2 md:py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-xs md:text-sm text-slate-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-slate-200 p-3 md:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2 md:space-x-4">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[50px] md:min-h-[60px] max-h-32 resize-none text-sm md:text-base"
                disabled={sendMessageMutation.isPending || !selectedModel}
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending || !selectedModel}
                className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                <i className="fas fa-paper-plane text-sm md:text-lg"></i>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 md:mt-3 text-xs md:text-sm text-slate-500">
            <div className="flex items-center space-x-2 md:space-x-3">
              <VoiceInput 
                onTranscript={handleVoiceTranscript} 
                disabled={sendMessageMutation.isPending || !selectedModel}
              />
              <span className="hidden sm:block text-xs text-slate-500">
                <i className="fas fa-info-circle mr-1"></i>
                Press Enter to send, Shift+Enter for new line
              </span>
              <span className="sm:hidden text-xs text-slate-500">
                <i className="fas fa-info-circle mr-1"></i>
                Enter to send
              </span>
              {!isAuthenticated && (
                <span className="text-orange-500">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  <span className="hidden md:inline">Sign in to save chat history</span>
                  <span className="md:hidden">Sign in to save</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!selectedModel && (
                <span className="text-red-500 text-xs">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  <span className="hidden sm:inline">Select a model first</span>
                  <span className="sm:hidden">Select model</span>
                </span>
              )}
              <span className="text-slate-400">
                {Math.ceil(inputMessage.length / 4)} tokens
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
