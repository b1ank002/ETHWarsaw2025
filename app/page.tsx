"use client";

import { useState } from "react";
import RampMiniapp from "./components/RampMiniapp";
import EnhancedRampMiniapp from "./components/EnhancedRampMiniapp";

export default function BuyPage() {
  const [useEnhanced, setUseEnhanced] = useState(true);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BNB Purchase
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Buy BNB with Polish Zloty on Base network
          </p>
          
          {/* Toggle between versions */}
          <div className="flex items-center justify-center mb-6">
            <span className={`text-sm mr-3 ${!useEnhanced ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Basic
            </span>
            <button
              onClick={() => setUseEnhanced(!useEnhanced)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useEnhanced ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useEnhanced ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ml-3 ${useEnhanced ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Enhanced
            </span>
          </div>
        </div>
        
        {useEnhanced ? <EnhancedRampMiniapp /> : <RampMiniapp />}
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Buy BNB with PLN • Powered by Ramp Network
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
            <span>• Secure</span>
            <span>• Fast</span>
            <span>• Easy</span>
          </div>
        </div>
      </div>
    </main>
  );
}
