import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, Plus, Download, Search, Trash2, Edit2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import * as XLSX from 'xlsx';
import { getItemIcon } from '../utils/itemIcons';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[] | null>(null);
  const [formData, setFormData] = useState<any>({
    description: '',
    category: '',
    unit: '',
    quantity: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON starting from row 3 (index 2)
        // Headers are in row 1: DESCRIPTION, UNIT, CLASSIFICATION
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const preview: any[] = [];
        // Start from index 2 (Row 3)
        for (let i = 2; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const description = row[0]; // Column A
          const unit = row[1];        // Column B
          const category = row[2];    // Column C (Classification)
          const quantity = row[3];    // Column D (Stocks)
          
          if (description) {
            preview.push({
              description: String(description).trim(),
              unit: unit ? String(unit).trim() : 'pcs',
              category: category ? String(category).trim() : 'Uncategorized',
              quantity: quantity && !isNaN(Number(quantity)) ? Number(quantity) : 0
            });
          }
        }

        if (preview.length === 0) {
          toast.error('No valid items found in the Excel file.');
          setUploading(false);
          return;
        }

        setUploadPreview(preview);
      } catch (err) {
        console.error('Excel parsing error:', err);
        toast.error('Failed to parse Excel file. Please check the format.');
        setUploading(false);
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file.');
      setUploading(false);
    };

    reader.readAsBinaryString(file);
  };

  const confirmUpload = async () => {
    if (!uploadPreview) return;
    try {
      const confirmRes = await api.post('/inventory/confirm-upload', { items: uploadPreview, overwrite: false });
      toast.success(`Upload complete: ${confirmRes.data.created} created, ${confirmRes.data.skipped} skipped.`);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadPreview(null);
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      const headers = [['DESCRIPTION', 'UNIT', 'CLASSIFICATION', 'STOCKS'], []];
      const sampleData = [
        ['AIR FRESHENER, ambree, 300ml/', 'can', 'Janitorial Supplies', 50],
        ['BALLPEN, blue', 'pieces', 'Writing Supplies', 100],
        ['BATTERY, dry cell, size, AA size 1215 1.5 volts', 'pack', 'Electrical Supplies', 20]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      
      XLSX.writeFile(wb, "inventory_template.xlsx");
      toast.success('Template downloaded');
    } catch (err) {
      toast.error('Failed to generate template');
    }
  };

  const handleDelete = async (id: number) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/inventory/${itemToDelete}`);
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (err) {
      toast.error('Failed to delete item');
    } finally {
      setItemToDelete(null);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ description: '', category: '', unit: '', quantity: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      quantity: Number(formData.quantity) || 0
    };
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, dataToSave);
        toast.success('Item updated successfully');
      } else {
        await api.post('/inventory', dataToSave);
        toast.success('Item added successfully');
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    }
  };

  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) || 
    item.stock_no.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2340]">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage stock items and categories</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            <Download size={16} /> Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer">
            <Upload size={16} /> {uploading ? 'Processing...' : 'Upload Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by description, stock no, or category..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Total Items: {filteredItems.length}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-200">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock No.</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No items found.</td></tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm text-gray-600">{item.stock_no}</td>
                  <td className="p-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded-md">
                        {getItemIcon(item.description)}
                      </div>
                      {item.description}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{item.category}</td>
                  <td className="p-4 text-sm text-gray-600">{item.unit}</td>
                  <td className="p-4 text-sm font-medium text-gray-900 text-right">{item.quantity}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input 
                    required type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    required type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input 
                      required type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input 
                      required type="number" min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!uploadPreview}
        title="Confirm Upload"
        message={`Found ${uploadPreview?.length || 0} items. Proceed with upload?`}
        confirmText="Upload"
        onConfirm={confirmUpload}
        onCancel={() => {
          setUploadPreview(null);
          setUploading(false);
        }}
      />
    </div>
  );
}
