import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, Search, CheckCircle, Calendar } from 'lucide-react';

export default function ApprovedRISPage() {
  const [approvedRis, setApprovedRis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [risSearch, setRisSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const risRes = await api.get('/ris');
      
      // Filter for approved RIS within the last 48 hours (2 days)
      const now = Date.now();
      const twoDaysInMs = 48 * 60 * 60 * 1000;
      
      const filtered = risRes.data.filter((r: any) => {
        if (r.status !== 'approved') return false;
        const createdTime = new Date(r.createdAt).getTime();
        return (now - createdTime) <= twoDaysInMs;
      });

      // Sort by date descending
      filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setApprovedRis(filtered);
    } catch (err) {
      toast.error('Failed to fetch Approved RIS data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRIS = (ris: any) => {
    toast.success(`Downloading RIS No. ${ris.ris_no || ris.id}...`);
    const data = JSON.stringify(ris, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIS_${ris.ris_no || ris.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (approvedRis.length === 0) return toast.error('No RIS to download');
    toast.success(`Downloading all ${approvedRis.length} Approved RIS entries...`);
    approvedRis.forEach((ris, index) => {
      setTimeout(() => handleDownloadRIS(ris), index * 300);
    });
  };

  const filteredRis = approvedRis.filter(r => 
    r.ris_no?.toLowerCase().includes(risSearch.toLowerCase()) || 
    r.full_name?.toLowerCase().includes(risSearch.toLowerCase()) ||
    r.employee_id?.toLowerCase().includes(risSearch.toLowerCase())
  );

  // Group by date
  const groupedRis = filteredRis.reduce((acc: any, ris: any) => {
    const date = new Date(ris.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(ris);
    return acc;
  }, {});

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2340]">Approved RIS Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">View RIS approved by Admins within the last 2 days (before auto-deletion).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle size={20} />
            <h3>Approved RIS (Last 48 Hours)</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Download size={16} /> Download All
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search RIS, Name, ID..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={risSearch}
                onChange={(e) => setRisSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          {Object.keys(groupedRis).length > 0 ? (
            Object.keys(groupedRis).map(date => (
              <div key={date} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold border-b border-gray-200 pb-2">
                  <Calendar size={18} className="text-emerald-600" />
                  <h4>{date}</h4>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {groupedRis[date].length} items
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">RIS No.</th>
                        <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee</th>
                        <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                        <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedRis[date].map((ris: any) => (
                        <tr key={ris.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="p-3 font-medium text-gray-900 whitespace-nowrap">{ris.ris_no || `RIS-${ris.id}`}</td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{ris.full_name}</div>
                            <div className="text-xs text-gray-500">{ris.employee_id}</div>
                          </td>
                          <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(ris.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button 
                              onClick={() => handleDownloadRIS(ris)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                              title="Download RIS"
                            >
                              <Download size={16} />
                              <span className="text-xs font-bold">Download</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No approved RIS found within the last 2 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
