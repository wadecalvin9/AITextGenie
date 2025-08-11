import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import ModelManagement from "@/components/admin/model-management";
import ApiSettings from "@/components/admin/api-settings";
import UserManagement from "@/components/admin/user-management";

type AdminViewType = 'admin-models' | 'admin-settings' | 'admin-users';

export default function Admin() {
  const [currentView, setCurrentView] = useState<AdminViewType>('admin-models');
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
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        isAdminView={true}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
