import React from 'react';
import { Phone, Mail, MessageCircle, HelpCircle, ChevronDown } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const faqs = [
    {
      q: "How does the AI classify HS codes?",
      a: "Our engine uses Gemini-3-Flash to analyze your product description, material, and intended use against global customs databases to find the most accurate 6-digit classification."
    },
    {
      q: "Which countries do you support?",
      a: "CustomsDoc AI supports commercial invoice generation for over 180 countries, following universal WCO standards."
    },
    {
      q: "Can I use this for Amazon FBA shipments?",
      a: "Yes, our invoices are fully compliant with Amazon's requirements for cross-border logistics and customs clearance."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h2>
        <p className="text-gray-500 text-lg">We're here to help you clear customs with confidence.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Phone Support */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
            <Phone size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Call Support</h3>
          <p className="text-gray-500 mb-6">Direct line for urgent shipping assistance and technical issues.</p>
          <div className="text-2xl font-bold text-blue-600">7349085896</div>
        </div>

        {/* Email Support */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
            <Mail size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
          <p className="text-gray-500 mb-6">Send us your detailed queries. We typically respond within 2 hours.</p>
          <a href="mailto:rahulkrinboxx@gmail.com" className="text-xl font-bold text-purple-600 hover:underline">
            rahulkrinboxx@gmail.com
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center space-x-2 mb-8">
          <HelpCircle className="text-blue-600" size={24} />
          <h3 className="text-2xl font-bold text-gray-900">Common Questions</h3>
        </div>
        
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
              <p className="text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-400 text-sm">
          © 2025 CustomsDoc AI. All rights reserved. Trade compliance made easy.
        </p>
      </div>
    </div>
  );
};