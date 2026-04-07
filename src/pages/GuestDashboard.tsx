import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getItemIcon } from '../utils/itemIcons';

export default function GuestDashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    entity_name: '',
    fund_cluster: '',
    division: '',
    office: '',
    responsibility_center_code: '',
    purpose: '',
    requested_by_name: '',
    requested_by_designation: '',
    approved_by_name: '',
    approved_by_designation: '',
    issued_by_name: '',
    issued_by_designation: '',
    received_by_name: '',
    received_by_designation: '',
  });

  const [items, setItems] = useState<any[]>([
    { stock_no: '', unit: '', description: '', quantity_requisition: '', stock_available_yes: false, stock_available_no: false, quantity_issue: '', remarks: '' }
  ]);
  const [isInventoryCollapsed, setIsInventoryCollapsed] = useState(false);

  useEffect(() => {
    api.get('/inventory').then(res => setInventory(res.data));
    
    let initialFormData = { ...formData };

    const saved = localStorage.getItem('draft_ris');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) initialFormData = { ...initialFormData, ...parsed.formData };
        if (parsed.items) setItems(parsed.items);
      } catch (e) {}
    }

    // Pre-fill from user profile if logged in (overrides draft if user is logged in)
    if (user) {
      initialFormData = {
        ...initialFormData,
        entity_name: user.entity_name || initialFormData.entity_name,
        fund_cluster: user.fund_cluster || initialFormData.fund_cluster,
        division: user.division || initialFormData.division,
        office: user.office || initialFormData.office,
        responsibility_center_code: user.responsibility_center_code || initialFormData.responsibility_center_code,
        requested_by_name: user.full_name || initialFormData.requested_by_name,
        requested_by_designation: user.designation || initialFormData.requested_by_designation,
      };
    }

    setFormData(initialFormData);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('draft_ris', JSON.stringify({ formData, items }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, items]);

  const handleItemSelect = (index: number, invItem: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      inventory_id: invItem.id,
      stock_no: invItem.stock_no,
      unit: invItem.unit,
      description: invItem.description,
    };
    if (index === items.length - 1) {
      newItems.push({ stock_no: '', unit: '', description: '', quantity_requisition: '', stock_available_yes: false, stock_available_no: false, quantity_issue: '', remarks: '' });
    }
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      if (user) {
        // If logged in, update user profile with these details
        const profileData = {
          entity_name: formData.entity_name,
          fund_cluster: formData.fund_cluster,
          division: formData.division,
          office: formData.office,
          responsibility_center_code: formData.responsibility_center_code,
          full_name: formData.requested_by_name,
          designation: formData.requested_by_designation,
        };
        await api.post('/auth/profile', profileData);
        updateUser(profileData);

        // Create a real RIS directly
        await api.post('/ris', { ...formData, items });
        toast.success('RIS created successfully!');
        localStorage.removeItem('draft_ris');
        navigate('/dashboard');
      } else {
        // Guest mode
        const res = await api.post('/ris/guest', { formData, items });
        localStorage.setItem('pending_ris_id', res.data.id);
        toast.success('RIS saved! Please login to continue.');
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save RIS');
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'available' && !item.is_available) return false;
    if (filter === 'out' && item.is_available) return false;
    if (search && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`flex h-full overflow-hidden relative ${user ? 'bg-white' : 'bg-gray-100 w-screen h-screen'}`}>
      {/* Left Panel - RIS Form */}
      <div className={`h-full overflow-y-auto p-6 border-r border-gray-200 bg-white transition-all duration-300 ${isInventoryCollapsed ? 'w-full' : 'w-1/2'}`}>
        <div className="max-w-4xl mx-auto" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold italic">Appendix 63</h2>
          </div>
          <h1 className="text-center text-xl font-bold mb-8">REQUISITION AND ISSUE SLIP</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="flex border-b border-black mb-2"><span className="w-32">Entity Name:</span><input className="flex-1 outline-none" value={formData.entity_name} onChange={e => setFormData({...formData, entity_name: e.target.value})} /></div>
              <div className="flex border-b border-black mb-2"><span className="w-32">Division:</span><input className="flex-1 outline-none" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} /></div>
              <div className="flex border-b border-black"><span className="w-32">Office:</span><input className="flex-1 outline-none" value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})} /></div>
            </div>
            <div>
              <div className="flex border-b border-black mb-2"><span className="w-48">Fund Cluster:</span><input className="flex-1 outline-none" value={formData.fund_cluster} onChange={e => setFormData({...formData, fund_cluster: e.target.value})} /></div>
              <div className="flex border-b border-black mb-2"><span className="w-48">Responsibility Center Code:</span><input className="flex-1 outline-none" value={formData.responsibility_center_code} onChange={e => setFormData({...formData, responsibility_center_code: e.target.value})} /></div>
              <div className="flex border-b border-black"><span className="w-48">RIS No.:</span><span className="flex-1 text-gray-400 italic">Pending</span></div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-sm mb-6">
            <thead>
              <tr>
                <th className="border border-black p-2" colSpan={4}>Requisition</th>
                <th className="border border-black p-2" colSpan={2}>Stock Available?</th>
                <th className="border border-black p-2" colSpan={2}>Issue</th>
              </tr>
              <tr>
                <th className="border border-black p-1 w-20">Stock No.</th>
                <th className="border border-black p-1 w-16">Unit</th>
                <th className="border border-black p-1">Description</th>
                <th className="border border-black p-1 w-16">Quantity</th>
                <th className="border border-black p-1 w-10">Yes</th>
                <th className="border border-black p-1 w-10">No</th>
                <th className="border border-black p-1 w-16">Quantity</th>
                <th className="border border-black p-1 w-24">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1"><input className="w-full outline-none bg-transparent" readOnly value={item.stock_no} /></td>
                  <td className="border border-black p-1"><input className="w-full outline-none bg-transparent" readOnly value={item.unit} /></td>
                  <td className="border border-black p-1">
                    <select 
                      className="w-full outline-none bg-transparent"
                      value={item.description}
                      onChange={(e) => {
                        const invItem = inventory.find(i => i.description === e.target.value);
                        if (invItem) {
                          handleItemSelect(idx, invItem);
                        } else {
                          const newItems = [...items];
                          newItems[idx] = { stock_no: '', unit: '', description: '', quantity_requisition: '', stock_available_yes: false, stock_available_no: false, quantity_issue: '', remarks: '' };
                          setItems(newItems);
                        }
                      }}
                    >
                      <option value="">Select Item...</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.description}>
                          {inv.description} ({inv.quantity} {inv.unit} available)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-black p-1">
                    <input 
                      type="number" 
                      className="w-full outline-none bg-transparent text-center" 
                      value={item.quantity_requisition} 
                      onChange={e => { 
                        const newItems = [...items]; 
                        const reqQty = Number(e.target.value);
                        newItems[idx].quantity_requisition = e.target.value; 
                        
                        // Automatically track stock availability
                        if (item.inventory_id) {
                          const invItem = inventory.find(i => i.id === item.inventory_id);
                          if (invItem) {
                            if (reqQty > 0 && reqQty <= invItem.quantity) {
                              newItems[idx].stock_available_yes = true;
                              newItems[idx].stock_available_no = false;
                              newItems[idx].quantity_issue = e.target.value; // Suggest full issue
                            } else if (reqQty > invItem.quantity) {
                              newItems[idx].stock_available_yes = false;
                              newItems[idx].stock_available_no = true;
                              newItems[idx].quantity_issue = invItem.quantity > 0 ? String(invItem.quantity) : ''; // Suggest partial issue or none
                            } else {
                              newItems[idx].stock_available_yes = false;
                              newItems[idx].stock_available_no = false;
                              newItems[idx].quantity_issue = '';
                            }
                          }
                        }
                        
                        setItems(newItems); 
                      }} 
                    />
                  </td>
                  <td className="border border-black p-1 text-center"><input type="checkbox" checked={item.stock_available_yes} disabled className="cursor-not-allowed opacity-50" /></td>
                  <td className="border border-black p-1 text-center"><input type="checkbox" checked={item.stock_available_no} disabled className="cursor-not-allowed opacity-50" /></td>
                  <td className="border border-black p-1"><input type="number" className="w-full outline-none bg-transparent text-center cursor-not-allowed opacity-50" value={item.quantity_issue} disabled /></td>
                  <td className="border border-black p-1"><input className="w-full outline-none bg-transparent cursor-not-allowed opacity-50" value={item.remarks} disabled /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border border-black p-2 mb-6 min-h-[60px]">
            <span className="font-bold">Purpose:</span>
            <textarea className="w-full outline-none resize-none mt-1" rows={2} value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
          </div>

          <table className="w-full border-collapse border border-black text-sm mb-8 text-center">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/4 text-left align-top">Signature:</td>
                <td className="border border-black p-2 w-1/4">Requested by:</td>
                <td className="border border-black p-2 w-1/4">Approved by:</td>
                <td className="border border-black p-2 w-1/4">Issued by:</td>
                <td className="border border-black p-2 w-1/4">Received by:</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left">Printed Name:</td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.requested_by_name} onChange={e => setFormData({...formData, requested_by_name: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.approved_by_name} onChange={e => setFormData({...formData, approved_by_name: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.issued_by_name} onChange={e => setFormData({...formData, issued_by_name: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.received_by_name} onChange={e => setFormData({...formData, received_by_name: e.target.value})} /></td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left">Designation:</td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.requested_by_designation} onChange={e => setFormData({...formData, requested_by_designation: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.approved_by_designation} onChange={e => setFormData({...formData, approved_by_designation: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.issued_by_designation} onChange={e => setFormData({...formData, issued_by_designation: e.target.value})} /></td>
                <td className="border border-black p-2"><input className="w-full outline-none text-center" value={formData.received_by_designation} onChange={e => setFormData({...formData, received_by_designation: e.target.value})} /></td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left">Date:</td>
                <td className="border border-black p-2"><input type="date" className="w-full outline-none text-center" value={formData.requested_by_date} onChange={e => setFormData({...formData, requested_by_date: e.target.value})} /></td>
                <td className="border border-black p-2"><input type="date" className="w-full outline-none text-center" value={formData.approved_by_date} onChange={e => setFormData({...formData, approved_by_date: e.target.value})} /></td>
                <td className="border border-black p-2"><input type="date" className="w-full outline-none text-center" value={formData.issued_by_date} onChange={e => setFormData({...formData, issued_by_date: e.target.value})} /></td>
                <td className="border border-black p-2"><input type="date" className="w-full outline-none text-center" value={formData.received_by_date} onChange={e => setFormData({...formData, received_by_date: e.target.value})} /></td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end font-sans">
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {user ? 'Submit RIS' : 'Save RIS & Login'}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsInventoryCollapsed(!isInventoryCollapsed)}
        className={`absolute top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1.5 shadow-md z-20 hover:bg-gray-50 transition-all ${isInventoryCollapsed ? 'right-4 rotate-180' : 'right-1/2 translate-x-1/2'}`}
        title={isInventoryCollapsed ? "Show Inventory" : "Hide Inventory"}
      >
        <ChevronRight size={16} className="text-gray-600" />
      </button>

      {/* Right Panel - Inventory Browser */}
      <div className={`h-full flex flex-col bg-gray-50 transition-all duration-300 relative ${isInventoryCollapsed ? 'w-0 overflow-hidden' : 'w-1/2'}`}>
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Inventory Browser</h2>
            {!user && (
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Login to Portal
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'available', 'out'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${filter === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {filteredInventory.map(item => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                onClick={() => {
                  const emptyIdx = items.findIndex(i => !i.description);
                  handleItemSelect(emptyIdx >= 0 ? emptyIdx : items.length - 1, item);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500">{item.stock_no}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {getItemIcon(item.description, 24)}
                  </div>
                  <h3 className="font-semibold text-gray-800 leading-tight">{item.description}</h3>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{item.category}</span>
                  <span className="font-medium">Stock: {item.quantity} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
