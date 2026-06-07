import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Report {
  id: number;
  title: string;
  track: string;
  date: string;
  races_analyzed: number;
  roi_pct: number;
  summary: string;
}

export function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('ftc_token');
    const storedUser = localStorage.getItem('ftc_user');

    if (!token) {
      navigate('/');
      return;
    }

    setUser(storedUser ? JSON.parse(storedUser) : null);

    fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('ftc_token');
          localStorage.removeItem('ftc_user');
          navigate('/');
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-18 h-18" />
              <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            </div>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{user?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">DASHBOARD</Link>
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        {/* Welcome */}
        <div className="bg-[#ffffcc] border-2 border-black p-4 shadow-outset mb-6">
          <h2 className="font-serif text-xl font-bold text-web-red mb-1">
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Welcome.'}
          </h2>
          <p className="font-serif">
            Race day analyses appear here after each card we run through the model.
          </p>
        </div>

        {/* Reports list */}
        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          PUBLISHED REPORTS
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No reports published yet. Check back after the next race day.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(
              reports.reduce((groups: Record<string, Report[]>, report) => {
                const dateKey = report.date.split('T')[0];
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(report);
                return groups;
              }, {})
            ).map(([date, dateReports]) => (
              <div key={date}>
                <h4 className="font-mono text-sm font-bold bg-black text-white inline-block px-2 py-1 mb-3">
                  {date}
                </h4>
                <div className="space-y-3">
                  {dateReports.map(report => (
                    <div key={report.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4">
                      <div className="shrink-0 flex flex-col items-center justify-center cursor-pointer hover:opacity-70">
                        <svg width="48" height="60" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 0H33L48 15V60H0V0Z" fill="#f5f5f5" stroke="black" strokeWidth="2"/>
                          <path d="M33 0L48 15H33V0Z" fill="#ddd" stroke="black" strokeWidth="1"/>
                          <text x="24" y="38" textAnchor="middle" fontFamily="monospace" fontSize="7" fontWeight="bold" fill="#c00">PDF</text>
                          <text x="24" y="52" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="#666">REPORT</text>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-serif text-lg font-bold">{report.title}</h4>
                          <span className={`font-mono font-bold text-sm ${report.roi_pct > 0 ? 'text-web-green' : 'text-web-red'}`}>
                            {report.roi_pct > 0 ? '+' : ''}{report.roi_pct}% ROI
                          </span>
                        </div>
                        <div className="font-mono text-xs text-gray-600 mb-2">
                          {report.track} — {report.races_analyzed} races
                        </div>
                        <p className="font-serif text-sm">{report.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
