import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { useStore } from '../store';
import { enrichShipment, validateShipment } from '../services/geminiService';
import { generateDocs } from '../utils/pdfGenerator';
import { ShipmentStatus, ExportReason, Incoterm, BulkImportStep, BulkRow, BulkRowStatus } from '../types';
import { 
  Upload, FileText, Check, Loader2, Play, AlertTriangle, FileUp, 
  Search, Filter, Edit2, Download, ChevronRight, CheckCircle, AlertCircle, XCircle, ArrowLeft, Save, FileSpreadsheet
} from 'lucide-react';

export const BulkUpload: React.FC = () => {
  const { addShipment, user, setView, setLoginModalOpen } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- STATE --
  const [step, setStep] = useState<BulkImportStep>('UPLOAD');
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Review View State
  const [filterStatus, setFilterStatus] = useState<'ALL' | BulkRowStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  const sampleTemplate = `order_id,buyer_name,buyer_address,desc,qty,unit_price,origin,dest
ORD-1001,John Doe,"123 Main St, London, UK",Cotton T-Shirt,10,15,USA,UK
ORD-1002,Jane Smith,"45 Ave Paris, France",Ceramic Vase,2,40,USA,France
ORD-1003,Tech Corp,"88 Innovation Dr, Toronto",Bluetooth Speaker,50,25,China,Canada`;

  // -- HANDLERS --

  // 1. Download Sample Template
  const handleDownloadTemplate = () => {
    const headers = ["order_id", "buyer_name", "buyer_address", "desc", "qty", "unit_price", "origin", "dest"];
    const data = [
        ["ORD-1001", "John Doe", "123 Main St, London, UK", "Cotton T-Shirt", 10, 15, "USA", "UK"],
        ["ORD-1002", "Jane Smith", "45 Ave Paris, France", "Ceramic Vase", 2, 40, "USA", "France"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "customs_import_template.xlsx");
  };

  // 2. File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) return;

        try {
            // Read the file as an ArrayBuffer
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Convert to CSV for the text area preview
            const csv = XLSX.utils.sheet_to_csv(sheet);
            setCsvText(csv);
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Failed to parse file. Please ensure it is a valid CSV or Excel file.");
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseAndStartEnrichment = () => {
    const text = csvText.trim();
    if (!text) return;

    try {
        // Use XLSX to parse the CSV text from the textarea robustly
        const workbook = XLSX.read(text, { type: 'string', format: 'csv' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Parse to JSON to get key-value pairs
        const rawObjects: any[] = XLSX.utils.sheet_to_json(sheet);
        
        const parsedRows = rawObjects.map((obj: any, idx) => {
             // Normalize keys (case insensitive check or specific mapping)
             const getVal = (keys: string[]) => {
                 const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase()));
                 return foundKey ? obj[foundKey] : '';
             };

             const description = getVal(['desc', 'description', 'product', 'item']) || '';

             return {
                id: idx,
                original: {
                    orderId: String(getVal(['order_id', 'id', 'orderid']) || `ID-${idx + 1}`),
                    buyerName: String(getVal(['buyer_name', 'buyer', 'name']) || 'Guest Buyer'),
                    buyerAddress: String(getVal(['buyer_address', 'address']) || 'Unknown Address'),
                    description: String(description || 'General Merchandise'),
                    quantity: parseFloat(getVal(['qty', 'quantity']) || '1'),
                    unitPrice: parseFloat(getVal(['unit_price', 'price', 'value']) || '10'),
                    origin: String(getVal(['origin', 'origin_country']) || (user?.defaultOrigin || 'USA')),
                    destination: String(getVal(['dest', 'destination', 'country']) || ''),
                },
                status: 'OK' as BulkRowStatus,
                messages: []
            };
        }).filter(r => r.original.description && r.original.description !== 'desc');

        if (parsedRows.length === 0) {
            alert("No valid rows found. Please check headers.");
            return;
        }

        setRows(parsedRows);
        setStep('ENRICHING');

    } catch (e) {
        console.error("Parsing error", e);
        alert("Error parsing data. Please check the format.");
    }
  };

  // 3. AI Enrichment Loop
  useEffect(() => {
    if (step === 'ENRICHING') {
      const runBatch = async () => {
        const processedRows = [...rows];
        setProgress(0);

        for (let i = 0; i < processedRows.length; i++) {
            const row = processedRows[i];
            try {
                // AI Call
                const enriched = await enrichShipment(
                    row.original.description,
                    row.original.quantity,
                    row.original.quantity * row.original.unitPrice,
                    row.original.origin,
                    row.original.destination,
                    'Buyer'
                );

                row.enriched = {
                    hsCode: enriched.hsCode,
                    grossWeight: enriched.grossWeight,
                    netWeight: enriched.netWeight,
                    incoterms: enriched.incoterms as Incoterm,
                    reasonForExport: ExportReason.SALE,
                    material: enriched.material,
                    intendedUse: enriched.intendedUse,
                    riskLevel: enriched.riskLevel || 'LOW'
                };

                // Validate
                const validation = await validateShipment({ ...row.original, ...row.enriched });
                
                if (!validation.valid) {
                    row.status = 'WARNING';
                    row.messages = validation.warnings || ['Potential mismatch'];
                }

                // Hard Validation
                if (!row.original.destination) {
                    row.status = 'ERROR';
                    row.messages.push('Missing Destination');
                }
                if (!row.enriched.hsCode) {
                   row.status = 'ERROR';
                   row.messages.push('AI failed to classify');
                }

            } catch (e) {
                row.status = 'ERROR';
                row.messages = ['AI Service Failed'];
            }

            // Update Progress
            if (i % 3 === 0 || i === processedRows.length - 1) {
                setRows([...processedRows]); // Force re-render for progress updates visually if needed
                setProgress(Math.round(((i + 1) / processedRows.length) * 100));
            }
            await new Promise(r => setTimeout(r, 200)); // Rate limit buffer
        }
        setStep('REVIEW');
      };
      runBatch();
    }
  }, [step]);

  // 4. Review & Edit
  const handleUpdateRow = (id: number, field: string, value: any) => {
      setRows(rows.map(r => {
          if (r.id === id && r.enriched) {
              return { 
                  ...r, 
                  enriched: { ...r.enriched, [field]: value },
                  status: 'OK', // Reset status on manual fix
                  isUserConfirmed: true,
                  messages: [] // Clear errors
              };
          }
          return r;
      }));
  };

  const filteredRows = rows.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        r.original.orderId.toLowerCase().includes(searchLower) ||
        r.original.description.toLowerCase().includes(searchLower);
      const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  // 5. Generate & Download
  const handleGenerate = async () => {
      setStep('GENERATING');
      setProgress(0);
      
      const validRows = rows.filter(r => r.status !== 'ERROR');
      
      // Use dummy user if not logged in
      const dummyUser = user || {
           id: 'temp', email: '', companyName: 'Your Company', address: 'Address', defaultOrigin: 'USA', subscriptionTier: 'FREE', shipmentsCount: 0
      };

      for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          if (!row.enriched) continue;

          // Create finalized shipment object
          const shipmentData = {
              id: `bulk_${Date.now()}_${row.id}`,
              userId: user?.id || 'temp',
              productDescription: row.original.description,
              material: row.enriched.material,
              intendedUse: row.enriched.intendedUse,
              quantity: row.original.quantity,
              unitPrice: row.original.unitPrice,
              currency: 'USD',
              originCountry: row.original.origin,
              destinationCountry: row.original.destination,
              grossWeight: row.enriched.grossWeight,
              netWeight: row.enriched.netWeight,
              packageCount: 1,
              incoterms: row.enriched.incoterms,
              reasonForExport: row.enriched.reasonForExport,
              hsCode: row.enriched.hsCode,
              consigneeName: row.original.buyerName,
              consigneeAddress: row.original.buyerAddress,
              status: ShipmentStatus.SUCCESS,
              createdAt: new Date().toISOString(),
              docsGenerated: true,
              validationWarnings: row.messages
          };

          // Generate PDF
          const pdfUrl = generateDocs(shipmentData, dummyUser);
          row.pdfUrl = pdfUrl;
          
          // Always add to store (persists for session)
          addShipment(shipmentData);

          setProgress(Math.round(((i + 1) / validRows.length) * 100));
          await new Promise(r => setTimeout(r, 50));
      }
      setStep('COMPLETE');
  };

  const handleDownloadZip = async () => {
      if (!user) {
          setLoginModalOpen(true);
          return;
      }
      const zip = new JSZip();
      const folder = zip.folder("invoices");
      
      const validRows = rows.filter(r => r.pdfUrl);
      for (const row of validRows) {
          if (row.pdfUrl && folder) {
              const blob = await fetch(row.pdfUrl).then(r => r.blob());
              folder.file(`${row.original.orderId}_invoice.pdf`, blob);
          }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk_invoices_${new Date().toISOString().slice(0,10)}.zip`;
      link.click();
  };

  const handleDownloadCSV = () => {
      if (!user) {
          setLoginModalOpen(true);
          return;
      }
      const header = ['Order ID', 'Description', 'HS Code', 'Weight', 'Incoterm', 'Status'];
      const lines = rows.map(r => [
          r.original.orderId,
          `"${r.original.description}"`,
          r.enriched?.hsCode || '',
          r.enriched?.grossWeight || '',
          r.enriched?.incoterms || '',
          r.status
      ].join(','));
      
      const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enriched_data.csv`;
      link.click();
  };


  // -- RENDER VIEWS --

  if (step === 'UPLOAD') {
      return (
          <div className="max-w-4xl mx-auto animate-in fade-in space-y-8 py-6">
              <div className="flex items-center space-x-4 mb-8">
                  <button onClick={() => setView('DASHBOARD')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><ArrowLeft size={24}/></button>
                  <h2 className="text-2xl font-bold text-gray-900">Bulk Import Wizard</h2>
              </div>

              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                   
                   <div className="flex justify-end mb-4">
                       <button 
                         onClick={handleDownloadTemplate}
                         className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                       >
                           <FileSpreadsheet size={16} className="mr-2" />
                           Download Excel Template
                       </button>
                   </div>

                   <div className="border-3 border-dashed border-gray-200 rounded-xl p-12 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                       <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                           <FileUp size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Order File</h3>
                       <p className="text-gray-500 mb-8">Support for Excel (.xlsx) and CSV. Drag & drop or click to browse.</p>
                       <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-200">Select File</button>
                       <input 
                         type="file" 
                         accept=".csv, .xlsx, .xls" 
                         ref={fileInputRef} 
                         className="hidden" 
                         onChange={handleFileUpload} 
                       />
                   </div>

                   <div className="mt-8">
                       <p className="text-sm font-bold text-gray-700 mb-2 text-left">Review / Paste Data (CSV format):</p>
                       <textarea 
                          className="w-full border border-gray-300 rounded-lg p-4 font-mono text-sm h-32 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={sampleTemplate}
                          value={csvText}
                          onChange={e => setCsvText(e.target.value)}
                       />
                   </div>

                   <div className="flex justify-end mt-6">
                       <button 
                          onClick={parseAndStartEnrichment}
                          disabled={!csvText}
                          className="flex items-center bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-colors"
                       >
                           Step 2: Start AI Enrichment <ChevronRight className="ml-2"/>
                       </button>
                   </div>
              </div>
          </div>
      );
  }

  if (step === 'ENRICHING' || step === 'GENERATING') {
      return (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in">
              <div className="relative">
                  <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-25"></div>
                  <div className="relative bg-white p-6 rounded-full shadow-xl">
                      <Loader2 size={48} className="text-blue-600 animate-spin" />
                  </div>
              </div>
              <div className="text-center max-w-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {step === 'ENRICHING' ? 'AI is analyzing your products...' : 'Generating Invoices...'}
                  </h3>
                  <p className="text-gray-500">
                      Processing row {Math.ceil((progress / 100) * rows.length)} of {rows.length}. Please wait while we {step === 'ENRICHING' ? 'classify HS codes and estimate weights' : 'create PDFs'}.
                  </p>
              </div>
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
          </div>
      );
  }

  if (step === 'COMPLETE') {
      const successCount = rows.filter(r => r.status !== 'ERROR').length;
      return (
          <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in space-y-8">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                   <CheckCircle size={48} />
               </div>
               <div>
                   <h2 className="text-3xl font-bold text-gray-900">Processing Complete!</h2>
                   <p className="text-gray-500 mt-2 text-lg">Successfully generated {successCount} invoices.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <button onClick={handleDownloadZip} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                       <div className="bg-blue-50 p-4 rounded-full mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <Download size={24} />
                       </div>
                       <span className="font-bold text-gray-900">Download All (ZIP)</span>
                       {!user && <span className="text-xs text-blue-600 mt-1 font-medium">Sign in required</span>}
                   </button>
                   <button onClick={handleDownloadCSV} className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition-all group">
                       <div className="bg-green-50 p-4 rounded-full mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                           <FileText size={24} />
                       </div>
                       <span className="font-bold text-gray-900">Enriched CSV</span>
                       {!user && <span className="text-xs text-green-600 mt-1 font-medium">Sign in required</span>}
                   </button>
               </div>

               <button onClick={() => setView('DASHBOARD')} className="text-gray-500 font-medium hover:text-gray-900 underline">Start New Batch</button>
          </div>
      );
  }

  // -- REVIEW SCREEN --
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in py-4">
        <div className="flex justify-between items-end mb-6 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
                <p className="text-gray-500">AI has filled in missing details. Please review entries marked with warnings.</p>
            </div>
            <div className="flex space-x-3">
                <button onClick={() => setStep('UPLOAD')} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button 
                  onClick={handleGenerate} 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center"
                >
                    <Play size={18} className="mr-2" /> Generate Invoices
                </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shrink-0 flex justify-between items-center shadow-sm">
             <div className="flex space-x-2">
                 {(['ALL', 'OK', 'WARNING', 'ERROR'] as const).map(s => (
                     <button 
                        key={s} 
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            filterStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                     >
                         {s} ({s === 'ALL' ? rows.length : rows.filter(r => r.status === s).length})
                     </button>
                 ))}
             </div>
             <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
             </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
            <table className="w-full text-sm text-left relative">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4">Order / Product</th>
                        <th className="px-6 py-4">Origin &rarr; Dest</th>
                        <th className="px-6 py-4 text-blue-600">HS Code (AI)</th>
                        <th className="px-6 py-4">Weight</th>
                        <th className="px-6 py-4">Incoterm</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredRows.map(row => (
                        <tr key={row.id} className={`hover:bg-gray-50 group transition-colors ${row.status === 'ERROR' ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4">
                                <div className="font-mono text-xs text-gray-400 mb-1">{row.original.orderId}</div>
                                <div className="font-medium text-gray-900">{row.original.description}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {row.original.origin} <span className="text-gray-300 px-1">&rarr;</span> {row.original.destination}
                            </td>
                            
                            {/* Editable HS Code */}
                            <td className="px-6 py-4">
                                {editingRowId === row.id ? (
                                    <input 
                                       autoFocus
                                       className="w-24 px-2 py-1 border border-blue-400 rounded bg-white"
                                       defaultValue={row.enriched?.hsCode}
                                       onBlur={(e) => {
                                           handleUpdateRow(row.id, 'hsCode', e.target.value);
                                           setEditingRowId(null);
                                       }}
                                    />
                                ) : (
                                    <div 
                                      className="flex items-center cursor-pointer"
                                      onClick={() => setEditingRowId(row.id)}
                                    >
                                        <span className={`font-mono px-2 py-1 rounded text-xs ${row.isUserConfirmed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                            {row.enriched?.hsCode || '---'}
                                        </span>
                                        <Edit2 size={12} className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100" />
                                    </div>
                                )}
                            </td>

                            <td className="px-6 py-4 text-gray-600">{row.enriched?.grossWeight} kg</td>
                            <td className="px-6 py-4 text-gray-600">{row.enriched?.incoterms}</td>

                            <td className="px-6 py-4">
                                {row.status === 'OK' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1.5"/> Ready</span>}
                                {row.status === 'WARNING' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1.5"/> Review</span>}
                                {row.status === 'ERROR' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1.5"/> Error</span>}
                                
                                {row.messages.length > 0 && <div className="text-xs text-red-500 mt-1">{row.messages[0]}</div>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredRows.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    No orders found matching your filters.
                </div>
            )}
        </div>
    </div>
  );
};