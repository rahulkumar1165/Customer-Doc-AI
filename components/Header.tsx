import React from 'react';
import { PackagePlus } from 'lucide-react';
import { useStore } from '../store';

export const Header: React.FC = () => {
  const { setLoginModalOpen, setView } = useStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setView('DASHBOARD')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                <PackagePlus className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">CustomsDoc AI</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => setView('SUPPORT')}
              className="text-gray-500 hover:text-gray-900 font-medium"
            >
              Support
            </button>
            <a href="#" className="text-gray-500 hover:text-gray-900 font-medium">Pricing</a>
            <button 
                onClick={() => setLoginModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
                Log In
            </button>
          </nav>

          <div className="md:hidden">
              <button onClick={() => setLoginModalOpen(true)} className="text-blue-600 font-bold">Log In</button>
          </div>
        </div>
      </div>
    </header>
  );
};