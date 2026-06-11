import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateReportPdf } from '../../utils/generateReportPdf';

const PUBLISHED_REPORTS = [
  {
    id: 'RPT-0003',
    date: '2026-06-07',
    track: 'Saratoga',
    races: 'Full Card (11)',
    description: 'Saturday Feature Card',
    status: 'Available'
  },
  {
    id: 'RPT-0002',
    date: '2026-06-06',
    track: 'Saratoga',
    races: 'All (12)',
    description: 'Belmont Stakes Day',
    status: 'Available'
  },
  {
    id: 'RPT-0001',
    date: '2026-05-24',
    track: 'Churchill Downs',
    races: '5–10',
    description: 'Memorial Day Weekend',
    status: 'Available'
  }
];

const PAST_ORDERS = [
  {
    id: 'ORD-0002',
    date: '2026-06-06',
    track: 'Saratoga',
    races: 'All (12)',
    strategies: 'Vuln Fave, Troubled Trip, S9',
    price: '$35.00',
    status: 'Delivered'
  },
  {
    id: 'ORD-0001',
    date: '2026-05-24',
    track: 'Churchill Downs',
    races: '5, 6, 7, 8, 9, 10',
    strategies: 'S1, S2, S4',
    price: '$20.00',
    status: 'Delivered'
  }
];

type Tab = 'reports' | 'orders';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  return (
    <div>
      <div className="bg-[#000080] text-white font-bold p-1 px-2 mb-6 flex justify-between items-center">
        <span>Dashboard — Member Area</span>
        <span className="text-xs font-mono bg-white text-[#000080] px-1">
          user_1337
        </span>
      </div>

      <div className="mb-8 bg-[#ffffcc] border-2 border-black p-4 shadow-outset">
        <h2 className="font-serif text-2xl font-bold text-web-red mb-2">
          WELCOME BACK.
        </h2>
        <p className="font-serif text-lg">
          You have <strong className="text-web-green">12 FREE PICKS</strong>{' '}
          remaining on your account.
        </p>
        <div className="mt-4">
          <Link
            to="/app/order"
            className="inline-block px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-white border-r-black border-b-black shadow-outset active:shadow-inset active:pt-2.5 active:pl-6.5">
            BUILD NEW ORDER &raquo;
          </Link>
        </div>
      </div>

      {/* Featured Video */}
      <div className="mb-8 bg-black border-2 border-[#000080] shadow-outset">
        <div className="bg-[#000080] text-white font-bold p-1 px-2 flex items-center gap-2">
          <span className="animate-pulse text-web-red">&#9654;</span>
          <span>LATEST DROP</span>
        </div>
        <div className="p-4">
          <video
            controls
            preload="metadata"
            className="w-full max-w-3xl mx-auto rounded"
            poster=""
          >
            <source src="/ftc-thursdays-massive-card.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p className="text-center text-gray-300 font-mono text-sm mt-3">
            Thursday's Massive Card — Full Breakdown
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-0">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-2 font-serif font-bold border-2 border-b-0 -mb-[2px] ${
            activeTab === 'reports'
              ? 'bg-white border-black z-10'
              : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
          }`}>
          PUBLISHED REPORTS
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 font-serif font-bold border-2 border-b-0 -mb-[2px] ml-1 ${
            activeTab === 'orders'
              ? 'bg-white border-black z-10'
              : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
          }`}>
          ORDERS
        </button>
      </div>

      {/* Tab Content */}
      <div className="border-2 border-t-0 border-black bg-white p-4">
        {activeTab === 'reports' && (
          <div>
            {PUBLISHED_REPORTS.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="web-table font-mono text-sm w-full min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="py-2">REPORT</th>
                      <th className="py-2">DATE</th>
                      <th className="py-2">TRACK</th>
                      <th className="py-2">RACES</th>
                      <th className="py-2">DESCRIPTION</th>
                      <th className="py-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PUBLISHED_REPORTS.map((report) => (
                      <tr key={report.id} className="hover:bg-[#ffffcc]">
                        <td className="font-bold text-web-blue underline cursor-pointer">
                          {report.id}
                        </td>
                        <td>{report.date}</td>
                        <td>{report.track}</td>
                        <td>{report.races}</td>
                        <td>{report.description}</td>
                        <td className="text-web-green font-bold">{report.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 font-serif italic">
                No published reports available.
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {PAST_ORDERS.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="web-table font-mono text-sm w-full min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="py-2">ORDER ID</th>
                      <th className="py-2">DATE</th>
                      <th className="py-2">TRACK</th>
                      <th className="py-2">RACES</th>
                      <th className="py-2">STRATEGIES</th>
                      <th className="py-2">PRICE</th>
                      <th className="py-2">STATUS</th>
                      <th className="py-2">REPORT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAST_ORDERS.map((order) => (
                      <tr key={order.id} className="hover:bg-[#ffffcc]">
                        <td className="font-bold text-web-blue underline cursor-pointer">
                          {order.id}
                        </td>
                        <td>{order.date}</td>
                        <td>{order.track}</td>
                        <td>{order.races}</td>
                        <td>{order.strategies}</td>
                        <td className="font-bold">{order.price}</td>
                        <td className="text-web-green font-bold">{order.status}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => generateReportPdf(order)}
                            className="web-link font-bold whitespace-nowrap">
                            Download PDF &darr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 font-serif italic">
                No past orders found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}