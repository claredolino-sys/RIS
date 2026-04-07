import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminGlobalNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allRis, setAllRis] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user?.role === 'superadmin' && !dismissed) {
      fetchData();
      // Optional: Poll every minute to check for new deletion warnings
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [user, dismissed]);

  const fetchData = async () => {
    try {
      // Trigger cleanup check to generate any pending notifications
      await api.get('/users/stats'); 
      
      const [notifRes, risRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/ris')
      ]);
      setNotifications(notifRes.data);
      setAllRis(risRes.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
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

  const handleDownloadAllPending = () => {
    const pendingIds = notifications.map(n => n.id.replace('deletion_warning_', ''));
    const pendingRis = allRis.filter(r => pendingIds.includes(String(r.id)));
    
    if (pendingRis.length === 0) {
      toast.error('No matching RIS found for these notifications');
      return;
    }

    toast.success(`Downloading ${pendingRis.length} RIS entries...`);
    pendingRis.forEach((ris, index) => {
      setTimeout(() => handleDownloadRIS(ris), index * 500);
    });
    
    // Auto-dismiss after downloading
    setTimeout(() => setDismissed(true), 1000);
  };

  if (user?.role !== 'superadmin' || notifications.length === 0 || dismissed) return null;

  return (
    <div className="fixed inset-0 bg-[#1A2340] z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-3xl w-full">
        <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-[0_0_30px_rgba(249,115,22,0.6)]">
          <AlertTriangle size={48} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">URGENT: 2-DAY RIS DELETION WARNING</h1>
        <p className="text-xl text-orange-200 mb-10 leading-relaxed">
          The following Requisition and Issue Slips (RIS) are approaching their <strong>48-hour retention limit</strong> and are scheduled for permanent auto-deletion. 
          Please download and archive them immediately to prevent data loss.
        </p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-10 max-h-[40vh] overflow-y-auto border border-white/20 shadow-2xl">
          <div className="space-y-4">
            {notifications.map(n => (
              <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 text-left gap-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
                  <span className="text-white font-medium text-lg">{n.message}</span>
                </div>
                <span className="text-orange-300 text-sm font-mono bg-orange-500/20 px-3 py-1 rounded-lg whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button 
            onClick={handleDownloadAllPending}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-black text-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(249,115,22,0.4)] flex items-center justify-center gap-3"
          >
            <Download size={28} /> DOWNLOAD ALL PENDING RIS
          </button>
          <button 
            onClick={() => setDismissed(true)} 
            className="w-full sm:w-auto px-8 py-5 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20"
          >
            I UNDERSTAND, PROCEED TO APP
          </button>
        </div>
      </div>
    </div>
  );
}
