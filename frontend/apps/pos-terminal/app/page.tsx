'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid'; // Fallback for uuidv7 in standard lib

export default function Home() {
  const offlineOrders = useLiveQuery(() => db.offlineOrders.toArray());

  const addDummyOrder = async () => {
    try {
      await db.offlineOrders.add({
        id: uuidv4(),
        totalAmount: 19.99,
        status: 'PENDING_SYNC',
        lineItems: [{ productId: uuidv4(), quantity: 1, unitPrice: 19.99 }],
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to add order:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-2">POS Terminal</h1>
        <p className="text-green-600 font-semibold mb-8">● Online (Local-First Enabled)</p>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Offline Order Queue</h2>
            <button
              onClick={addDummyOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Simulate Offline Checkout
            </button>
          </div>

          {offlineOrders && offlineOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offlineOrders.map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{order.id.split('-')[0]}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No offline orders pending sync.</p>
          )}
        </div>
      </div>
    </main>
  );
}
