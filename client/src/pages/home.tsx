import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import ChatHistory from "@/components/chat/chat-history";
import FileUpload from "@/components/features/file-upload";
import ModelComparison from "@/components/features/model-comparison";
import ModelsPage from "@/components/pages/models-page";

type ViewType = 'chat' | 'history' | 'models' | 'files' | 'compare';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'history':
        return <ChatHistory />;
      case 'models':
        return <ModelsPage />;
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
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-check-circle text-green-600 mt-0.5"></i>
                    <div>
                      <h4 className="font-medium text-green-800">File Upload Active</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Upload files and reference them in your chat conversations. Text files and JSON files are automatically processed for AI analysis.
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

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setIsMobileSidebarOpen(false);
          }}
          user={user}
        />
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md shadow-sm border border-slate-300"
          data-testid="button-mobile-menu"
        >
          <i className="fas fa-bars text-lg text-slate-800"></i>
        </button>
        <h1 className="text-lg font-semibold text-slate-900">AI Platform</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          {user ? (
            <button
              onClick={() => window.location.href = '/api/logout'}
              className="p-2 text-slate-400 hover:text-slate-600"
              data-testid="button-mobile-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          ) : (
            <div className="w-8 h-8"></div>
          )}
        </div>
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
      <div className="flex-1 flex flex-col overflow-hidden mb-16 md:mb-0 pt-16 md:pt-0">
        {renderContent()}
      </div>
    </div>
  );
}
