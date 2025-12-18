import React from 'react';
import { useStore } from '../store';
import { CreditCard, Shield, Globe, HardDrive } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

       <div className="grid md:grid-cols-3 gap-6">
           {/* Profile Card */}
           <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <div className="flex items-center space-x-4 mb-6">
                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                       {user?.companyName.charAt(0)}
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-gray-900">{user?.companyName}</h3>
                       <p className="text-gray-500">{user?.email}</p>
                   </div>
               </div>
               
               <form className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                           <input type="text" defaultValue={user?.companyName} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Default Origin</label>
                           <input type="text" defaultValue={user?.defaultOrigin} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Full Business Address</label>
                       <textarea rows={2} defaultValue={user?.address} placeholder="Street, City, State, ZIP, Country" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / VAT / EORI</label>
                       <input type="text" defaultValue={user?.taxId} placeholder="e.g. GB123456789" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                   </div>

                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key (Optional)</label>
                        <div className="flex space-x-2">
                             <input type="password" placeholder="sk-..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                             <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Update</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">If not provided, the app uses a mocked AI response for demo purposes.</p>
                   </div>
               </form>
           </div>

           {/* Subscription Card */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
               <div className="flex items-center space-x-2 mb-4 text-purple-600">
                   <Shield size={24} />
                   <h3 className="font-bold text-lg">Subscription</h3>
               </div>
               <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                   <p className="text-xs uppercase tracking-wide text-purple-600 font-bold mb-1">Current Plan</p>
                   <p className="text-2xl font-bold text-gray-900">Freemium</p>
                   <p className="text-sm text-gray-500 mt-1">3 / 5 Free Shipments used</p>
                   <div className="w-full bg-purple-200 h-2 rounded-full mt-2 overflow-hidden">
                       <div className="bg-purple-600 h-full w-3/5"></div>
                   </div>
               </div>
               <button className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center space-x-2">
                   <CreditCard size={18} />
                   <span>Upgrade to Pro ($29/mo)</span>
               </button>
           </div>
       </div>

       {/* Danger Zone */}
       <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
           <h3 className="font-bold text-red-600 mb-2">Danger Zone</h3>
           <div className="flex items-center justify-between">
               <p className="text-sm text-gray-500">Permanently delete your account and all shipment history.</p>
               <button className="text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium">Delete Account</button>
           </div>
       </div>
    </div>
  );
};
