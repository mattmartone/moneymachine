import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
  {
    path: '/app',
    label: 'DASHBOARD'
  },
  {
    path: '/app/strategies',
    label: 'STRATEGIES'
  },
  {
    path: '/app/order',
    label: 'NEW ORDER'
  },
  {
    path: '/app/account',
    label: 'ACCOUNT'
  }];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };
  return (
    <div className="min-h-screen font-sans p-2 md:p-4 bg-web-gray flex justify-center">
      <div className="w-full max-w-5xl bg-web-gray border-2 border-white border-r-black border-b-black shadow-outset flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-web-gray border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8 border-b-2 border-gray-400 pb-4">
            <Logo className="w-12 h-12" />
            <div className="font-serif font-bold leading-tight">
              FADE THE
              <br />
              CHALK
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 font-bold border-2 ${isActive ? 'bg-white border-black shadow-inset pt-2.5 pl-4.5' : 'bg-web-gray border-white border-r-black border-b-black shadow-outset hover:bg-gray-300'}`}>
                  
                  {item.label}
                </Link>);

            })}
          </nav>

          <div className="mt-8 pt-4 border-t-2 border-gray-400">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 font-bold bg-web-gray border-2 border-white border-r-black border-b-black shadow-outset hover:bg-gray-300 active:shadow-inset active:pt-2.5 active:pl-4.5 text-left">
              
              SIGN OUT
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 bg-web-paper shadow-inset overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>);

}