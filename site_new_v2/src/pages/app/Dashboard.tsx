import React from 'react';
import { Link } from 'react-router-dom';
import { generateReportPdf } from '../../utils/generateReportPdf';
// Mock data for past orders
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
}];

export function Dashboard() {
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

      <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
        PAST ORDERS
      </h3>

      {PAST_ORDERS.length > 0 ?
      <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
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
              {PAST_ORDERS.map((order) =>
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
            )}
            </tbody>
          </table>
        </div> :

      <div className="bg-white border-2 border-gray-400 p-8 text-center text-gray-500 font-serif italic">
          No past orders found.
        </div>
      }
    </div>);

}