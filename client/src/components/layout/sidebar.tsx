import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  user?: any;
  isAdminView?: boolean;
}

export default function Sidebar({ currentView, onViewChange, user, isAdminView = false }: SidebarProps) {
  const [, setLocation] = useLocation();

  const handleNavigation = (view: string) => {
    if (view.startsWith('admin-') && !isAdminView) {
      setLocation('/admin');
    } else if (!view.startsWith('admin-') && isAdminView) {
      // When going back to chat from admin, reset to chat view
      setLocation('/?view=chat');
    } else {
      onViewChange(view);
    }
  };

  const isActive = (view: string) => currentView === view;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">AI Platform</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {!isAdminView ? (
          <>
            <button
              onClick={() => handleNavigation('chat')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('chat')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-comments w-5 text-center"></i>
              <span className={isActive('chat') ? 'font-medium' : ''}>Chat</span>
            </button>
            <button
              onClick={() => handleNavigation('history')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('history')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-history w-5 text-center"></i>
              <span>Chat History</span>
            </button>
            <button
              onClick={() => handleNavigation('models')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('models')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-brain w-5 text-center"></i>
              <span>Models</span>
            </button>
            <button
              onClick={() => handleNavigation('compare')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('compare')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-balance-scale w-5 text-center"></i>
              <span>Compare Models</span>
            </button>

          </>
        ) : (
          <>
            <button
              onClick={() => {
                setLocation('/');
                // Force page reload to reset state properly
                window.location.href = '/';
              }}
              className="nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-arrow-left w-5 text-center"></i>
              <span>Back to Chat</span>
            </button>
          </>
        )}
        
        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</h3>
            <button
              onClick={() => handleNavigation('admin-models')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('admin-models')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-cogs w-5 text-center"></i>
              <span>Manage Models</span>
            </button>
            <button
              onClick={() => handleNavigation('admin-settings')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('admin-settings')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-key w-5 text-center"></i>
              <span>API Settings</span>
            </button>
            <button
              onClick={() => handleNavigation('admin-users')}
              className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                isActive('admin-users')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-users w-5 text-center"></i>
              <span>Users</span>
            </button>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        {user ? (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl} alt="User Avatar" />
              <AvatarFallback>
                {user.firstName?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.firstName || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-500">
                {user.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-600 p-1"
              onClick={() => window.location.href = '/api/logout'}
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Guest Mode</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
