import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AppLayout } from './components/app/AppLayout';
import { Dashboard } from './pages/app/Dashboard';
import { Strategies } from './pages/app/Strategies';
import { OrderBuilder } from './pages/app/OrderBuilder';
import { Account } from './pages/app/Account';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="strategies" element={<Strategies />} />
          <Route path="order" element={<OrderBuilder />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>);

}