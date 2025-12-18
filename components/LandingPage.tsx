import React from 'react';
import { useStore } from '../store';
import { PackagePlus, UploadCloud, FileSpreadsheet, Sparkles, CheckCircle, Download } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setView } = useStore();

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="bg-white pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
                  Customs Paperwork, <span className="text-blue-600">Automated by AI</span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-12">
                  Generate compliant commercial invoices and packing lists in seconds. 
                  Enrich data with AI, find HS codes, and clear customs faster.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Option 1: Single */}
                  <div 
                    onClick={() => setView('NEW_SHIPMENT')}
                    className="group bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                      <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <PackagePlus className="text-blue-600" size={28} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Create New Shipment</h3>
                      <p className="text-gray-500 mb-6">Perfect for single orders. Use our "Smart Entry" to describe goods in plain English and let AI fill the rest.</p>
                      <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                          Start Now <span className="ml-2">&rarr;</span>
                      </div>
                  </div>

                  {/* Option 2: Bulk */}
                  <div 
                    onClick={() => setView('BULK_IMPORT')}
                    className="group bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-green-400 transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                      <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <UploadCloud className="text-green-600" size={28} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import</h3>
                      <p className="text-gray-500 mb-6">Upload CSV/Excel files. Batch process hundreds of orders, validate HS codes, and generate PDFs in bulk.</p>
                      <div className="flex items-center text-green-600 font-bold group-hover:translate-x-1 transition-transform">
                          Upload File <span className="ml-2">&rarr;</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 3 Steps Guide */}
      <div className="bg-gray-50 py-16 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-12">Generate Invoices in 3 Easy Steps</h2>
              
              <div className="grid md:grid-cols-3 gap-12 relative">
                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-0"></div>

                  <div className="relative z-10 bg-gray-50">
                      <div className="w-24 h-24 bg-white border-4 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <span className="text-2xl font-bold text-blue-600">1</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Enter Details</h3>
                      <p className="text-gray-500 px-4">Type a description or upload a file. No need for complex codes yet.</p>
                  </div>

                  <div className="relative z-10 bg-gray-50">
                      <div className="w-24 h-24 bg-white border-4 border-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Sparkles className="text-purple-600" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">AI Enrichment</h3>
                      <p className="text-gray-500 px-4">Our AI identifies the correct HS Code, estimates weight, and assigns Incoterms.</p>
                  </div>

                  <div className="relative z-10 bg-gray-50">
                      <div className="w-24 h-24 bg-white border-4 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Download className="text-green-600" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Download PDF</h3>
                      <p className="text-gray-500 px-4">Get a perfectly formatted Commercial Invoice ready for printing.</p>
                  </div>
              </div>
          </div>
      </div>
      
      {/* Footer / CTA */}
      <div className="bg-white py-12 border-t border-gray-200">
          <div className="text-center">
              <p className="text-gray-400 mb-4">Trusted by 1,000+ e-commerce sellers</p>
              <div className="flex justify-center space-x-6 opacity-50 grayscale">
                 {/* Mock Logos */}
                 <span className="text-xl font-bold text-gray-300">SHOPIFY</span>
                 <span className="text-xl font-bold text-gray-300">AMAZON</span>
                 <span className="text-xl font-bold text-gray-300">ETSY</span>
                 <span className="text-xl font-bold text-gray-300">EBAY</span>
              </div>
          </div>
      </div>
    </div>
  );
};