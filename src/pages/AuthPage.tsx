import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employee_id: '',
    password: '',
    full_name: '',
    department: '',
    division: '',
    office: '',
    designation: '',
    email: '',
    confirm_password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', {
          employee_id: formData.employee_id,
          password: formData.password,
        });
        login(res.data.token, res.data.user);
        toast.success('Logged in successfully');
        checkPendingRIS();
        navigate('/dashboard');
      } else {
        if (formData.password !== formData.confirm_password) {
          return toast.error('Passwords do not match');
        }
        const res = await api.post('/auth/register', formData);
        login(res.data.token, res.data.user);
        toast.success('Account created successfully');
        checkPendingRIS();
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    }
  };

  const checkPendingRIS = async () => {
    const pendingId = localStorage.getItem('pending_ris_id');
    if (pendingId) {
      try {
        await api.post('/ris/claim', { ris_id: pendingId });
        localStorage.removeItem('pending_ris_id');
        localStorage.removeItem('draft_ris');
        toast.success('Draft RIS claimed successfully');
      } catch (err) {
        console.error('Failed to claim RIS', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1A2340]">
            RIS Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create an employee account'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Juan Dela Cruz" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="juan@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="IT Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Software Engineer" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>
              </>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID No.</label>
              <input required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="EMP-12345" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input required type="password" className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="••••••••" value={formData.confirm_password} onChange={e => setFormData({...formData, confirm_password: e.target.value})} />
              </div>
            )}
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              {isLogin ? 'Sign in' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
