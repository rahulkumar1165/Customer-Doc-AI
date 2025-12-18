import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '../store';
import { enrichShipment, extractOrderData, validateShipment } from '../services/geminiService';
import { generateDocs } from '../utils/pdfGenerator';
import { ShipmentStatus, RiskLevel, Incoterm, ExportReason, Shipment } from '../types';
import { Loader2, Sparkles, Clipboard, CheckCircle, AlertTriangle, ArrowRight, FileText, Download, Info, ArrowLeft, AlertCircle } from 'lucide-react';

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "China", "Japan", "India", "Brazil",
  "Mexico", "Italy", "South Korea", "Spain", "Netherlands", "Switzerland", "Turkey", "Saudi Arabia", "Poland", "Sweden",
  "Belgium", "Austria", "Norway", "Ireland", "Denmark", "Singapore", "Malaysia", "Thailand", "Vietnam", "Indonesia",
  "New Zealand", "South Africa", "United Arab Emirates", "Argentina", "Chile", "Colombia", "Egypt", "Israel", "Pakistan",
  "Portugal", "Greece", "Finland", "Czech Republic", "Hungary", "Romania", "Philippines"
].sort();

// Full Schema for the Detailed View
const fullSchema = z.object({
  consigneeName: z.string().min(1, "Consignee Name is required"),
  consigneeAddress: z.string().min(5, "Address is required"),
  consigneeTaxId: z.string().optional(),
  originCountry: z.string().min(1),
  destinationCountry: z.string().min(1, "Destination is required"),
  incoterms: z.nativeEnum(Incoterm),
  reasonForExport: z.nativeEnum(ExportReason),
  grossWeight: z.number().min(0.01),
  netWeight: z.number().min(0.01),
  packageCount: z.number().int().min(1),
  productDescription: z.string().min(3),
  material: z.string().min(2),
  intendedUse: z.string().min(2),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0.01),
  currency: z.string().default('USD'),
  hsCode: z.string().optional()
});

type FormData = z.infer<typeof fullSchema>;

export const NewShipmentForm: React.FC = () => {
  const { addShipment, addToCatalog, user, setView, catalog, setLoginModalOpen } = useStore();
  const [mode, setMode] = useState<'SMART' | 'PASTE' | 'DETAILED'>('SMART');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);
  const [rawOrderText, setRawOrderText] = useState('');
  
  // Weight Unit State
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState({
      description: '',
      totalValue: 0,
      quantity: 1,
      destination: '',
      dutiesPaidBy: 'Buyer' as 'Seller' | 'Buyer'
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
        originCountry: user?.defaultOrigin || 'USA',
        currency: 'USD',
        packageCount: 1,
        incoterms: Incoterm.DAP,
        reasonForExport: ExportReason.SALE
    }
  });

  // Regenerate PDF if user logs in to ensure company details are correct
  useEffect(() => {
    if (user && createdShipment) {
      const url = generateDocs(createdShipment, user);
      setPdfUrl(url);
    }
  }, [user, createdShipment]);

  // -- ACTIONS --

  const handleSmartEnrich = async () => {
      if (!smartInput.description || !smartInput.destination) return;
      setIsProcessing(true);
      try {
          // Check catalog first for matches
          const knownProduct = catalog.find(c => c.description.toLowerCase().includes(smartInput.description.toLowerCase()));
          
          const enriched = await enrichShipment(
              smartInput.description,
              smartInput.quantity,
              smartInput.totalValue,
              user?.defaultOrigin || 'USA',
              smartInput.destination,
              smartInput.dutiesPaidBy
          );

          // Populate form with intelligent defaults for missing fields to ensure validity
          setValue('productDescription', smartInput.description);
          setValue('quantity', smartInput.quantity);
          setValue('unitPrice', enriched.unitPrice);
          setValue('destinationCountry', smartInput.destination);
          setValue('grossWeight', enriched.grossWeight);
          setValue('netWeight', enriched.netWeight);
          setValue('incoterms', enriched.incoterms as Incoterm);
          setValue('hsCode', knownProduct ? knownProduct.hsCode : enriched.hsCode);
          setValue('material', knownProduct ? knownProduct.material : enriched.material);
          setValue('intendedUse', knownProduct ? knownProduct.intendedUse : enriched.intendedUse);
          setValue('reasonForExport', enriched.reasonForExport as ExportReason);
          
          // Pre-fill Consignee if not set, to make "Generate" immediately clickable for demos
          setValue('consigneeName', 'Valued Customer');
          setValue('consigneeAddress', `123 Import Avenue, ${smartInput.destination}`);

          setMode('DETAILED');
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const handlePasteExtract = async () => {
      if (!rawOrderText) return;
      setIsProcessing(true);
      try {
          const data = await extractOrderData(rawOrderText);
          if (data) {
             setValue('consigneeName', data.consigneeName || 'Valued Customer');
             setValue('consigneeAddress', data.consigneeAddress || '123 Import Avenue');
             setValue('productDescription', data.productDescription || '');
             setValue('quantity', data.quantity || 1);
             setValue('destinationCountry', data.destinationCountry || '');
             if (data.totalValue && data.quantity) {
                 setValue('unitPrice', data.totalValue / data.quantity);
             }
             
             // Run enrichment
             const enriched = await enrichShipment(
                 data.productDescription,
                 data.quantity || 1,
                 data.totalValue || 100,
                 user?.defaultOrigin || 'USA',
                 data.destinationCountry || 'USA',
                 'Buyer'
             );
             
             setValue('grossWeight', enriched.grossWeight);
             setValue('netWeight', enriched.netWeight);
             setValue('hsCode', enriched.hsCode);
             setValue('material', enriched.material);
             setValue('intendedUse', enriched.intendedUse);
             
             setMode('DETAILED');
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const onValidateAndSubmit = async (data: FormData) => {
      setIsProcessing(true);
      setValidationWarnings([]);
      
      try {
          // Handle weight conversion if user selected lbs
          let finalData = { ...data };
          if (weightUnit === 'lb') {
              finalData.grossWeight = Number((data.grossWeight * 0.453592).toFixed(3));
              finalData.netWeight = Number((data.netWeight * 0.453592).toFixed(3));
          }

          const validation = await validateShipment(finalData);
          
          if (!validation.valid && validation.warnings && validation.warnings.length > 0) {
              setValidationWarnings(validation.warnings);
          }

          // Use dummy user for preview generation if not logged in
          const dummyUser = user || {
             id: 'temp', email: '', companyName: 'Your Company Name', address: 'Your Address', defaultOrigin: 'USA', subscriptionTier: 'FREE', shipmentsCount: 0
          };

          const newShipment = {
             id: `shp_${Date.now()}`,
             userId: user?.id || 'temp',
             ...finalData,
             status: ShipmentStatus.SUCCESS,
             createdAt: new Date().toISOString(),
             docsGenerated: true,
             validationWarnings: validation.warnings
         };

         setCreatedShipment(newShipment);
         
         // Always add to store so it persists if they log in
         addShipment(newShipment);
         
         if (user) {
             addToCatalog({
                 description: finalData.productDescription,
                 hsCode: finalData.hsCode || '',
                 material: finalData.material,
                 intendedUse: finalData.intendedUse
             });
         }

         const url = generateDocs(newShipment, dummyUser);
         setPdfUrl(url);

      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
      if (!user) {
          e.preventDefault();
          setLoginModalOpen(true);
      }
  };

  if (pdfUrl) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invoice Generated!</h2>
            <p className="text-gray-500 text-lg">Your commercial invoice is ready.</p>
            
            {validationWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left text-sm text-yellow-800 w-full mt-4">
                    <p className="font-bold flex items-center mb-2"><AlertTriangle size={16} className="mr-2"/> Warnings flagged during generation:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            <div className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                         <div className="bg-red-100 p-2 rounded-lg text-red-600">
                             <FileText size={24} />
                         </div>
                         <div className="text-left">
                             <p className="font-bold text-gray-900">commercial_invoice.pdf</p>
                             <p className="text-xs text-gray-500">PDF Document • Ready to print</p>
                         </div>
                    </div>
                </div>
                <a 
                  href={user ? pdfUrl : '#'} 
                  onClick={handleDownloadClick}
                  download="commercial_invoice.pdf"
                  className="flex items-center justify-center w-full space-x-2 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold cursor-pointer"
                >
                    <Download size={20} />
                    <span>Download Invoice</span>
                </a>
                {!user && (
                    <p className="text-xs text-blue-600 mt-3 font-medium cursor-pointer hover:underline text-center" onClick={() => setLoginModalOpen(true)}>
                        Sign in to save this shipment to your dashboard.
                    </p>
                )}
            </div>

            <button 
                onClick={() => { setPdfUrl(null); setMode('SMART'); }}
                className="text-gray-500 hover:text-gray-900 underline mt-2"
            >
                Create Another
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={() => setView('DASHBOARD')} className="mr-4 text-gray-400 hover:text-gray-600 md:hidden"><ArrowLeft/></button>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
                <p className="text-gray-500">Auto-fill customs data using AI.</p>
            </div>
        </div>
        {mode === 'DETAILED' && (
            <button onClick={() => setMode('SMART')} className="text-sm text-blue-600 font-medium hover:underline">
                Start Over
            </button>
        )}
      </div>

      {/* TABS */}
      {mode !== 'DETAILED' && (
          <div className="flex space-x-4 mb-6">
              <button 
                onClick={() => setMode('SMART')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'SMART' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100'}`}
              >
                  <Sparkles size={18} className="mr-2" /> Smart Entry
              </button>
              <button 
                onClick={() => setMode('PASTE')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'PASTE' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100'}`}
              >
                  <Clipboard size={18} className="mr-2" /> Paste Order
              </button>
          </div>
      )}

      {/* MODE: SMART ENTRY */}
      {mode === 'SMART' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-left-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="e.g. 50 Ceramic Mugs"
                        value={smartInput.description}
                        onChange={(e) => setSmartInput({...smartInput, description: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Value (USD)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={smartInput.totalValue || ''}
                        onChange={(e) => setSmartInput({...smartInput, totalValue: parseFloat(e.target.value)})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={smartInput.quantity}
                        onChange={(e) => setSmartInput({...smartInput, quantity: parseFloat(e.target.value)})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                      <input 
                        list="countries-list-smart"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Select or type country"
                        value={smartInput.destination}
                        onChange={(e) => setSmartInput({...smartInput, destination: e.target.value})}
                      />
                      <datalist id="countries-list-smart">
                          {COUNTRIES.map(c => <option key={c} value={c} />)}
                      </datalist>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Who pays duties?</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${smartInput.dutiesPaidBy === 'Buyer' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setSmartInput({...smartInput, dutiesPaidBy: 'Buyer'})}
                          >
                              Buyer (DAP)
                          </button>
                          <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${smartInput.dutiesPaidBy === 'Seller' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setSmartInput({...smartInput, dutiesPaidBy: 'Seller'})}
                          >
                              Seller (DDP)
                          </button>
                      </div>
                  </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                   <button 
                      onClick={handleSmartEnrich}
                      disabled={isProcessing || !smartInput.description}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center disabled:opacity-50"
                   >
                       {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                       Auto-Fill Customs Data
                   </button>
              </div>
          </div>
      )}

      {/* MODE: PASTE */}
      {mode === 'PASTE' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-right-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">Paste Order JSON or Text</label>
               <textarea 
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder={`Order #1234\nShip to: John Doe, 123 Main St, London\nItems: 5x Blue Shirt ($20)`}
                  value={rawOrderText}
                  onChange={(e) => setRawOrderText(e.target.value)}
               />
               <div className="mt-6 flex justify-end">
                   <button 
                      onClick={handlePasteExtract}
                      disabled={isProcessing || !rawOrderText}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center disabled:opacity-50"
                   >
                       {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <ArrowRight className="mr-2"/>}
                       Extract & Enrich
                   </button>
               </div>
          </div>
      )}

      {/* MODE: DETAILED REVIEW */}
      {mode === 'DETAILED' && (
          <form onSubmit={handleSubmit(onValidateAndSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
               
               {/* Validation Alert Zone */}
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start">
                   <Info className="text-blue-600 mt-1 mr-3 shrink-0" />
                   <div>
                       <h4 className="font-bold text-blue-900">AI Enrichment Complete</h4>
                       <p className="text-sm text-blue-700 mt-1">Please review the auto-filled fields below. Weights are estimated based on quantity.</p>
                   </div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Consignee & Logistics</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Consignee Name</label>
                            <input 
                              {...register('consigneeName')} 
                              className={`w-full px-3 py-2 border rounded-lg ${errors.consigneeName ? 'border-red-300 bg-red-50' : ''}`} 
                              placeholder="Full Name" 
                            />
                            {errors.consigneeName && <p className="text-red-500 text-xs mt-1">{errors.consigneeName.message}</p>}
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                            <input 
                                {...register('consigneeAddress')} 
                                className={`w-full px-3 py-2 border rounded-lg ${errors.consigneeAddress ? 'border-red-300 bg-red-50' : ''}`} 
                                placeholder="Address" 
                            />
                            {errors.consigneeAddress && <p className="text-red-500 text-xs mt-1">{errors.consigneeAddress.message}</p>}
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                            <input 
                                list="countries-list-detailed" 
                                {...register('destinationCountry')} 
                                className={`w-full px-3 py-2 border rounded-lg ${errors.destinationCountry ? 'border-red-300 bg-red-50' : ''}`}
                                placeholder="Search country..."
                            />
                            <datalist id="countries-list-detailed">
                                {COUNTRIES.map(c => <option key={c} value={c} />)}
                            </datalist>
                            {errors.destinationCountry && <p className="text-red-500 text-xs mt-1">{errors.destinationCountry.message}</p>}
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Incoterms</label>
                            <select {...register('incoterms')} className="w-full px-3 py-2 border rounded-lg bg-white">
                                {Object.values(Incoterm).map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                         </div>
                    </div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Product & Customs</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                         <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Description</label>
                            <input {...register('productDescription')} className="w-full px-3 py-2 border rounded-lg" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material</label>
                            <input {...register('material')} className="w-full px-3 py-2 border rounded-lg" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Intended Use</label>
                            <input {...register('intendedUse')} className="w-full px-3 py-2 border rounded-lg" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">HS Code</label>
                            <div className="relative">
                                <input {...register('hsCode')} className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-blue-800 font-mono" />
                                <Sparkles size={14} className="absolute right-2 top-3 text-blue-400" />
                            </div>
                         </div>
                    </div>
                    
                    {/* Updated Layout for Quantity, Unit Price, and Weight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qty</label>
                            <input type="number" {...register('quantity', {valueAsNumber: true})} className="w-full px-3 py-2 border rounded-lg" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Price</label>
                            <input type="number" step="0.01" {...register('unitPrice', {valueAsNumber: true})} className="w-full px-3 py-2 border rounded-lg" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Weight</label>
                            <div className="flex">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    {...register('grossWeight', {valueAsNumber: true})} 
                                    className="flex-1 px-3 py-2 border rounded-l-lg border-r-0 focus:ring-0 outline-none" 
                                />
                                <select 
                                    value={weightUnit} 
                                    onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
                                    className="w-20 px-2 py-2 border rounded-r-lg bg-gray-50 text-gray-600 font-medium outline-none focus:ring-0"
                                >
                                    <option value="kg">kg</option>
                                    <option value="lb">lb</option>
                                </select>
                            </div>
                         </div>
                    </div>
               </div>

               {Object.keys(errors).length > 0 && (
                   <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center text-sm">
                       <AlertCircle size={16} className="mr-2" />
                       Please fill in all required fields (marked in red).
                   </div>
               )}

               <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center disabled:opacity-70"
                >
                  {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <FileText className="mr-2"/>}
                  Generate Invoice
               </button>
          </form>
      )}
    </div>
  );
};