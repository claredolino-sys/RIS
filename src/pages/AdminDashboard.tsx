import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Inbox, Package, CheckCircle, Clock, TrendingUp, TrendingDown, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRis: 0,
    approvedRis: 0,
    totalInventory: 0,
    lowStock: 0
  });

  const [analytics, setAnalytics] = useState({
    mostRequested: [] as any[],
    leastRequested: [] as any[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [risRes, invRes, allRisRes] = await Promise.all([
          api.get('/ris/inbox'),
          api.get('/inventory'),
          api.get('/ris')
        ]);

        const ris = risRes.data;
        const inventory = invRes.data;
        const allRis = allRisRes.data;

        setStats({
          pendingRis: ris.filter((r: any) => r.status === 'pending' || r.status === 'sent').length,
          approvedRis: ris.filter((r: any) => r.status === 'approved').length,
          totalInventory: inventory.length,
          lowStock: inventory.filter((i: any) => i.quantity < 10).length
        });

        // Calculate Analytics (Filtered by Current Month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const itemRequestCounts: Record<number, { count: number, totalQty: number, name: string, stock_no: string, remaining: number }> = {};
        
        inventory.forEach((item: any) => {
          itemRequestCounts[item.id] = {
            count: 0,
            totalQty: 0,
            name: item.description,
            stock_no: item.stock_no,
            remaining: item.quantity
          };
        });

        allRis.forEach((r: any) => {
          const risDate = new Date(r.created_at || r.date);
          const isCurrentMonth = risDate.getMonth() === currentMonth && risDate.getFullYear() === currentYear;

          if (r.status !== 'draft' && r.items && isCurrentMonth) {
            r.items.forEach((reqItem: any) => {
              if (reqItem.inventory_id && itemRequestCounts[reqItem.inventory_id]) {
                itemRequestCounts[reqItem.inventory_id].count += 1;
                itemRequestCounts[reqItem.inventory_id].totalQty += Number(reqItem.quantity_requisition) || 0;
              }
            });
          }
        });

        const analyticsArray = Object.values(itemRequestCounts);
        
        // Sort by total quantity requested (descending) for most requested
        const mostRequested = [...analyticsArray].sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);
        
        // Sort by total quantity requested (ascending) for least requested / leftovers
        const leastRequested = [...analyticsArray].sort((a, b) => a.totalQty - b.totalQty).slice(0, 10);

        setAnalytics({
          mostRequested,
          leastRequested
        });

      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2340]">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.full_name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending RIS</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingRis}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Approved RIS</p>
            <p className="text-2xl font-bold text-gray-900">{stats.approvedRis}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalInventory}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <Inbox size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Most Requested Items</h2>
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FileText size={14} />
              View Monthly Report
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Top 10 items frequently requisitioned this month.</p>
          <div className="space-y-4">
            {analytics.mostRequested.length > 0 ? analytics.mostRequested.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.stock_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{item.totalQty} requested</p>
                  <p className="text-xs text-gray-500">{item.remaining} left in stock</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 italic">No data available for this month.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="text-blue-500" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Least Requested Items</h2>
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FileText size={14} />
              View Monthly Report
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Top 10 items with leftovers or rarely requisitioned this month.</p>
          <div className="space-y-4">
            {analytics.leastRequested.length > 0 ? analytics.leastRequested.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.stock_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{item.totalQty} requested</p>
                  <p className="text-xs text-gray-500">{item.remaining} left in stock</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 italic">No data available for this month.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
