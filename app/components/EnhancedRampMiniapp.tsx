"use client";

import { useEffect, useState } from "react";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface EnhancedRampMiniappProps {
  className?: string;
}

interface Transaction {
  id: string;
  asset: string;
  amount: string;
  fiatAmount: string;
  fiatCurrency: string;
  status: "pending" | "completed" | "failed";
  timestamp: Date;
}

export default function EnhancedRampMiniapp({ className = "" }: EnhancedRampMiniappProps) {
  const miniKit = useMiniKit();
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset] = useState<"BNB_BASE">("BNB_BASE");
  const [selectedFiat] = useState<"PLN">("PLN");
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [transactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");

  // Get wallet address from MiniKit
  useEffect(() => {
    const getWalletAddress = async () => {
      try {
        if (miniKit) {
          // @ts-expect-error - MiniKit methods may vary
          const addr = (await miniKit.getDefaultAddress?.()) || (await miniKit.getAddress?.());
          if (addr) {
            setAddress(addr);
            setIsConnected(true);
          }
        }
      } catch {
        console.log("Wallet not connected or available");
      }
    };

    getWalletAddress();
  }, [miniKit]);

  const openRamp = async () => {
    setIsLoading(true);
    
    try {
      const sdk = new RampInstantSDK({
        url: "https://app.ramp.network",
        hostAppName: "Base Mini App",
        hostLogoUrl: "/logo.png",
        defaultFlow: "ONRAMP",
        enabledFlows: ["ONRAMP"],
        userAddress: address || undefined,
        swapAsset: selectedAsset,
        fiatCurrency: selectedFiat,
        fiatValue: fiatAmount || undefined,
        variant: "auto",
        // Add your API key here if you have one
        // apiKey: process.env.NEXT_PUBLIC_RAMP_API_KEY,
      });

      // Event listeners for better UX
      sdk.on("*", (event) => {
        console.log("Ramp event:", event.type);
        
        if (event.type === "WIDGET_CLOSE") {
          setIsLoading(false);
        }
      });

      sdk.show();
    } catch (error) {
      console.error("Error opening Ramp widget:", error);
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (miniKit) {
        // @ts-expect-error - MiniKit methods may vary
        await miniKit.connect?.();
        // @ts-expect-error - MiniKit methods may vary
        const addr = (await miniKit.getDefaultAddress?.()) || (await miniKit.getAddress?.());
        if (addr) {
          setAddress(addr);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50";
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "failed": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Crypto Purchase</h2>
        <p className="text-blue-100">Buy crypto directly on Base network</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "buy"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Buy Crypto
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "history"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          History ({transactions.length})
        </button>
      </div>

      <div className="p-6">
        {activeTab === "buy" ? (
          <>
            {/* Wallet Connection Status */}
            <div className="mb-6">
              {isConnected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      <p className="text-xs text-green-600 font-mono truncate">
                        {address}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Wallet not connected</p>
                      <p className="text-xs text-yellow-600">Connect to pre-fill your address</p>
                    </div>
                    <button
                      onClick={connectWallet}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg font-medium"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Buy Binance Coin
              </label>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-800 mb-2">BNB</div>
                <div className="text-sm text-blue-600">Binance Coin</div>
              </div>
            </div>

            {/* Fiat Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pay with Polish Zloty
              </label>
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🇵🇱</div>
                <div className="text-xl font-bold text-green-800">PLN</div>
                <div className="text-sm text-green-600">Polish Zloty</div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amount (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fiatAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string, positive numbers, and decimal values
                    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                      setFiatAmount(value);
                    }
                  }}
                  placeholder="Enter amount"
                  className="w-full p-4 pr-16 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                  {selectedFiat}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Enter the amount you want to spend in PLN
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={openRamp}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-lg"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Opening Ramp...
                </div>
              ) : (
                "Buy BNB on Base"
              )}
            </button>
          </>
        ) : (
          /* Transaction History */
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400">Your purchase history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-blue-600">
                            {tx.asset.split('_')[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {tx.asset.split('_')[0]} Purchase
                          </p>
                          <p className="text-sm text-gray-500">
                            {tx.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {tx.fiatAmount} {tx.fiatCurrency}
                      </span>
                      <span className="font-medium">
                        {tx.amount} {tx.asset.split('_')[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Powered by Ramp Network • Secure & Fast
        </p>
      </div>
    </div>
  );
}