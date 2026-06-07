import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
            <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{user?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">REPORTS</Link>
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
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
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif text-lg font-bold">{report.title}</h4>
                  <span className={`font-mono font-bold text-sm ${report.roi_pct > 0 ? 'text-web-green' : 'text-web-red'}`}>
                    {report.roi_pct > 0 ? '+' : ''}{report.roi_pct}% ROI
                  </span>
                </div>
                <div className="font-mono text-xs text-gray-600 mb-2">
                  {report.track} — {report.date} — {report.races_analyzed} races
                </div>
                <p className="font-serif text-sm">{report.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
