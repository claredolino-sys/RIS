import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, UserPlus, Trash2, Shield, Activity, X, FileText, Edit3, Download, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function SuperAdminPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [allRis, setAllRis] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAdmins: 0, totalEmployees: 0, totalRIS: 0, totalActive: 0 });
  const [loading, setLoading] = useState(true);
  const [risSearch, setRisSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [adminToDelete, setAdminToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    employee_id: '',
    department: '',
    designation: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, statsRes, risRes] = await Promise.all([
        api.get('/users/admins'),
        api.get('/users/stats'),
        api.get('/ris')
      ]);
      setAdmins(adminsRes.data);
      setStats(statsRes.data);
      setAllRis(risRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.put(`/users/${id}/toggle`);
      toast.success('User status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    setAdminToDelete(id);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;
    try {
      await api.delete(`/users/${adminToDelete}`);
      toast.success('Admin deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete admin');
    } finally {
      setAdminToDelete(null);
    }
  };

  const handleOpenModal = (admin: any = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        full_name: admin.full_name,
        email: admin.email,
        password: '', // Leave empty for edit unless changing
        employee_id: admin.employee_id || '',
        department: admin.department || '',
        designation: admin.designation || '',
        role: admin.role
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        employee_id: '',
        department: '',
        designation: '',
        role: 'admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${editingAdmin.id}`, updateData);
        toast.success('Admin updated successfully');
      } else {
        if (!formData.password) return toast.error('Password is required for new admins');
        await api.post('/users/admin', formData);
        toast.success('Admin created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save admin');
    }
  };

  const handleDownloadRIS = (ris: any) => {
    toast.success(`Downloading RIS No. ${ris.ris_no || ris.id}...`);
    // Mock download
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

  const filteredRis = allRis.filter(r => 
    (r.ris_no?.toLowerCase().includes(risSearch.toLowerCase()) || 
     r.full_name?.toLowerCase().includes(risSearch.toLowerCase()) ||
     r.employee_id?.toLowerCase().includes(risSearch.toLowerCase()))
  );

  const handleDownloadAll = () => {
    if (allRis.length === 0) return toast.error('No RIS to download');
    toast.success(`Downloading all ${allRis.length} RIS entries...`);
    allRis.forEach((ris, index) => {
      setTimeout(() => handleDownloadRIS(ris), index * 300);
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2340]">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and administrator management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total Employees</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <Shield size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total Admins</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative group">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <FileText size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalRIS}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total RIS Submitted</div>
          <button 
            onClick={handleDownloadAll}
            className="absolute top-6 right-6 p-2 text-green-600 hover:bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Download All RIS"
          >
            <Download size={18} />
          </button>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
            <Activity size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalActive}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Active Accounts</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Administrator Accounts</h3>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <UserPlus size={16} /> Create Admin
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                    {admin.full_name}
                    <div className="text-xs text-gray-500 font-normal">{admin.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{admin.employee_id}</td>
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{admin.department || '-'}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${admin.role === 'admin_administrative' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleActive(admin.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer
                      ${admin.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2 whitespace-nowrap">
                    <button onClick={() => handleOpenModal(admin)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-700">All Employee RIS Requests</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Download size={16} /> Download All
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search RIS, Name, ID..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={risSearch}
                onChange={(e) => setRisSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">RIS No.</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Created</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRis.length > 0 ? (
                filteredRis.map(ris => (
                  <tr key={ris.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{ris.ris_no || `RIS-${ris.id}`}</td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ris.full_name}</div>
                      <div className="text-xs text-gray-500">{ris.employee_id}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(ris.createdAt).toLocaleDateString()}
                      <div className="text-[10px] text-gray-400">{new Date(ris.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${ris.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          ris.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          ris.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ris.status}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => handleDownloadRIS(ris)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        title="Download RIS"
                      >
                        <Download size={16} />
                        <span className="text-xs font-bold">Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No RIS requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">{editingAdmin ? 'Edit Admin' : 'Create Admin'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingAdmin ? '(Leave blank to keep current)' : '*'}</label>
                  <input type="password" minLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="admin">Admin</option>
                      <option value="admin_administrative">Administrative Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Save Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!adminToDelete}
        title="Delete Admin"
        message="Are you sure you want to delete this admin? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setAdminToDelete(null)}
      />
    </div>
  );
}
