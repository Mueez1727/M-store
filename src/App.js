import React, { useState, useEffect } from 'react';
import { Moon, Sun, ShoppingCart, TrendingUp, Download, Plus, Trash2, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function SalesManagementSystem() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [purchases, setPurchases] = useState({});
  const [sales, setSales] = useState({});
  const [newPurchaseRow, setNewPurchaseRow] = useState({ itemName: '', quantity: '', price: '', purchasedFrom: '' });
  const [newSaleRow, setNewSaleRow] = useState({ itemName: '', quantity: '', price: '', soldTo: '' });
  const [addingRowDate, setAddingRowDate] = useState(null);

  // Initialize data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedPurchases = await window.storage?.get('purchases');
        const savedSales = await window.storage?.get('sales');
        if (savedPurchases) setPurchases(JSON.parse(savedPurchases.value || '{}'));
        if (savedSales) setSales(JSON.parse(savedSales.value || '{}'));
      } catch (e) {
        console.log('No saved data');
      }
    };
    loadData();
  }, []);

  // Save data to storage
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.storage?.set('purchases', JSON.stringify(purchases));
        await window.storage?.set('sales', JSON.stringify(sales));
      } catch (e) {
        console.log('Failed to save');
      }
    };
    if (Object.keys(purchases).length > 0 || Object.keys(sales).length > 0) {
      saveData();
    }
  }, [purchases, sales]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = new Date();
  const today = currentDate.toISOString().split('T')[0];
  const currentYear = currentDate.getFullYear();

  const getDaysInMonth = (month) => {
    return new Date(currentYear, month + 1, 0).getDate();
  };

  const getDateString = (month, day) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear}-${monthStr}-${dayStr}`;
  };

  const toggleDay = (dateKey) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const addPurchaseRow = (dateKey) => {
    if (newPurchaseRow.itemName && newPurchaseRow.quantity && newPurchaseRow.price) {
      setPurchases(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newPurchaseRow]
      }));
      setNewPurchaseRow({ itemName: '', quantity: '', price: '', purchasedFrom: '' });
      setAddingRowDate(null);
    }
  };

  const addSaleRow = (dateKey) => {
    if (newSaleRow.itemName && newSaleRow.quantity && newSaleRow.price) {
      setSales(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newSaleRow]
      }));
      setNewSaleRow({ itemName: '', quantity: '', price: '', soldTo: '' });
      setAddingRowDate(null);
    }
  };

  const deletePurchase = (dateKey, index) => {
    setPurchases(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== index)
    }));
  };

  const deleteSale = (dateKey, index) => {
    setSales(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== index)
    }));
  };

  const calculateStats = (dataType, period) => {
    const data = dataType === 'purchase' ? purchases : sales;
    let filteredData = [];

    if (period === 'daily') {
      filteredData = data[today] || [];
    } else if (period === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        filteredData = [...filteredData, ...(data[dateStr] || [])];
      }
    } else if (period === 'monthly') {
      const monthKey = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      Object.keys(data).forEach(date => {
        if (date.startsWith(monthKey)) {
          filteredData = [...filteredData, ...(data[date] || [])];
        }
      });
    } else {
      Object.values(data).forEach(dateData => {
        filteredData = [...filteredData, ...(dateData || [])];
      });
    }

    const totalAmount = filteredData.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const totalItems = filteredData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    return { amount: totalAmount, items: totalItems };
  };

  const calculateProfit = (period) => {
    const purchaseStats = calculateStats('purchase', period);
    const saleStats = calculateStats('sale', period);
    return saleStats.amount - purchaseStats.amount;
  };

  const downloadExcel = (dataType, period) => {
    const data = dataType === 'purchase' ? purchases : sales;
    let filteredData = [];
    let dateKey = '';

    if (period === 'daily') {
      filteredData = data[today] || [];
      dateKey = today;
    } else if (period === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        filteredData = [...filteredData, ...(data[dateStr] || [])];
      }
      dateKey = 'Weekly';
    } else if (period === 'monthly') {
      const monthKey = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      Object.keys(data).forEach(date => {
        if (date.startsWith(monthKey)) {
          filteredData = [...filteredData, ...(data[date] || [])];
        }
      });
      dateKey = 'Monthly';
    } else {
      Object.values(data).forEach(dateData => {
        filteredData = [...filteredData, ...(dateData || [])];
      });
      dateKey = 'Overall';
    }

    const csv = generateCSV(filteredData, dataType);
    downloadCSV(csv, `${dataType}-${dateKey}.csv`);
  };

  const generateCSV = (data, dataType) => {
    const headers = dataType === 'purchase' 
      ? ['Item Name', 'Quantity', 'Price (Rs)', 'Purchased From', 'Date']
      : ['Item Name', 'Quantity', 'Price (Rs)', 'Sold To', 'Date'];
    
    const rows = data.map(item => [
      item.itemName,
      item.quantity,
      item.price,
      item.purchasedFrom || item.soldTo || '',
      item.date || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Accordion component for dates
  const DateAccordion = ({ dateKey, label, dataType }) => {
    const isExpanded = expandedDays[dateKey];
    const data = dataType === 'purchase' ? purchases[dateKey] : sales[dateKey];
    const isToday = dateKey === today;
    const showAddRow = addingRowDate === dateKey;

    return (
      <div className={`border ${borderColor} rounded-lg mb-3 overflow-hidden`}>
        <button
          onClick={() => toggleDay(dateKey)}
          className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-4 flex justify-between items-center transition`}
        >
          <span className="font-semibold">{label} {isToday && <span className="text-xs ml-2 bg-green-500 text-white px-2 py-1 rounded">Today</span>}</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {isExpanded && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 border-t ${borderColor}`}>
            {data && data.length > 0 ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${borderColor}`}>
                      <th className="px-3 py-2 text-left">Item Name</th>
                      <th className="px-3 py-2 text-right">Quantity</th>
                      <th className="px-3 py-2 text-right">Price (Rs)</th>
                      <th className="px-3 py-2 text-left">{dataType === 'purchase' ? 'Purchased From' : 'Sold To'}</th>
                      {isToday && <th className="px-3 py-2 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr key={idx} className={`border-b ${borderColor}`}>
                        <td className="px-3 py-2">{item.itemName}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">Rs {parseFloat(item.price).toFixed(2)}</td>
                        <td className="px-3 py-2">{item.purchasedFrom || item.soldTo || '-'}</td>
                        {isToday && (
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => dataType === 'purchase' ? deletePurchase(dateKey, idx) : deleteSale(dateKey, idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No data for this date</p>
            )}

            {isToday && (
              <>
                {!showAddRow ? (
                  <button
                    onClick={() => setAddingRowDate(dateKey)}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                  >
                    <Plus size={18} /> Add Row
                  </button>
                ) : (
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                    <h5 className="font-semibold mb-3">Add New {dataType === 'purchase' ? 'Purchase' : 'Sale'}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={dataType === 'purchase' ? newPurchaseRow.itemName : newSaleRow.itemName}
                        onChange={(e) => dataType === 'purchase' 
                          ? setNewPurchaseRow({...newPurchaseRow, itemName: e.target.value})
                          : setNewSaleRow({...newSaleRow, itemName: e.target.value})
                        }
                        className={`px-3 py-2 rounded border ${borderColor} ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={dataType === 'purchase' ? newPurchaseRow.quantity : newSaleRow.quantity}
                        onChange={(e) => dataType === 'purchase' 
                          ? setNewPurchaseRow({...newPurchaseRow, quantity: e.target.value})
                          : setNewSaleRow({...newSaleRow, quantity: e.target.value})
                        }
                        className={`px-3 py-2 rounded border ${borderColor} ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                      />
                      <input
                        type="number"
                        placeholder="Price (Rs)"
                        value={dataType === 'purchase' ? newPurchaseRow.price : newSaleRow.price}
                        onChange={(e) => dataType === 'purchase' 
                          ? setNewPurchaseRow({...newPurchaseRow, price: e.target.value})
                          : setNewSaleRow({...newSaleRow, price: e.target.value})
                        }
                        className={`px-3 py-2 rounded border ${borderColor} ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                      />
                      <input
                        type="text"
                        placeholder={dataType === 'purchase' ? 'Purchased From' : 'Sold To'}
                        value={dataType === 'purchase' ? newPurchaseRow.purchasedFrom : newSaleRow.soldTo}
                        onChange={(e) => dataType === 'purchase' 
                          ? setNewPurchaseRow({...newPurchaseRow, purchasedFrom: e.target.value})
                          : setNewSaleRow({...newSaleRow, soldTo: e.target.value})
                        }
                        className={`px-3 py-2 rounded border ${borderColor} ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                      />
                      <button
                        onClick={() => dataType === 'purchase' ? addPurchaseRow(dateKey) : addSaleRow(dateKey)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Add
                      </button>
                    </div>
                    <button
                      onClick={() => setAddingRowDate(null)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Navbar */}
      <nav className={`${cardBg} border-b ${borderColor} sticky top-0 z-50 shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">M Store</h1>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Boxes */}
        {currentPage === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div onClick={() => { setCurrentPage('purchasing'); setSelectedMonth(null); setExpandedDays({}); }} className={`${cardBg} p-8 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:scale-105 border ${borderColor}`}>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <ShoppingCart size={48} className="mx-auto mb-4 text-blue-500" />
                    <h2 className="text-2xl font-bold">Purchasing</h2>
                  </div>
                </div>
              </div>
              <div onClick={() => { setCurrentPage('selling'); setSelectedMonth(null); setExpandedDays({}); }} className={`${cardBg} p-8 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:scale-105 border ${borderColor}`}>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <TrendingUp size={48} className="mx-auto mb-4 text-green-500" />
                    <h2 className="text-2xl font-bold">Selling</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Table */}
            <div className={`${cardBg} rounded-lg shadow-lg p-6 border ${borderColor} overflow-x-auto`}>
              <h3 className="text-xl font-bold mb-4">Overall Statistics</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${borderColor}`}>
                    <th className="px-4 py-2 text-left">Period</th>
                    <th className="px-4 py-2 text-right">Purchasing (Rs)</th>
                    <th className="px-4 py-2 text-right">Purchasing Items</th>
                    <th className="px-4 py-2 text-right">Selling (Rs)</th>
                    <th className="px-4 py-2 text-right">Selling Items</th>
                    <th className="px-4 py-2 text-right">Profit (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {['daily', 'weekly', 'monthly', 'overall'].map(period => {
                    const purchaseStats = calculateStats('purchase', period);
                    const saleStats = calculateStats('sale', period);
                    const profit = calculateProfit(period);
                    return (
                      <tr key={period} className={`border-b ${borderColor} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 font-semibold capitalize">{period}</td>
                        <td className="px-4 py-2 text-right">Rs {purchaseStats.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{purchaseStats.items}</td>
                        <td className="px-4 py-2 text-right">Rs {saleStats.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{saleStats.items}</td>
                        <td className="px-4 py-2 text-right font-bold text-green-500">Rs {profit.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button onClick={() => downloadExcel('stats', 'overall')} className="mt-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                <Download size={20} /> Download Excel
              </button>
            </div>
          </>
        )}

        {/* Purchasing Page */}
        {currentPage === 'purchasing' && (
          <>
            <button onClick={() => setCurrentPage('dashboard')} className="mb-6 flex items-center gap-2 text-blue-500 hover:text-blue-600">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {months.map((month, idx) => (
                <div key={idx} onClick={() => setSelectedMonth(idx)} className={`${selectedMonth === idx ? 'ring-2 ring-blue-500' : ''} ${cardBg} p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition border ${borderColor}`}>
                  <p className="font-semibold text-center">{month}</p>
                </div>
              ))}
            </div>

            {selectedMonth !== null && (
              <div className={`${cardBg} rounded-lg shadow-lg p-6 border ${borderColor}`}>
                <h3 className="text-2xl font-bold mb-6">{months[selectedMonth]} - Purchasing Details</h3>
                
                {Array.from({ length: getDaysInMonth(selectedMonth) }).map((_, dayIdx) => {
                  const dateKey = getDateString(selectedMonth, dayIdx + 1);
                  const dayLabel = formatDateDisplay(dateKey);
                  return (
                    <DateAccordion
                      key={dateKey}
                      dateKey={dateKey}
                      label={dayLabel}
                      dataType="purchase"
                    />
                  );
                })}

                <button onClick={() => downloadExcel('purchase', 'monthly')} className="mt-6 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                  <Download size={20} /> Download Excel
                </button>
              </div>
            )}
          </>
        )}

        {/* Selling Page */}
        {currentPage === 'selling' && (
          <>
            <button onClick={() => setCurrentPage('dashboard')} className="mb-6 flex items-center gap-2 text-blue-500 hover:text-blue-600">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {months.map((month, idx) => (
                <div key={idx} onClick={() => setSelectedMonth(idx)} className={`${selectedMonth === idx ? 'ring-2 ring-green-500' : ''} ${cardBg} p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition border ${borderColor}`}>
                  <p className="font-semibold text-center">{month}</p>
                </div>
              ))}
            </div>

            {selectedMonth !== null && (
              <div className={`${cardBg} rounded-lg shadow-lg p-6 border ${borderColor}`}>
                <h3 className="text-2xl font-bold mb-6">{months[selectedMonth]} - Selling Details</h3>
                
                {Array.from({ length: getDaysInMonth(selectedMonth) }).map((_, dayIdx) => {
                  const dateKey = getDateString(selectedMonth, dayIdx + 1);
                  const dayLabel = formatDateDisplay(dateKey);
                  return (
                    <DateAccordion
                      key={dateKey}
                      dateKey={dateKey}
                      label={dayLabel}
                      dataType="sale"
                    />
                  );
                })}

                <button onClick={() => downloadExcel('sale', 'monthly')} className="mt-6 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                  <Download size={20} /> Download Excel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}