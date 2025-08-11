import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import ModelManagement from "@/components/admin/model-management";
import ApiSettings from "@/components/admin/api-settings";
import UserManagement from "@/components/admin/user-management";

type AdminViewType = 'admin-models' | 'admin-settings' | 'admin-users';

export default function Admin() {
  const [currentView, setCurrentView] = useState<AdminViewType>('admin-models');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (currentView) {
      case 'admin-models':
        return <ModelManagement />;
      case 'admin-settings':
        return <ApiSettings />;
      case 'admin-users':
        return <UserManagement />;
      default:
        return <ModelManagement />;
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
          isAdminView={true}
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
          isAdminView={true}
        />
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md shadow-sm border border-slate-300"
          data-testid="button-admin-mobile-menu"
        >
          <i className="fas fa-bars text-lg text-slate-800"></i>
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          {user ? (
            <button
              onClick={() => window.location.href = '/api/logout'}
              className="p-2 text-slate-400 hover:text-slate-600"
              data-testid="button-admin-mobile-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          ) : (
            <div className="w-8 h-8"></div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        {renderContent()}
      </div>
    </div>
  );
}
