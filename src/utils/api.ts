// Mock API client using localStorage for data persistence
const STORAGE_KEYS = {
  USERS: 'ris_users',
  INVENTORY: 'ris_inventory_v2',
  RIS: 'ris_requests',
  REPORTS: 'ris_reports',
  NOTIFICATIONS: 'ris_notifications',
  TOKEN: 'token',
};

// Initial Data Seeding
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const initialUsers = [
      {
        id: 1,
        employee_id: 'SUPERADMIN',
        password: 'password123',
        full_name: 'Super Administrator',
        email: 'superadmin@example.com',
        role: 'superadmin',
        department: 'Administration',
        division: 'IT',
        office: 'Main',
        designation: 'System Admin',
        is_active: true,
      },
      {
        id: 2,
        employee_id: 'ADMIN',
        password: 'password123',
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        department: 'Supply',
        division: 'Admin',
        office: 'Main',
        designation: 'Supply Officer',
        is_active: true,
      },
      {
        id: 3,
        employee_id: 'ADMIN_ADMIN',
        password: 'password123',
        full_name: 'Administrative Admin',
        email: 'admin_admin@example.com',
        role: 'admin_administrative',
        department: 'Administrative',
        division: 'Admin',
        office: 'Main',
        designation: 'Administrative Officer',
        is_active: true,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    const initialInventory: any[] = [];
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(initialInventory));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RIS)) {
    localStorage.setItem(STORAGE_KEYS.RIS, JSON.stringify([]));
  }
};

seedData();

const getFromStorage = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const saveToStorage = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Auto-deletion logic
const cleanupExpiredRIS = () => {
  const ris = getFromStorage(STORAGE_KEYS.RIS);
  const notifications = getFromStorage(STORAGE_KEYS.NOTIFICATIONS);
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const FORTY_SEVEN_HOURS = 47 * 60 * 60 * 1000;

  let changed = false;
  let notifyChanged = false;

  const filteredRIS = ris.filter((r: any) => {
    const createdTime = new Date(r.createdAt).getTime();
    const age = now - createdTime;

    // Notify Super Admin 1 hour before deletion (at 47 hours)
    if (age >= FORTY_SEVEN_HOURS && age < FORTY_EIGHT_HOURS) {
      const notificationId = `deletion_warning_${r.id}`;
      if (!notifications.find((n: any) => n.id === notificationId)) {
        notifications.push({
          id: notificationId,
          type: 'warning',
          message: `RIS No. ${r.ris_no || r.id} will be auto-deleted in 1 hour.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          targetRole: 'superadmin'
        });
        notifyChanged = true;
      }
    }

    if (age >= FORTY_EIGHT_HOURS) {
      changed = true;
      return false;
    }
    return true;
  });

  if (changed) saveToStorage(STORAGE_KEYS.RIS, filteredRIS);
  if (notifyChanged) saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
};

// Robust ID generator to prevent duplicate keys
const generateId = () => {
  return Date.now() + Math.random();
};

// Even better robust ID generator
const generateUniqueId = () => {
  return Math.floor(Date.now() * Math.random() * 1000) / 1000;
};

// Let's use a simple counter + timestamp for guaranteed uniqueness in a single session
let idCounter = 0;
const getUniqueId = () => {
  idCounter++;
  return Date.now() + idCounter + Math.random();
};

interface ApiResponse<T = any> {
  data: T;
}

interface ApiClient {
  get: <T = any>(url: string, config?: any) => Promise<ApiResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: any) => Promise<ApiResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: any) => Promise<ApiResponse<T>>;
  delete: <T = any>(url: string, config?: any) => Promise<ApiResponse<T>>;
}

const api: ApiClient = {
  get: async (url, config) => {
    console.log(`GET ${url}`);
    const users = getFromStorage(STORAGE_KEYS.USERS);
    const inventory = getFromStorage(STORAGE_KEYS.INVENTORY);
    const ris = getFromStorage(STORAGE_KEYS.RIS);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (url === '/auth/me') {
      if (!token) throw { response: { status: 401, data: { message: 'Unauthorized' } } };
      const user = users.find((u: any) => u.employee_id === token);
      if (!user) throw { response: { status: 401, data: { message: 'User not found' } } };
      return { data: user };
    }

    if (url === '/inventory') {
      // Deduplicate inventory items by ID just in case
      const uniqueInventory = Array.from(new Map(inventory.map((item: any) => [item.id, item])).values());
      if (uniqueInventory.length !== inventory.length) {
        saveToStorage(STORAGE_KEYS.INVENTORY, uniqueInventory);
      }
      return { data: uniqueInventory.map((i: any) => ({ ...i, is_available: i.quantity > 0 })) };
    }

    if (url === '/ris') {
      return { data: ris.map((r: any) => ({
        ...r,
        employee: users.find((u: any) => u.id === r.user_id) || null
      })) };
    }

    if (url === '/ris/my') {
      return { data: ris.filter((r: any) => r.employee_id === token).map((r: any) => ({
        ...r,
        employee: users.find((u: any) => u.id === r.user_id) || null
      })) };
    }

    if (url === '/ris/inbox') {
      return { data: ris.filter((r: any) => r.status !== 'draft').map((r: any) => ({
        ...r,
        employee: users.find((u: any) => u.id === r.user_id) || null
      })) };
    }

    if (url.startsWith('/ris/')) {
      const id = Number(url.split('/').pop());
      const request = ris.find((r: any) => r.id === id);
      if (request) {
        return { 
          data: {
            ...request,
            employee: users.find((u: any) => u.id === request.user_id) || null
          } 
        };
      }
    }

    if (url === '/users/admins') {
      return { data: users.filter((u: any) => ['admin', 'admin_administrative'].includes(u.role)) };
    }

    if (url === '/users/stats') {
      cleanupExpiredRIS();
      return { 
        data: {
          totalEmployees: users.filter((u: any) => u.role === 'employee').length,
          totalAdmins: users.filter((u: any) => ['admin', 'admin_administrative'].includes(u.role)).length,
          totalRIS: ris.filter((r: any) => r.status !== 'draft').length,
          totalActive: users.filter((u: any) => u.is_active !== false).length
        } 
      };
    }

    if (url === '/reports') {
      const reports = getFromStorage(STORAGE_KEYS.REPORTS) || [];
      return { data: reports };
    }

    if (url.startsWith('/reports/') && url.endsWith('/excel')) {
      return { data: new Blob(['Mock Excel Report'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as any };
    }

    if (url.startsWith('/reports/')) {
      const id = Number(url.split('/')[2]);
      const reports = getFromStorage(STORAGE_KEYS.REPORTS) || [];
      const report = reports.find((r: any) => r.id === id);
      
      const inventory = getFromStorage(STORAGE_KEYS.INVENTORY) || [];
      const allRis = getFromStorage(STORAGE_KEYS.RIS) || [];

      // Filter RIS by report period if details are available
      const details = report?.period_details;
      const filteredRis = allRis.filter((r: any) => {
        if (!details) return true; // Fallback for old reports
        
        const risDate = new Date(r.created_at || r.date);
        const rYear = risDate.getFullYear();
        const rMonth = risDate.getMonth() + 1;
        
        if (details.type === 'monthly') {
          return rYear === details.year && rMonth === details.month;
        }
        if (details.type === 'quarterly') {
          const rQuarter = Math.ceil(rMonth / 3);
          return rYear === details.year && rQuarter === details.quarter;
        }
        if (details.type === 'semestral') {
          const rSemester = rMonth <= 6 ? 1 : 2;
          return rYear === details.year && rSemester === details.semester;
        }
        if (details.type === 'yearly') {
          return rYear === details.year;
        }
        return true;
      });

      // Calculate item stats from filtered RIS
      const itemStats: Record<number, { issued: number, name: string, stock_no: string, remaining: number, category: string, unit: string }> = {};
      inventory.forEach((item: any) => {
        itemStats[item.id] = {
          issued: 0,
          name: item.description,
          stock_no: item.stock_no,
          remaining: item.quantity,
          category: item.category,
          unit: item.unit
        };
      });

      filteredRis.forEach((r: any) => {
        if (r.status !== 'draft' && r.items) {
          r.items.forEach((reqItem: any) => {
            if (reqItem.inventory_id && itemStats[reqItem.inventory_id]) {
              itemStats[reqItem.inventory_id].issued += Number(reqItem.quantity_requisition) || 0;
            }
          });
        }
      });

      const statsArray = Object.values(itemStats);
      const mostRequested = [...statsArray].sort((a, b) => b.issued - a.issued);
      const leastRequested = [...statsArray].sort((a, b) => a.issued - b.issued);

      const totalIssued = statsArray.reduce((acc, curr) => acc + curr.issued, 0);
      const totalRemaining = statsArray.reduce((acc, curr) => acc + curr.remaining, 0);
      
      const summary = `During this ${report?.report_type || 'period'}, a total of ${totalIssued} items were issued across all categories. The inventory currently holds ${totalRemaining} items in stock. ${mostRequested[0]?.name || 'No items'} was the most requested item, while ${leastRequested[0]?.name || 'no items'} saw the least activity. Overall, the stock levels are ${totalRemaining < 100 ? 'low' : 'stable'}.`;

      const reportData = {
        mostRequested,
        leastRequested,
        summary,
        totalIssued,
        totalRemaining
      };

      return { 
        data: report ? { ...report, data: reportData } : { 
          id: 1, 
          report_type: 'inventory', 
          period_label: '2026-03', 
          department: null,
          generated_by: 'Admin User', 
          is_auto: false,
          createdAt: new Date().toISOString(),
          data: reportData
        } 
      };
    }

    if (url === '/users') {
      return { data: users };
    }

    if (url === '/inventory/template') {
      return { data: new Blob(['Mock Excel Template'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as any };
    }

    if (url === '/notifications') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const user = users.find((u: any) => u.employee_id === token);
      const notifications = getFromStorage(STORAGE_KEYS.NOTIFICATIONS);
      return { data: notifications.filter((n: any) => n.targetRole === user?.role) };
    }

    return { data: null as any };
  },

  post: async (url, data, config) => {
    cleanupExpiredRIS();
    console.log(`POST ${url}`, data);
    const users = getFromStorage(STORAGE_KEYS.USERS);
    const inventory = getFromStorage(STORAGE_KEYS.INVENTORY);
    const ris = getFromStorage(STORAGE_KEYS.RIS);

    if (url === '/auth/login') {
      const user = users.find((u: any) => u.employee_id === data.employee_id && u.password === data.password);
      if (!user) throw { response: { status: 401, data: { message: 'Invalid credentials' } } };
      localStorage.setItem(STORAGE_KEYS.TOKEN, user.employee_id);
      return { data: { token: user.employee_id, user } };
    }

    if (url === '/auth/register') {
      const existing = users.find((u: any) => u.employee_id === data.employee_id);
      if (existing) throw { response: { status: 400, data: { message: 'Employee ID already exists' } } };
      const newUser = { ...data, id: getUniqueId(), role: 'employee' };
      users.push(newUser);
      saveToStorage(STORAGE_KEYS.USERS, users);
      localStorage.setItem(STORAGE_KEYS.TOKEN, newUser.employee_id);
      return { data: { token: newUser.employee_id, user: newUser } };
    }

    if (url === '/auth/profile') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const index = users.findIndex((u: any) => u.employee_id === token);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveToStorage(STORAGE_KEYS.USERS, users);
        return { data: users[index] };
      }
      throw { response: { status: 404, data: { message: 'User not found' } } };
    }

    if (url === '/inventory') {
      const newItem = { 
        ...data, 
        id: getUniqueId(), 
        stock_no: `STK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        is_available: data.quantity > 0 
      };
      inventory.push(newItem);
      saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
      return { data: newItem };
    }

    if (url === '/inventory/parse-excel') {
      return { 
        data: { 
          preview: [
            { description: 'Mock Uploaded Item 1', category: 'Supplies', unit: 'pcs', quantity: 100 },
            { description: 'Mock Uploaded Item 2', category: 'Equipment', unit: 'unit', quantity: 5 }
          ] 
        } 
      };
    }

    if (url === '/inventory/confirm-upload') {
      const newItems = data.items.map((item: any) => ({
        ...item,
        id: getUniqueId(),
        stock_no: `STK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        is_available: item.quantity > 0
      }));
      inventory.push(...newItems);
      saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
      return { data: { created: newItems.length, skipped: 0 } };
    }

    if (url === '/ris') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const user = users.find((u: any) => u.employee_id === token);
      
      const newRIS = { 
        ...data, 
        id: getUniqueId(), 
        status: 'draft', 
        createdAt: new Date().toISOString(),
        user_id: user?.id,
        employee_id: user?.employee_id,
        full_name: user?.full_name,
        items: data.items.map((item: any) => ({
          ...item,
          id: getUniqueId()
        }))
      };
      ris.push(newRIS);
      saveToStorage(STORAGE_KEYS.RIS, ris);
      return { data: newRIS };
    }

    if (url === '/ris/claim') {
      const request = ris.find((r: any) => r.id === Number(data.ris_id));
      if (request) {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userIndex = users.findIndex((u: any) => u.employee_id === token);
        if (userIndex !== -1) {
          const user = users[userIndex];
          request.user_id = user.id;
          request.employee_id = user.employee_id;
          request.full_name = user.full_name;

          // Update user profile with RIS details
          users[userIndex] = {
            ...user,
            entity_name: request.entity_name || user.entity_name,
            fund_cluster: request.fund_cluster || user.fund_cluster,
            division: request.division || user.division,
            office: request.office || user.office,
            responsibility_center_code: request.responsibility_center_code || user.responsibility_center_code,
            full_name: request.requested_by_name || user.full_name,
            designation: request.requested_by_designation || user.designation,
          };
          saveToStorage(STORAGE_KEYS.USERS, users);
          saveToStorage(STORAGE_KEYS.RIS, ris);
        }
      }
      return { data: { message: 'RIS claimed' } };
    }

    if (url === '/ris/guest') {
      const newRIS = { 
        ...data.formData, 
        id: getUniqueId(), 
        status: 'draft', 
        createdAt: new Date().toISOString(),
        items: data.items.map((item: any) => ({
          ...item,
          id: getUniqueId()
        }))
      };
      ris.push(newRIS);
      saveToStorage(STORAGE_KEYS.RIS, ris);
      return { data: newRIS };
    }

    if (url === '/users/admin') {
      const existing = users.find((u: any) => u.employee_id === data.employee_id);
      if (existing) throw { response: { status: 400, data: { message: 'Employee ID already exists' } } };
      const newUser = { ...data, id: getUniqueId(), role: data.role || 'admin' };
      users.push(newUser);
      saveToStorage(STORAGE_KEYS.USERS, users);
      return { data: newUser };
    }

    if (url === '/reports/generate') {
      const reports = getFromStorage(STORAGE_KEYS.REPORTS) || [];
      let periodLabel = '';
      const { type, year, month, quarter, semester, department } = data;
      
      if (type === 'monthly') {
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1));
        periodLabel = `${monthName} ${year}`;
      } else if (type === 'quarterly') {
        periodLabel = `Q${quarter} ${year}`;
      } else if (type === 'semestral') {
        periodLabel = `${semester === 1 ? '1st' : '2nd'} Semester ${year}`;
      } else {
        periodLabel = `Year ${year}`;
      }

      const newReport = {
        id: getUniqueId(),
        report_type: type,
        period_label: periodLabel,
        period_details: { type, year, month, quarter, semester },
        department: department || null,
        generated_by: 'Admin',
        is_auto: false,
        createdAt: new Date().toISOString()
      };
      reports.push(newReport);
      saveToStorage(STORAGE_KEYS.REPORTS, reports);
      return { data: newReport };
    }

    return { data: null as any };
  },

  put: async (url, data, config) => {
    console.log(`PUT ${url}`, data);
    const inventory = getFromStorage(STORAGE_KEYS.INVENTORY);
    const ris = getFromStorage(STORAGE_KEYS.RIS);

    if (url.startsWith('/inventory/')) {
      const id = Number(url.split('/').pop());
      const index = inventory.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        inventory[index] = { ...inventory[index], ...data, is_available: data.quantity > 0 };
        saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
        return { data: inventory[index] };
      }
    }

    if (url.startsWith('/ris/') && url.endsWith('/send')) {
      const id = Number(url.split('/')[2]);
      const index = ris.findIndex((r: any) => r.id === id);
      if (index !== -1) {
        ris[index].status = 'sent';
        saveToStorage(STORAGE_KEYS.RIS, ris);
        return { data: ris[index] };
      }
    }

    if (url.startsWith('/ris/') && url.endsWith('/status')) {
      const id = Number(url.split('/')[2]);
      const index = ris.findIndex((r: any) => r.id === id);
      if (index !== -1) {
        ris[index].status = data.status;
        
        if (data.status === 'approved') {
          const request = ris[index];
          request.items.forEach((reqItem: any) => {
            const invIndex = inventory.findIndex((inv: any) => inv.id === reqItem.inventory_id);
            if (invIndex !== -1) {
              const qty = Number(reqItem.quantity_issue) || 0;
              inventory[invIndex].quantity -= qty;
              inventory[invIndex].is_available = inventory[invIndex].quantity > 0;
            }
          });
          saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
        }
        
        saveToStorage(STORAGE_KEYS.RIS, ris);
        return { data: ris[index] };
      }
    }

    if (url.startsWith('/ris/') && url.endsWith('/mark-received')) {
      const id = Number(url.split('/')[2]);
      const index = ris.findIndex((r: any) => r.id === id);
      if (index !== -1) {
        ris[index].status = 'received';
        saveToStorage(STORAGE_KEYS.RIS, ris);
        return { data: ris[index] };
      }
    }

    if (url.startsWith('/ris/') && url.endsWith('/items')) {
      const id = Number(url.split('/')[2]);
      const index = ris.findIndex((r: any) => r.id === id);
      if (index !== -1) {
        ris[index].items = data.items;
        saveToStorage(STORAGE_KEYS.RIS, ris);
        return { data: ris[index] };
      }
    }

    if (url.startsWith('/ris/') && url.endsWith('/assign-ris-no')) {
      const id = Number(url.split('/')[2]);
      const index = ris.findIndex((r: any) => r.id === id);
      if (index !== -1) {
        ris[index].ris_no = data.ris_no;
        saveToStorage(STORAGE_KEYS.RIS, ris);
        return { data: ris[index] };
      }
    }

    if (url.startsWith('/users/') && url.endsWith('/toggle')) {
      const id = Number(url.split('/')[2]);
      const users = getFromStorage(STORAGE_KEYS.USERS);
      const index = users.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        users[index].is_active = !users[index].is_active;
        saveToStorage(STORAGE_KEYS.USERS, users);
        return { data: users[index] };
      }
    }

    if (url.startsWith('/users/') && !url.endsWith('/toggle')) {
      const id = Number(url.split('/')[2]);
      const users = getFromStorage(STORAGE_KEYS.USERS);
      const index = users.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveToStorage(STORAGE_KEYS.USERS, users);
        return { data: users[index] };
      }
    }

    return { data: null as any };
  },

  delete: async (url, config) => {
    console.log(`DELETE ${url}`);
    const inventory = getFromStorage(STORAGE_KEYS.INVENTORY);
    if (url.startsWith('/inventory/')) {
      const id = Number(url.split('/').pop());
      const filtered = inventory.filter((i: any) => i.id !== id);
      saveToStorage(STORAGE_KEYS.INVENTORY, filtered);
      return { data: { message: 'Deleted' } as any };
    }
    if (url.startsWith('/users/')) {
      const id = Number(url.split('/').pop());
      const users = getFromStorage(STORAGE_KEYS.USERS);
      const filtered = users.filter((u: any) => u.id !== id);
      saveToStorage(STORAGE_KEYS.USERS, filtered);
      return { data: { message: 'Deleted' } as any };
    }

    return { data: null as any };
  }
};

export default api;
