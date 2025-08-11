import { config } from '../config';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

interface ChatCompletionResponse {
  content: string;
  tokenCount: number;
  model: string;
}

export class OpenRouterService {
  private baseUrl = config.openRouter.baseUrl;

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openRouter.referer,
          'X-Title': 'AI Chat Platform',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      const choice = data.choices[0];
      const content = choice.message?.content || '';
      const tokenCount = data.usage?.total_tokens || 0;

      return {
        content,
        tokenCount,
        model: request.model,
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async getAvailableModels(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      throw error;
    }
  }
}
