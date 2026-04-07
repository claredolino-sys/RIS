import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, FileText, Printer, X, Package, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  
  const [reportType, setReportType] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [generating, setGenerating] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedSemester, setSelectedSemester] = useState(new Date().getMonth() < 6 ? 1 : 2);

  const [viewingReport, setViewingReport] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReportType, setFilterReportType] = useState('all');
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    monthly: true,
    quarterly: true,
    semestral: true,
    yearly: true
  });

  const toggleType = (type: string) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/users');
      const deps = Array.from(new Set(res.data.map((u: any) => u.department))).filter(Boolean) as string[];
      setDepartments(deps);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/reports/generate', { 
        type: reportType,
        department: selectedDepartment === 'all' ? null : selectedDepartment,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter,
        semester: selectedSemester
      });
      toast.success('Report generated successfully');
      fetchReports();
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (reportData: any) => {
    let dataToUse = reportData;
    if (!reportData.data) {
      try {
        const res = await api.get(`/reports/${reportData.id}`);
        dataToUse = res.data;
      } catch (err) {
        toast.error('Failed to fetch report data for PDF');
        return;
      }
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(26, 35, 64); // #1A2340
    doc.text('INVENTORY QUANTITY REPORT', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Gray
    doc.text(`Period: ${dataToUse.period_label}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Department: ${dataToUse.department || 'All Departments'}`, pageWidth / 2, 34, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(dataToUse.createdAt).toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });

    // Most Requested Section
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 64);
    doc.text('MOST REQUESTED ITEMS', 14, 50);
    
    const mostHeaders = [['Stock No.', 'Description', 'Category', 'Unit', 'Issued Qty', 'Remaining Qty']];
    const mostRows = dataToUse.data.mostRequested.map((item: any) => [
      item.stock_no,
      item.name,
      item.category,
      item.unit,
      item.issued.toString(),
      item.remaining.toString()
    ]);

    autoTable(doc, {
      startY: 55,
      head: mostHeaders,
      body: mostRows,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] }, // Orange for most requested
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Least Requested Section
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 64);
    doc.text('LEAST REQUESTED ITEMS', 14, finalY + 15);

    const leastHeaders = [['Stock No.', 'Description', 'Category', 'Unit', 'Issued Qty', 'Remaining Qty']];
    const leastRows = dataToUse.data.leastRequested.map((item: any) => [
      item.stock_no,
      item.name,
      item.category,
      item.unit,
      item.issued.toString(),
      item.remaining.toString()
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: leastHeaders,
      body: leastRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] }, // Blue for least requested
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Summary Section
    const summaryY = (doc as any).lastAutoTable.finalY || finalY + 20;
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 64);
    doc.text('BRIEF SUMMARY REPORT', 14, summaryY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(dataToUse.data.summary, pageWidth - 28);
    doc.text(splitSummary, 14, summaryY + 22);

    doc.save(`Report_${dataToUse.id}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const handleViewReport = async (id: number) => {
    try {
      const res = await api.get(`/reports/${id}`);
      setViewingReport(res.data);
    } catch (err) {
      toast.error('Failed to fetch report details');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold text-[#1A2340]">Inventory Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and view inventory quantity reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-wrap items-end gap-4 print:hidden">
        <div className="flex-1 min-w-[150px] max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semestral">Semestral</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px] max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {reportType === 'monthly' && (
          <div className="flex-1 min-w-[150px] max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'quarterly' && (
          <div className="flex-1 min-w-[150px] max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(Number(e.target.value))}
            >
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
          </div>
        )}

        {reportType === 'semestral' && (
          <div className="flex-1 min-w-[150px] max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSemester}
              onChange={e => setSelectedSemester(Number(e.target.value))}
            >
              <option value={1}>1st Semester (Jan-Jun)</option>
              <option value={2}>2nd Semester (Jul-Dec)</option>
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[150px] max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-gray-700">Reports Archive</h3>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterReportType}
              onChange={(e) => setFilterReportType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semestral">Semestral</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Search reports (ID, period, department...)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {(() => {
            const filtered = reports.filter(r => {
              const matchesSearch = r.period_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.department || 'All Departments').toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `REP-${String(r.id).padStart(4, '0')}`.toLowerCase().includes(searchTerm.toLowerCase());
              
              const matchesType = filterReportType === 'all' || r.report_type === filterReportType;

              return matchesSearch && matchesType;
            });

            if (filtered.length === 0) {
              return <div className="text-center py-12 text-gray-500 italic">No reports found matching your search.</div>;
            }

            // Grouping logic
            const grouped: Record<string, Record<string, any[]>> = {};
            filtered.forEach(r => {
              const type = r.report_type;
              const dept = r.department || 'All Departments';
              if (!grouped[type]) grouped[type] = {};
              if (!grouped[type][dept]) grouped[type][dept] = [];
              grouped[type][dept].push(r);
            });

            return Object.entries(grouped).map(([type, depts]) => (
              <div key={type} className="mb-8 last:mb-0 border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider capitalize">
                    {type} Reports
                  </h4>
                  {expandedTypes[type] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                
                {expandedTypes[type] && (
                  <div className="p-4 bg-white">
                    {Object.entries(depts).map(([dept, deptReports]) => (
                      <div key={dept} className="mb-6 last:mb-0 ml-2">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          {dept}
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase">ID</th>
                                <th className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase">Period</th>
                                <th className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase">Generated On</th>
                                <th className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {deptReports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3 px-4 font-mono text-xs text-gray-500">REP-{String(report.id).padStart(4, '0')}</td>
                                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{report.period_label}</td>
                                  <td className="py-3 px-4 text-xs text-gray-500">{new Date(report.createdAt).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleViewReport(report.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View / Print">
                                      <FileText size={16} />
                                    </button>
                                    <button onClick={() => handleDownloadPDF(report)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Download PDF">
                                      <FileDown size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:bg-white print:static print:inset-auto print:flex-col print:z-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Report Preview: {viewingReport.period_label}</h2>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadPDF(viewingReport)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  <FileDown size={16} /> PDF
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => setViewingReport(null)} className="text-gray-400 hover:text-gray-600 p-2">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto print:overflow-visible print:p-0 bg-white">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold uppercase">Inventory Quantity Report</h1>
                <h2 className="text-lg font-semibold mt-1">{viewingReport.period_label}</h2>
                <p className="text-sm text-gray-600 mt-2">Department: {viewingReport.department || 'All Departments'}</p>
                <p className="text-sm text-gray-600">Generated: {new Date(viewingReport.createdAt).toLocaleString()}</p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                    <Package size={20} />
                    Most Requested Items
                  </h3>
                  <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-orange-50">
                        <th className="border border-gray-300 p-2 font-bold">Stock No.</th>
                        <th className="border border-gray-300 p-2 font-bold">Description</th>
                        <th className="border border-gray-300 p-2 font-bold">Category</th>
                        <th className="border border-gray-300 p-2 font-bold">Unit</th>
                        <th className="border border-gray-300 p-2 font-bold text-right">Issued Qty</th>
                        <th className="border border-gray-300 p-2 font-bold text-right">Remaining Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReport.data.mostRequested.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-2 font-mono text-xs">{item.stock_no}</td>
                          <td className="border border-gray-300 p-2">{item.name}</td>
                          <td className="border border-gray-300 p-2">{item.category}</td>
                          <td className="border border-gray-300 p-2">{item.unit}</td>
                          <td className="border border-gray-300 p-2 text-right font-bold text-orange-600">{item.issued}</td>
                          <td className="border border-gray-300 p-2 text-right">{item.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                    <Package size={20} />
                    Least Requested Items
                  </h3>
                  <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="border border-gray-300 p-2 font-bold">Stock No.</th>
                        <th className="border border-gray-300 p-2 font-bold">Description</th>
                        <th className="border border-gray-300 p-2 font-bold">Category</th>
                        <th className="border border-gray-300 p-2 font-bold">Unit</th>
                        <th className="border border-gray-300 p-2 font-bold text-right">Issued Qty</th>
                        <th className="border border-gray-300 p-2 font-bold text-right">Remaining Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReport.data.leastRequested.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-2 font-mono text-xs">{item.stock_no}</td>
                          <td className="border border-gray-300 p-2">{item.name}</td>
                          <td className="border border-gray-300 p-2">{item.category}</td>
                          <td className="border border-gray-300 p-2">{item.unit}</td>
                          <td className="border border-gray-300 p-2 text-right font-bold text-blue-600">{item.issued}</td>
                          <td className="border border-gray-300 p-2 text-right">{item.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Brief Summary Report</h3>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{viewingReport.data.summary}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

