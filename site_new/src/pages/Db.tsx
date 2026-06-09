import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Db() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customSql, setCustomSql] = useState('');
  const [customResult, setCustomResult] = useState<any[] | null>(null);
  const [customCols, setCustomCols] = useState<string[]>([]);
  const [error, setError] = useState('');

  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    runQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
      .then(data => {
        if (data?.rows) setTables(data.rows.map((r: any) => r.table_name));
      });
  }, [token, navigate]);

  const runQuery = async (sql: string, params?: any[]) => {
    const res = await fetch('/api/admin/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ADMIN_SECRET || 'ftc-admin'}` },
      body: JSON.stringify({ sql, params })
    });
    return res.json();
  };

  const loadTable = async (table: string, pg = 0, searchTerm = '') => {
    setLoading(true);
    setSelectedTable(table);
    setPage(pg);
    setError('');

    const countSql = searchTerm
      ? `SELECT COUNT(*) as cnt FROM ${table} WHERE ${table}::text ILIKE $1`
      : `SELECT COUNT(*) as cnt FROM ${table}`;

    const countData = await runQuery(
      `SELECT COUNT(*) as cnt FROM "${table}"`,
    );
    const cnt = parseInt(countData?.rows?.[0]?.cnt || '0');
    setTotal(cnt);

    let dataSql = `SELECT * FROM "${table}" ORDER BY 1 DESC LIMIT ${PAGE_SIZE} OFFSET ${pg * PAGE_SIZE}`;
    if (searchTerm) {
      dataSql = `SELECT * FROM "${table}" WHERE "${table}"::text ILIKE '%${searchTerm}%' ORDER BY 1 DESC LIMIT ${PAGE_SIZE} OFFSET ${pg * PAGE_SIZE}`;
    }

    const data = await runQuery(dataSql);
    if (data?.error) {
      setError(data.error);
      setRows([]);
      setColumns([]);
    } else if (data?.rows?.length > 0) {
      setColumns(Object.keys(data.rows[0]));
      setRows(data.rows);
    } else {
      setColumns([]);
      setRows([]);
    }
    setLoading(false);
  };

  const runCustom = async () => {
    if (!customSql.trim()) return;
    setError('');
    const data = await runQuery(customSql);
    if (data?.error) {
      setError(data.error);
      setCustomResult(null);
      setCustomCols([]);
    } else if (data?.rows?.length > 0) {
      setCustomCols(Object.keys(data.rows[0]));
      setCustomResult(data.rows);
    } else {
      setCustomCols([]);
      setCustomResult([]);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen font-mono p-4 bg-[#1a1a2e] text-[#eee]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold mb-4 text-[#00ff88]">FTC DATABASE</h1>

        {/* Table list */}
        <div className="flex gap-2 flex-wrap mb-4">
          {tables.map(t => (
            <button
              key={t}
              onClick={() => { setSearch(''); loadTable(t); }}
              className={`px-3 py-1 text-xs border ${selectedTable === t ? 'border-[#00ff88] text-[#00ff88] bg-[#0a0a1a]' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Custom SQL */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              value={customSql}
              onChange={e => setCustomSql(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runCustom(); }}
              placeholder="SELECT * FROM ..."
              className="flex-1 px-3 py-2 bg-[#0a0a1a] border border-gray-600 text-sm text-white focus:border-[#00ff88] outline-none"
            />
            <button
              onClick={runCustom}
              className="px-4 py-2 bg-[#00ff88] text-black font-bold text-sm hover:bg-[#00cc66]"
            >
              RUN
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 text-sm">{error}</div>
        )}

        {/* Custom results */}
        {customResult !== null && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{customResult.length} rows</span>
              <button onClick={() => { setCustomResult(null); setCustomCols([]); }} className="text-xs text-gray-500 hover:text-white">Clear</button>
            </div>
            {customResult.length > 0 && (
              <div className="overflow-x-auto border border-gray-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0a0a1a]">
                      {customCols.map(c => <th key={c} className="px-3 py-2 text-left text-[#00ff88] border-b border-gray-700">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {customResult.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-[#0a0a1a]">
                        {customCols.map(c => <td key={c} className="px-3 py-1.5 max-w-[200px] truncate">{formatCell(row[c])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Table browser */}
        {selectedTable && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-sm font-bold text-[#00ff88]">{selectedTable}</h2>
              <span className="text-xs text-gray-500">{total} rows</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadTable(selectedTable, 0, search); }}
                placeholder="Search..."
                className="px-2 py-1 bg-[#0a0a1a] border border-gray-600 text-xs text-white focus:border-[#00ff88] outline-none w-48"
              />
              <button
                onClick={() => loadTable(selectedTable, 0, search)}
                className="text-xs text-[#00ff88] hover:underline"
              >
                Go
              </button>
            </div>

            {loading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="text-gray-500 text-sm">No rows.</div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-700 mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#0a0a1a]">
                        {columns.map(c => <th key={c} className="px-3 py-2 text-left text-[#00ff88] border-b border-gray-700 whitespace-nowrap">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-[#0a0a1a]">
                          {columns.map(c => <td key={c} className="px-3 py-1.5 max-w-[200px] truncate">{formatCell(row[c])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-4">
                  <button
                    disabled={page === 0}
                    onClick={() => loadTable(selectedTable, page - 1, search)}
                    className="text-xs px-3 py-1 border border-gray-600 disabled:opacity-30 hover:border-[#00ff88]"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => loadTable(selectedTable, page + 1, search)}
                    className="text-xs px-3 py-1 border border-gray-600 disabled:opacity-30 hover:border-[#00ff88]"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCell(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  const s = String(val);
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
}
