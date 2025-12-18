import React from 'react';
import { useStore } from '../store';
import { PackagePlus, UploadCloud, FileSpreadsheet, Sparkles, CheckCircle, Download, ArrowRight } from 'lucide-react';

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

      {/* Redesigned 3 Steps Guide */}
      <div className="relative py-24 bg-slate-50 overflow-hidden border-y border-gray-200">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                  <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-100 rounded-full">
                      The Workflow
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                      Simplify Your Export Compliance
                  </h2>
                  <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                      Our intelligent engine handles the complexity of international trade so you don't have to.
                  </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                      <div className="absolute -right-4 -top-8 text-9xl font-black text-gray-50 select-none group-hover:text-blue-50 transition-colors">1</div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200 rotate-3 group-hover:rotate-0 transition-transform">
                              <FileSpreadsheet className="text-white" size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Input Your Order</h3>
                          <p className="text-gray-500 leading-relaxed">
                              Paste a tracking link, upload an Excel file, or simply describe what you're selling. We support major e-commerce formats.
                          </p>
                      </div>
                  </div>

                  {/* Step 2 */}
                  <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                      <div className="absolute -right-4 -top-8 text-9xl font-black text-gray-50 select-none group-hover:text-purple-50 transition-colors">2</div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-200 -rotate-3 group-hover:rotate-0 transition-transform">
                              <Sparkles className="text-white" size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">AI Engine Analysis</h3>
                          <p className="text-gray-500 leading-relaxed">
                              Gemini AI analyzes your description to find the exact HS Code, calculates precise weights, and verifies trade compliance.
                          </p>
                      </div>
                  </div>

                  {/* Step 3 */}
                  <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                      <div className="absolute -right-4 -top-8 text-9xl font-black text-gray-50 select-none group-hover:text-green-50 transition-colors">3</div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-200 rotate-6 group-hover:rotate-0 transition-transform">
                              <Download className="text-white" size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Docs</h3>
                          <p className="text-gray-500 leading-relaxed">
                              Download professionally formatted, customs-ready PDFs. Print them out or attach them to your digital shipping labels instantly.
                          </p>
                      </div>
                  </div>
              </div>

              <div className="mt-16 text-center">
                  <button 
                    onClick={() => setView('NEW_SHIPMENT')}
                    className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-blue-100"
                  >
                      Try It Now for Free
                      <ArrowRight className="ml-2" size={20} />
                  </button>
              </div>
          </div>
      </div>
      
      {/* Footer / CTA */}
      <div className="bg-white py-12 border-t border-gray-200">
          <div className="text-center">
              <p className="text-gray-400 mb-4 uppercase tracking-widest text-[10px] font-bold">Trusted by 1,000+ e-commerce sellers</p>
              <div className="flex justify-center space-x-8 opacity-30 grayscale">
                 {/* Mock Logos */}
                 <span className="text-xl font-black tracking-tighter text-gray-900 italic">SHOPIFY</span>
                 <span className="text-xl font-black tracking-tighter text-gray-900 italic">AMAZON</span>
                 <span className="text-xl font-black tracking-tighter text-gray-900 italic">ETSY</span>
                 <span className="text-xl font-black tracking-tighter text-gray-900 italic">EBAY</span>
              </div>
          </div>
      </div>
    </div>
  );
};