import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import ChatInterface from "@/components/chat/chat-interface";
import ChatHistory from "@/components/chat/chat-history";

type ViewType = 'chat' | 'history' | 'models';

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
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Models</h2>
              <p className="text-slate-600">
                Model information and selection is available in the chat interface.
              </p>
            </div>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
