import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MemoryBank from '../components/common/MemoryBank';
import PurchaseFollowUp from '../components/common/PurchaseFollowUp';
import ErrorBoundary from '../components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 w-full">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <MemoryBank />
      <PurchaseFollowUp />
    </div>
  );
};

export default MainLayout;
