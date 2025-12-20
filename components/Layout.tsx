import React from 'react';
import { useStore } from '../store';
import { ViewState } from '../types';
import { Header } from './Header';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Package, 
  Settings, 
  LogOut, 
  UploadCloud,
  HelpCircle
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setView, logout, user } = useStore();

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // -- PUBLIC LAYOUT (Not Logged In) --
  if (!user) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="bg-gray-50 min-h-[calc(100vh-64px)] overflow-y-auto">
                {children}
            </main>
        </div>
    );
  }

  // -- APP LAYOUT (Logged In) --
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            <PackagePlus className="mr-2" />
            CustomsDoc AI
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="NEW_SHIPMENT" icon={PackagePlus} label="New Shipment" />
          <NavItem view="BULK_IMPORT" icon={UploadCloud} label="Bulk Import" />
          <NavItem view="SHIPMENTS" icon={Package} label="History" />
          <NavItem view="SUPPORT" icon={HelpCircle} label="Support" />
          <NavItem view="SETTINGS" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
              {user.companyName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.companyName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20">
            <h1 className="text-lg font-bold text-blue-600">CustomsDoc AI</h1>
            <button onClick={logout} className="text-gray-500"><LogOut size={20}/></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-3 z-20">
           <button onClick={() => setView('DASHBOARD')} className={`p-2 rounded-lg ${currentView === 'DASHBOARD' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><LayoutDashboard size={24} /></button>
           <button onClick={() => setView('NEW_SHIPMENT')} className={`p-2 rounded-lg ${currentView === 'NEW_SHIPMENT' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><PackagePlus size={24} /></button>
           <button onClick={() => setView('SUPPORT')} className={`p-2 rounded-lg ${currentView === 'SUPPORT' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><HelpCircle size={24} /></button>
           <button onClick={() => setView('SHIPMENTS')} className={`p-2 rounded-lg ${currentView === 'SHIPMENTS' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}><Package size={24} /></button>
        </nav>
      </main>
    </div>
  );
};