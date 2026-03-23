import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdf';
import { Download, Send, Printer, Eye, Edit, X } from 'lucide-react';

export default function EmployeeRISPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewingRis, setViewingRis] = useState<any>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/ris/my');
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndSend = async (ris: any) => {
    if (!window.confirm(`This will send your RIS to your Department Admin and open the print dialog. Proceed?`)) return;
    
    try {
      await api.post(`/ris/${ris.id}/send`);
      toast.success('RIS sent to Admin successfully');
      
      handleViewRis(ris.id, true);
      fetchRecords();
    } catch (err) {
      toast.error('Failed to process request');
    }
  };

  const handleViewRis = async (id: number, print = false) => {
    try {
      const res = await api.get(`/ris/${id}`);
      setViewingRis(res.data);
      if (print) {
        setTimeout(() => {
          window.print();
        }, 100);
      }
    } catch (err) {
      toast.error('Failed to fetch RIS details');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2340]">My RIS Records</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your Requisition and Issue Slips</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Edit size={16} />
          New RIS
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">RIS No.</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No RIS records found.</td></tr>
            ) : records.map(ris => (
              <tr key={ris.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">
                  {ris.ris_no || <span className="text-gray-400 italic">Pending</span>}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(ris.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                  {ris.purpose || '-'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${ris.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                      ris.status === 'sent' ? 'bg-blue-100 text-blue-800' : 
                      ris.status === 'received' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {ris.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleViewRis(ris.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                    <Eye size={18} />
                  </button>
                  {ris.status === 'draft' && (
                    <button 
                      onClick={() => handleDownloadAndSend(ris)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      <Send size={14} />
                      Download & Send
                    </button>
                  )}
                  {ris.status !== 'draft' && (
                    <button onClick={() => handleViewRis(ris.id, true)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Print / Download PDF">
                      <Download size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingRis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:bg-white print:static print:inset-auto print:flex-col print:z-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Requisition and Issue Slip Details</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => setViewingRis(null)} className="text-gray-400 hover:text-gray-600 p-2">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto print:overflow-visible print:p-0">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase">Requisition and Issue Slip</h1>
                <p className="text-sm mt-1">Entity Name: <span className="font-semibold border-b border-black px-4">{viewingRis.entity_name || '_________________'}</span></p>
                <p className="text-sm mt-1">Fund Cluster: <span className="font-semibold border-b border-black px-4">{viewingRis.fund_cluster || '_________________'}</span></p>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p>Division: <span className="font-semibold border-b border-black px-4">{viewingRis.division || '_________________'}</span></p>
                  <p className="mt-1">Office: <span className="font-semibold border-b border-black px-4">{viewingRis.office || '_________________'}</span></p>
                </div>
                <div className="text-right">
                  <p>Responsibility Center Code: <span className="font-semibold border-b border-black px-4">{viewingRis.responsibility_center_code || '_________________'}</span></p>
                  <p className="mt-1">RIS No.: <span className="font-semibold border-b border-black px-4">{viewingRis.ris_no || '_________________'}</span></p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-black text-sm mb-4">
                <thead>
                  <tr>
                    <th colSpan={4} className="border border-black p-2 text-center font-bold">Requisition</th>
                    <th colSpan={2} className="border border-black p-2 text-center font-bold">Stock Available?</th>
                    <th colSpan={2} className="border border-black p-2 text-center font-bold">Issue</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-black p-2 text-center">Stock No.</th>
                    <th className="border border-black p-2 text-center">Unit</th>
                    <th className="border border-black p-2 text-center">Description</th>
                    <th className="border border-black p-2 text-center">Quantity</th>
                    <th className="border border-black p-2 text-center">Yes</th>
                    <th className="border border-black p-2 text-center">No</th>
                    <th className="border border-black p-2 text-center">Quantity</th>
                    <th className="border border-black p-2 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRis.items && viewingRis.items.length > 0 ? viewingRis.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-2 text-center">{item.stock_no}</td>
                      <td className="border border-black p-2 text-center">{item.unit}</td>
                      <td className="border border-black p-2">{item.description}</td>
                      <td className="border border-black p-2 text-center">{item.quantity_requisition}</td>
                      <td className="border border-black p-2 text-center">{item.stock_available_yes ? '✓' : ''}</td>
                      <td className="border border-black p-2 text-center">{item.stock_available_no ? '✓' : ''}</td>
                      <td className="border border-black p-2 text-center">{item.quantity_issue}</td>
                      <td className="border border-black p-2">{item.remarks}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="border border-black p-4 text-center italic text-gray-500">No items requested</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mb-6">
                <p className="text-sm font-bold">Purpose:</p>
                <p className="text-sm border-b border-black min-h-[1.5rem]">{viewingRis.purpose}</p>
              </div>

              <table className="w-full text-left border-collapse border border-black text-sm">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 w-1/6"></td>
                    <td className="border border-black p-2 font-bold w-1/4 text-center">Requested by:</td>
                    <td className="border border-black p-2 font-bold w-1/4 text-center">Approved by:</td>
                    <td className="border border-black p-2 font-bold w-1/4 text-center">Issued by:</td>
                    <td className="border border-black p-2 font-bold w-1/4 text-center">Received by:</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Signature:</td>
                    <td className="border border-black p-2 h-12"></td>
                    <td className="border border-black p-2 h-12"></td>
                    <td className="border border-black p-2 h-12"></td>
                    <td className="border border-black p-2 h-12"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Printed Name:</td>
                    <td className="border border-black p-2 text-center">{viewingRis.requested_by_name || viewingRis.employee?.full_name}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.approved_by_name}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.issued_by_name}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.received_by_name}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Designation:</td>
                    <td className="border border-black p-2 text-center">{viewingRis.requested_by_designation || viewingRis.employee?.designation}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.approved_by_designation}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.issued_by_designation}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.received_by_designation}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">Date:</td>
                    <td className="border border-black p-2 text-center">{viewingRis.requested_by_date}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.approved_by_date}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.issued_by_date}</td>
                    <td className="border border-black p-2 text-center">{viewingRis.received_by_date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
