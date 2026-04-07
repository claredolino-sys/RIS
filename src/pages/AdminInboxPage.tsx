import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Edit3, Eye, Download, X, Printer } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportRIStoPDF } from '../utils/pdf';

export default function AdminInboxPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [risNoInput, setRisNoInput] = useState('');
  
  const [viewingRis, setViewingRis] = useState<any>(null);
  const [risToReject, setRisToReject] = useState<number | null>(null);
  const [editingPreviewRisNo, setEditingPreviewRisNo] = useState(false);
  const [previewRisNoInput, setPreviewRisNoInput] = useState('');
  const [editingItems, setEditingItems] = useState(false);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const res = await api.get('/ris/inbox');
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to fetch inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (id: number) => {
    try {
      await api.put(`/ris/${id}/mark-received`);
      toast.success('Marked as received');
      fetchInbox();
    } catch (err) {
      toast.error('Failed to mark received');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/ris/${id}/status`, { status: 'approved' });
      toast.success('RIS approved and inventory updated');
      fetchInbox();
    } catch (err) {
      toast.error('Failed to approve RIS');
    }
  };

  const handleReject = async (id: number) => {
    setRisToReject(id);
  };

  const confirmReject = async () => {
    if (!risToReject) return;
    try {
      await api.put(`/ris/${risToReject}/status`, { status: 'rejected' });
      toast.success('RIS rejected');
      fetchInbox();
    } catch (err) {
      toast.error('Failed to reject RIS');
    } finally {
      setRisToReject(null);
    }
  };

  const handleAssignRisNo = async (id: number) => {
    if (!risNoInput.trim()) return toast.error('RIS No. cannot be empty');
    try {
      await api.put(`/ris/${id}/assign-ris-no`, { ris_no: risNoInput });
      toast.success('RIS No. assigned successfully');
      setAssigningId(null);
      setRisNoInput('');
      fetchInbox();
    } catch (err) {
      toast.error('Failed to assign RIS No.');
    }
  };

  const handleViewRis = async (id: number, print = false) => {
    try {
      const res = await api.get(`/ris/${id}`);
      setViewingRis(res.data);
      setPreviewRisNoInput(res.data.ris_no || '');
      setEditingPreviewRisNo(false);
      setEditingItems(false);
      if (print) {
        setTimeout(() => {
          window.print();
        }, 100);
      }
    } catch (err) {
      toast.error('Failed to fetch RIS details');
    }
  };

  const handleSavePreviewRisNo = async () => {
    if (!previewRisNoInput.trim()) return toast.error('RIS No. cannot be empty');
    try {
      await api.put(`/ris/${viewingRis.id}/assign-ris-no`, { ris_no: previewRisNoInput });
      toast.success('RIS No. assigned successfully');
      setViewingRis({ ...viewingRis, ris_no: previewRisNoInput });
      setEditingPreviewRisNo(false);
      fetchInbox();
    } catch (err) {
      toast.error('Failed to assign RIS No.');
    }
  };

  const handleSaveItems = async () => {
    try {
      await api.put(`/ris/${viewingRis.id}/items`, { items: viewingRis.items });
      toast.success('Items updated successfully');
      setEditingItems(false);
      fetchInbox();
    } catch (err) {
      toast.error('Failed to update items');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold text-[#1A2340]">Admin Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process submitted Requisition and Issue Slips</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">RIS No.</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted By</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No pending RIS forms found.</td></tr>
            ) : records.map(ris => (
              <tr key={ris.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">
                  {assigningId === ris.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                        value={risNoInput}
                        onChange={e => setRisNoInput(e.target.value)}
                        placeholder="Enter RIS No."
                        autoFocus
                      />
                      <button onClick={() => handleAssignRisNo(ris.id)} className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
                      <button onClick={() => setAssigningId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  ) : (
                    ris.ris_no ? <span className="font-mono">{ris.ris_no}</span> : <span className="text-gray-400 italic">Pending</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-gray-900">{ris.employee?.full_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{ris.employee?.employee_id}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(ris.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${ris.status === 'sent' ? 'bg-blue-100 text-blue-800' : 
                      ris.status === 'received' ? 'bg-yellow-100 text-yellow-800' : 
                      ris.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {ris.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleViewRis(ris.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                    <Eye size={18} />
                  </button>
                  <button onClick={async () => {
                    try {
                      const res = await api.get(`/ris/${ris.id}`);
                      exportRIStoPDF(res.data);
                    } catch (err) {
                      toast.error('Failed to export PDF');
                    }
                  }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Export to PDF (Appendix 63)">
                    <Download size={18} />
                  </button>
                  {ris.status === 'sent' && (
                    <button 
                      onClick={() => handleMarkReceived(ris.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded text-xs font-medium transition-colors"
                    >
                      <CheckCircle size={14} />
                      Mark Received
                    </button>
                  )}
                  {ris.status === 'received' && (
                    <>
                      <button 
                        onClick={() => handleApprove(ris.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium transition-colors"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(ris.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </>
                  )}
                  {user?.role === 'admin_administrative' && !ris.ris_no && (
                    <button 
                      onClick={() => { setAssigningId(ris.id); setRisNoInput(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      <Edit3 size={14} />
                      Assign RIS No.
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
                <button onClick={() => exportRIStoPDF(viewingRis)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  <Download size={16} /> Export PDF
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => { setViewingRis(null); setEditingItems(false); }} className="text-gray-400 hover:text-gray-600 p-2">
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
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <span>RIS No.:</span>
                    {user?.role === 'admin_administrative' ? (
                      editingPreviewRisNo ? (
                        <>
                          <div className="flex items-center gap-1 print:hidden">
                            <input 
                              type="text" 
                              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 focus:outline-none focus:border-blue-500"
                              value={previewRisNoInput}
                              onChange={e => setPreviewRisNoInput(e.target.value)}
                              placeholder="Enter RIS No."
                              autoFocus
                            />
                            <button onClick={handleSavePreviewRisNo} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
                            <button onClick={() => { setEditingPreviewRisNo(false); setPreviewRisNoInput(viewingRis.ris_no || ''); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                          </div>
                          <span className="hidden print:inline font-semibold border-b border-black px-4">{viewingRis.ris_no || '_________________'}</span>
                        </>
                      ) : (
                        <span 
                          className="font-semibold border-b border-black px-4 flex items-center gap-2 group cursor-pointer hover:bg-gray-100 transition-colors" 
                          onClick={() => setEditingPreviewRisNo(true)}
                          title="Click to edit RIS No."
                        >
                          {viewingRis.ris_no || '_________________'}
                          <Edit3 size={14} className="text-gray-400 group-hover:text-blue-600 print:hidden" />
                        </span>
                      )
                    ) : (
                      <span className="font-semibold border-b border-black px-4">{viewingRis.ris_no || '_________________'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mb-2 print:hidden">
                {(user?.role === 'admin_administrative' || user?.role === 'admin') && viewingRis.status === 'sent' && (
                  <button
                    onClick={() => editingItems ? handleSaveItems() : setEditingItems(true)}
                    className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    {editingItems ? <CheckCircle size={16} /> : <Edit3 size={16} />}
                    {editingItems ? 'Save Items' : 'Edit Items'}
                  </button>
                )}
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
                      <td className="border border-black p-2 text-center">
                        {editingItems ? (
                          <input 
                            type="checkbox" 
                            checked={item.stock_available_yes} 
                            onChange={e => {
                              const newItems = [...viewingRis.items];
                              newItems[idx].stock_available_yes = e.target.checked;
                              setViewingRis({ ...viewingRis, items: newItems });
                            }} 
                          />
                        ) : (
                          item.stock_available_yes ? '✓' : ''
                        )}
                      </td>
                      <td className="border border-black p-2 text-center">
                        {editingItems ? (
                          <input 
                            type="checkbox" 
                            checked={item.stock_available_no} 
                            onChange={e => {
                              const newItems = [...viewingRis.items];
                              newItems[idx].stock_available_no = e.target.checked;
                              setViewingRis({ ...viewingRis, items: newItems });
                            }} 
                          />
                        ) : (
                          item.stock_available_no ? '✓' : ''
                        )}
                      </td>
                      <td className="border border-black p-2 text-center">
                        {editingItems ? (
                          <input 
                            type="number" 
                            className="w-full text-center border border-gray-300 rounded px-1"
                            value={item.quantity_issue} 
                            onChange={e => {
                              const newItems = [...viewingRis.items];
                              newItems[idx].quantity_issue = e.target.value;
                              setViewingRis({ ...viewingRis, items: newItems });
                            }} 
                          />
                        ) : (
                          item.quantity_issue
                        )}
                      </td>
                      <td className="border border-black p-2">
                        {editingItems ? (
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-1"
                            value={item.remarks} 
                            onChange={e => {
                              const newItems = [...viewingRis.items];
                              newItems[idx].remarks = e.target.value;
                              setViewingRis({ ...viewingRis, items: newItems });
                            }} 
                          />
                        ) : (
                          item.remarks
                        )}
                      </td>
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

      <ConfirmModal
        isOpen={!!risToReject}
        title="Reject RIS"
        message="Are you sure you want to reject this RIS?"
        confirmText="Reject"
        onConfirm={confirmReject}
        onCancel={() => setRisToReject(null)}
      />
    </div>
  );
}
