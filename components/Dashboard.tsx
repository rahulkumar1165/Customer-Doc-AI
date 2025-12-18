import React from 'react';
import { useStore } from '../store';
import { PackagePlus, UploadCloud, FileSpreadsheet, Download, FileText, CheckCircle } from 'lucide-react';
import { generateDocs } from '../utils/pdfGenerator';

export const Dashboard: React.FC = () => {
  const { setView, user, shipments, setLoginModalOpen } = useStore();

  const handleDownloadRecent = () => {
      if (!user) {
          setLoginModalOpen(true);
          return;
      }
      
      if (shipments.length > 0) {
          // Re-generate doc with logged-in user details to ensure exporter info is correct
          const recent = shipments[0];
          const url = generateDocs(recent, user);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice_${recent.id}.pdf`;
          link.click();
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.companyName.split(' ')[0]}</h2>
          <p className="text-gray-500 mt-2">How would you like to process your customs documents today?</p>
      </div>

      {/* Recent Invoice Section - Shows if there's a recent shipment in session */}
      {shipments.length > 0 && (
          <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-900 text-lg">Invoice Ready</h3>
                      <p className="text-gray-500 text-sm">
                          {shipments[0].productDescription} &bull; {shipments[0].destinationCountry}
                      </p>
                  </div>
              </div>
              <button 
                  onClick={handleDownloadRecent}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 w-full md:w-auto justify-center"
              >
                  <Download size={20} />
                  <span>Download PDF</span>
              </button>
          </div>
      )}

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
          <button 
             onClick={() => setView('NEW_SHIPMENT')}
             className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-left h-80 flex flex-col justify-between"
          >
              <div className="relative z-10">
                  <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 backdrop-blur-sm">
                      <PackagePlus size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Create Single Shipment</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Use "Smart Entry" to auto-fill details from a simple description, or paste raw order text. Best for individual orders.
                  </p>
              </div>
              
              <div className="relative z-10 flex items-center font-bold text-white/90 group-hover:text-white mt-4">
                  <span>Start Manual Entry</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>

              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-500">
                  <PackagePlus size={200} />
              </div>
          </button>

          <button 
             onClick={() => setView('BULK_IMPORT')}
             className="group relative overflow-hidden bg-white border border-gray-200 text-gray-800 p-10 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left h-80 flex flex-col justify-between hover:border-blue-300"
          >
              <div className="relative z-10">
                  <div className="bg-blue-50 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UploadCloud size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Bulk Import</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Upload CSV or Excel files to process hundreds of orders at once. AI enriches missing codes and weights automatically.
                  </p>
              </div>
              
              <div className="relative z-10 flex items-center font-bold text-blue-600 group-hover:text-blue-700 mt-4">
                  <span>Start Bulk Upload</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>

              <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-500">
                  <FileSpreadsheet size={200} />
              </div>
          </button>
      </div>
    </div>
  );
};