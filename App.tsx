import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { NewShipmentForm } from './components/NewShipmentForm';
import { ShipmentsList } from './components/ShipmentsList';
import { BulkUpload } from './components/BulkUpload';
import { Settings } from './components/Settings';
import { SupportPage } from './components/SupportPage';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { useStore } from './store';

const App: React.FC = () => {
  const { user, currentView } = useStore();

  const renderView = () => {
    // If not logged in and on Dashboard view, show Landing Page
    if (!user && currentView === 'DASHBOARD') {
        return <LandingPage />;
    }

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard />;
      case 'NEW_SHIPMENT': return <NewShipmentForm />;
      case 'SHIPMENTS': return <ShipmentsList />;
      case 'BULK_IMPORT': return <BulkUpload />;
      case 'SETTINGS': return <Settings />;
      case 'SUPPORT': return <SupportPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <LoginModal />
      <Layout>
        <div className="animate-in fade-in duration-300">
          {renderView()}
        </div>
      </Layout>
    </>
  );
};

export default App;