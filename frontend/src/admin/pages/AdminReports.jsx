import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileSpreadsheet, FileText, Calendar, Download, CheckCircle, PieChart, TrendingUp, Users } from 'lucide-react'
import { getAdminOrders } from '../../services/orderApi'
import { getAdminProducts } from '../../services/adminCatalogApi'
import { getAdminUsers } from '../../services/adminUserApi'
import { useToast } from '../../context/ToastContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatDateStamp = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

export function AdminReports() {
  const toast = useToast()
  const [reportType, setReportType] = useState('sales')
  const [dateRange, setDateRange] = useState('this-month')
  const [format, setFormat] = useState('csv')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const jsonToCSV = (json, fileName) => {
    if (!json || json.length === 0) {
      toast.error('No data found for this report')
      return
    }

    try {
      const header = Object.keys(json[0])
      const csvRows = [
        header.join(','), // Header row
        ...json.map(row => 
          header.map(fieldName => {
            const value = row[fieldName] ?? ''
            const stringValue = String(value).replace(/"/g, '""')
            return `"${stringValue}"`
          }).join(',')
        )
      ]

      const csvString = csvRows.join('\n')
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return true
    } catch (err) {
      console.error('CSV Conversion Error:', err)
      return false
    }
  }

  const jsonToPDF = (json, fileName, title) => {
    if (!json || json.length === 0) {
      toast.error('No data found for this report')
      return false
    }

    try {
      const doc = new jsPDF()
      const headers = Object.keys(json[0])
      const data = json.map(row => headers.map(field => row[field]))

      // Report Branding
      doc.setFontSize(20)
      doc.setTextColor(102, 81, 164) // #6651A4
      doc.text('Toyovo India - Admin Intelligence', 14, 20)
      
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Report: ${title}`, 14, 30)
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 37)
      
      // Draw Table
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 45,
        theme: 'striped',
        headStyles: { fillStyle: 'fill', fillColor: [102, 81, 164], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 234, 211, 0.2] }, // Light brand color
        margin: { top: 45 },
        styles: { fontSize: 8, cellPadding: 3 }
      })

      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`)
      return true
    } catch (err) {
      console.error('PDF Conversion Error:', err)
      return false
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerated(false)
    
    try {
      let data = []
      let fileName = 'report'

      if (reportType === 'sales') {
        const res = await getAdminOrders({ limit: 200 })
        data = (res.orders || []).map(o => ({
          OrderNumber: o.orderNumber,
          Customer: o.customerName,
          Email: o.customerEmail,
          Amount: o.total,
          Items: o.items?.length || 0,
          Status: o.status,
          Payment: o.paymentStatus,
          Date: formatDateStamp(o.createdAt)
        }))
        fileName = 'Sales_Revenue_Report'
      } else if (reportType === 'inventory') {
        const res = await getAdminProducts({ limit: 200 })
        data = (res.products || []).map(p => ({
          Name: p.name,
          SKU: p.sku || 'N/A',
          Category: p.category?.name || 'Uncategorized',
          Price: p.price,
          OldPrice: p.oldPrice || 0,
          Stock: p.stock,
          Status: p.status,
          Rating: p.ratings || 0
        }))
        fileName = 'Toy_Catalog_Report'
      } else if (reportType === 'users') {
        const res = await getAdminUsers({ limit: 200 })
        data = (res.users || []).map(u => ({
          Name: u.name,
          Email: u.email,
          Role: u.role,
          Status: u.isActive ? 'Active' : 'Inactive',
          Joined: formatDateStamp(u.createdAt)
        }))
        fileName = 'Explorer_Growth_Report'
      }

      // UX delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (format === 'csv') {
        const success = jsonToCSV(data, fileName)
        if (success) {
          setGenerated(true)
          toast.success('Report downloaded successfully!')
        }
      } else if (format === 'pdf') {
        const title = reportType === 'sales' ? 'Sales & Revenue Report' : 
                      reportType === 'inventory' ? 'Toy Catalog Health' : 'Explorer Growth Report'
        const success = jsonToPDF(data, fileName, title)
        if (success) {
          setGenerated(true)
          toast.success('PDF Report generated successfully!')
        }
      }

      setTimeout(() => setGenerated(false), 3000)
    } catch (error) {
      console.error('Report Generation Error:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="shell space-y-8 pb-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800">Generate Intelligence</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Export Toyovo India performance data and financial metrics.</p>
      </div>

      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-black/[0.03] max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Form Side */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Report Subject</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'sales', label: 'Sales & Revenue', desc: 'Hauls, totals, and refunds', icon: <TrendingUp size={16}/> },
                  { id: 'users', label: 'Explorer Growth', desc: 'New users and engagement', icon: <Users size={16}/> },
                  { id: 'inventory', label: 'Toy Catalog Health', desc: 'Stock levels and categories', icon: <PieChart size={16}/> }
                ].map(type => (
                  <label key={type.id} className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${reportType === type.id ? 'border-[#6651A4] bg-[#6651A4]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="reportType" value={type.id} checked={reportType === type.id} onChange={(e) => setReportType(e.target.value)} className="mt-1 text-[#6651A4] focus:ring-[#6651A4]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 text-[13px]">
                        <span className="text-[#6651A4]">{type.icon}</span> {type.label}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Time Period</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                  value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="ytd">Year to Date</option>
                  <option value="all-time">All Time</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Export Format</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${format === 'csv' ? 'border-[#F1641E] bg-[#F1641E]/5 text-[#F1641E]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                  <FileSpreadsheet size={16} /> <span className="font-bold text-[12px]">CSV (Excel)</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${format === 'pdf' ? 'border-[#F1641E] bg-[#F1641E]/5 text-[#F1641E]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                  <FileText size={16} /> <span className="font-bold text-[12px]">PDF Document</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Side */}
          <div className="bg-[#FAEAD3]/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-black/[0.02]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 relative">
              {isGenerating ? (
                <div className="w-12 h-12 border-4 border-gray-100 border-t-[#6651A4] rounded-full animate-spin" />
              ) : generated ? (
                <CheckCircle size={40} className="text-green-500" />
              ) : (
                <Download size={40} className="text-[#6651A4]" />
              )}
            </div>
            
            <h3 className="text-xl font-grandstander font-bold text-gray-800 mb-2">Ready to Compile</h3>
            <p className="text-[13px] text-gray-500 mb-8 max-w-[250px]">Your report will include all verified data up to the current timestamp.</p>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || generated}
              className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-lg transition-all flex items-center justify-center gap-2
                ${generated ? 'bg-green-500 text-white' : 'bg-[#6651A4] text-white hover:bg-[#5a4892] hover:-translate-y-1'}
                ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isGenerating ? 'Compiling Data...' : generated ? 'Report Downloaded!' : 'Generate & Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
