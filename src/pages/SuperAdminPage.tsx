import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Users, UserPlus, Trash2, Shield, Activity, X } from 'lucide-react';

export default function SuperAdminPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAdmins: 0, totalEmployees: 0, totalRIS: 0, totalActive: 0 });
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
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
      const [adminsRes, statsRes] = await Promise.all([
        api.get('/users/admins'),
        api.get('/users/stats')
      ]);
      setAdmins(adminsRes.data);
      setStats(statsRes.data);
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
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Admin deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete admin');
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2340]">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and administrator management</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <FileText size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalRIS}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total RIS Submitted</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
            <Activity size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalActive}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Active Accounts</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Administrator Accounts</h3>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <UserPlus size={16} /> Create Admin
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">
                  {admin.full_name}
                  <div className="text-xs text-gray-500 font-normal">{admin.email}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">{admin.employee_id}</td>
                <td className="p-4 text-sm text-gray-600">{admin.department || '-'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${admin.role === 'admin_administrative' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleToggleActive(admin.id)}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer
                    ${admin.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
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
    </div>
  );
}

// Helper component since FileText is missing in the import above
function FileText(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}
function Edit3(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
}
