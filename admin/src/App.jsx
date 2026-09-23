import React, { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Topbar } from './components/common/Topbar';
import { Dashboard } from './pages/Dashboard';
import { LiveOrders } from './pages/LiveOrders';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { DeliveryZones } from './pages/DeliveryZones';
import { Drivers } from './pages/Drivers';
import { Customers } from './pages/Customers';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const titles = {
    'dashboard': 'Operations Dashboard',
    'live-orders': 'Live Order Processing',
    'products': 'Product Catalog Management',
    'categories': 'Categories',
    'delivery-zones': 'Delivery Zones & Geofencing',
    'drivers': 'Delivery Fleet & Drivers',
    'customers': 'Customer Directory',
    'analytics': 'Analytics & Performance',
    'settings': 'Platform & Security Settings'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'live-orders': return <LiveOrders />;
      case 'products': return <Products />;
      case 'categories': return <Categories />;
      case 'delivery-zones': return <DeliveryZones />;
      case 'drivers': return <Drivers />;
      case 'customers': return <Customers />;
      case 'analytics': return <Analytics />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="admin-main">
        <Topbar title={titles[activeTab]} activeTab={activeTab} />
        <main className="admin-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
