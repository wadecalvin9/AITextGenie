import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import ChatHistory from "@/components/chat/chat-history";
import FileUpload from "@/components/features/file-upload";
import ModelComparison from "@/components/features/model-comparison";

type ViewType = 'chat' | 'history' | 'models' | 'files' | 'compare';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const { user } = useAuth();

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'history':
        return <ChatHistory />;
      case 'models':
        return (
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Available Models</h2>
              <div className="bg-white rounded-lg border p-4 md:p-6 mb-6">
                <p className="text-slate-600 mb-4">
                  Model selection is available in the chat interface. Here's what's currently active:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-800">GPT-4o Mini</h3>
                    <p className="text-sm text-slate-600">Fast and efficient OpenAI model</p>
                    <div className="text-xs text-slate-500 mt-2">16K context • $0.15/1K tokens</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-800">Claude 3.5 Sonnet</h3>
                    <p className="text-sm text-slate-600">Powerful Anthropic model</p>
                    <div className="text-xs text-slate-500 mt-2">200K context • $3.00/1K tokens</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-800">Gemini Pro 1.5</h3>
                    <p className="text-sm text-slate-600">Google's advanced model</p>
                    <div className="text-xs text-slate-500 mt-2">2M context • $1.25/1K tokens</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">File Upload</h2>
              <div className="bg-white rounded-lg border p-4 md:p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Files for AI Analysis</h3>
                  <p className="text-slate-600">
                    Upload images, documents, and other files to analyze them with AI. Supported formats include:
                  </p>
                  <ul className="list-disc ml-5 mt-2 text-sm text-slate-600">
                    <li>Images (JPG, PNG, GIF, WebP)</li>
                    <li>Text files (TXT, MD, CSV)</li>
                    <li>Documents (PDF)</li>
                    <li>Data files (JSON)</li>
                  </ul>
                </div>
                <FileUpload />
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                    <div>
                      <h4 className="font-medium text-yellow-800">Coming Soon</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        File analysis integration with AI models is currently in development. 
                        You can upload files now, and they'll be ready when this feature launches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'compare':
        return (
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">Model Comparison</h2>
              <ModelComparison />
            </div>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          user={user}
        />
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex flex-col items-center p-1.5 min-w-0 ${
              currentView === 'chat' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <i className="fas fa-comments text-base mb-0.5"></i>
            <span className="text-xs truncate">Chat</span>
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center p-1.5 min-w-0 ${
              currentView === 'history' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <i className="fas fa-history text-base mb-0.5"></i>
            <span className="text-xs truncate">History</span>
          </button>
          <button
            onClick={() => setCurrentView('compare')}
            className={`flex flex-col items-center p-1.5 min-w-0 ${
              currentView === 'compare' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <i className="fas fa-balance-scale text-base mb-0.5"></i>
            <span className="text-xs truncate">Compare</span>
          </button>
          <button
            onClick={() => setCurrentView('files')}
            className={`flex flex-col items-center p-1.5 min-w-0 ${
              currentView === 'files' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <i className="fas fa-file-upload text-base mb-0.5"></i>
            <span className="text-xs truncate">Files</span>
          </button>
          <button
            onClick={() => setCurrentView('models')}
            className={`flex flex-col items-center p-1.5 min-w-0 ${
              currentView === 'models' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <i className="fas fa-brain text-base mb-0.5"></i>
            <span className="text-xs truncate">Models</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden mb-16 md:mb-0">
        {renderContent()}
      </div>
    </div>
  );
}
