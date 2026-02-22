import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MilitaryArea from './MilitaryArea';
import InventoryArea from './InventoryArea';
import CautionArea from './CautionArea';
import { LogIn } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, login, errorMsg } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [password, setPassword] = useState('');

  // Authentication check removed as requested

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
      {activeTab === 'militar' && <MilitaryArea />}
      {activeTab === 'instrumento' && <InventoryArea />}
      {activeTab === 'cautela' && <CautionArea />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
