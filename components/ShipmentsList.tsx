import React, { useState } from 'react';
import { useStore } from '../store';
import { generateDocs } from '../utils/pdfGenerator';
import { Search, Download, ExternalLink, Filter } from 'lucide-react';

export const ShipmentsList: React.FC = () => {
  const { shipments, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filtered = shipments.filter(s => {
    const matchesSearch = s.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (shipment: any) => {
    if(!user) return;
    const url = generateDocs(shipment, user);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${shipment.id}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Shipments</h2>
           <p className="text-gray-500">Manage your history and download past documents.</p>
        </div>
        <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white">
                <Filter size={18} className="text-gray-500"/>
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-transparent outline-none text-sm text-gray-700 cursor-pointer"
                >
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="PENDING">Pending</option>
                </select>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search by product or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                 />
             </div>
         </div>
         
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-gray-50 font-semibold">
                     <tr>
                         <th className="px-6 py-4">ID</th>
                         <th className="px-6 py-4">Product</th>
                         <th className="px-6 py-4">Destination</th>
                         <th className="px-6 py-4">HS Code</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {filtered.map(s => (
                         <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                             <td className="px-6 py-4 font-mono text-gray-500 text-xs">{s.id.slice(-6)}</td>
                             <td className="px-6 py-4 font-medium text-gray-900">{s.productDescription}</td>
                             <td className="px-6 py-4">{s.destinationCountry}</td>
                             <td className="px-6 py-4">
                                 <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">{s.hsCode || '---'}</span>
                             </td>
                             <td className="px-6 py-4">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                     s.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                     s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                 }`}>
                                     {s.status === 'SUCCESS' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>}
                                     {s.status}
                                 </span>
                             </td>
                             <td className="px-6 py-4 text-right space-x-2">
                                 <button onClick={() => handleDownload(s)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Download PDF">
                                     <Download size={18} />
                                 </button>
                                 <button className="text-gray-400 hover:text-blue-600 transition-colors" title="View Details">
                                     <ExternalLink size={18} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {filtered.length === 0 && (
                         <tr>
                             <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                 No shipments matching your search.
                             </td>
                         </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};
