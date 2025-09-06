"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [selectedAsset] = useState<"CELO">("CELO");
  const [selectedFiat] = useState<"PLN">("PLN");
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");
  const [rampSdk, setRampSdk] = useState<RampInstantSDK | null>(null);

  // Enhanced wallet status checking with persistent monitoring
  const checkWalletStatus = useCallback(async () => {
    try {
      if (!miniKit) {
        setIsConnected(false);
        setAddress("");
        setWalletError("Wallet not available");
        return;
      }

      // @ts-expect-error - MiniKit methods may vary
      const addr = (await miniKit.getDefaultAddress?.()) || (await miniKit.getAddress?.());
      
      console.log("Checking wallet status - current address:", address, "new address:", addr, "isConnected:", isConnected);
      
      if (addr) {
        // Address exists - wallet should be connected
        if (addr !== address) {
          setAddress(addr);
          console.log("Address updated:", addr);
        }
        if (!isConnected) {
          setIsConnected(true);
          setWalletError("");
          console.log("Wallet connection status updated to connected");
        }
      } else {
        // No address - wallet should be disconnected
        if (isConnected) {
          setIsConnected(false);
          setAddress("");
          setWalletError("Wallet disconnected");
          console.log("Wallet disconnected - no address found");
        }
      }
    } catch (error) {
      console.error("Error checking wallet status:", error);
      setIsConnected(false);
      setAddress("");
      setWalletError("Failed to check wallet status");
    }
  }, [miniKit, address, isConnected]);

  // Monitor wallet status continuously
  useEffect(() => {
    // Immediate check on mount
    checkWalletStatus();
    
    // Check wallet status every 2 seconds
    const interval = setInterval(checkWalletStatus, 2000);
    
    return () => clearInterval(interval);
  }, [checkWalletStatus]);

  // Additional effect to check wallet status when miniKit becomes available
  useEffect(() => {
    if (miniKit) {
      console.log("MiniKit available, checking wallet status immediately");
      checkWalletStatus();
    }
  }, [miniKit, checkWalletStatus]);

  // Listen for wallet events
  useEffect(() => {
    if (miniKit) {
      const handleAccountsChanged = () => {
        console.log("Wallet accounts changed");
        checkWalletStatus();
      };

      const handleDisconnect = () => {
        console.log("Wallet disconnected");
        setIsConnected(false);
        setAddress("");
        setWalletError("Wallet disconnected");
      };

      // @ts-expect-error - MiniKit may have event listeners
      if (miniKit.on) {
        // @ts-expect-error - MiniKit may have event listeners
        miniKit.on('accountsChanged', handleAccountsChanged);
        // @ts-expect-error - MiniKit may have event listeners
        miniKit.on('disconnect', handleDisconnect);
      }

      return () => {
        // @ts-expect-error - MiniKit may have event listeners
        if (miniKit.off) {
          // @ts-expect-error - MiniKit may have event listeners
          miniKit.off('accountsChanged', handleAccountsChanged);
          // @ts-expect-error - MiniKit may have event listeners
          miniKit.off('disconnect', handleDisconnect);
        }
      };
    }
  }, [miniKit, checkWalletStatus]);

  // Cleanup Ramp SDK on unmount
  useEffect(() => {
    return () => {
      if (rampSdk) {
        try {
          // @ts-expect-error - destroy method may not be typed
          rampSdk.destroy?.();
        } catch (error) {
          console.error("Error destroying Ramp SDK:", error);
        }
      }
    };
  }, [rampSdk]);

  // Enhanced Ramp SDK integration with proper event handling
  const initializeRampSdk = useCallback(() => {
    try {
      // Determine environment and URL
      const isDemo = process.env.NEXT_PUBLIC_RAMP_ENVIRONMENT === 'demo';
      const rampUrl = isDemo ? "https://ri-widget-staging.netlify.app" : "https://app.ramp.network";
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sdkConfig: any = {
        url: rampUrl,
        hostAppName: "Celo Mini App",
        hostLogoUrl: `${window.location.origin}/logo.png`,
        defaultFlow: "ONRAMP",
        enabledFlows: ["ONRAMP"],
        userAddress: address || undefined,
        swapAsset: selectedAsset,
        fiatCurrency: selectedFiat,
        fiatValue: fiatAmount || undefined,
        variant: "auto",
        // Add webhook URL for status updates
        webhookStatusUrl: `${window.location.origin}/api/ramp/webhook`,
      };

      // Add API key if available (required for production)
      if (process.env.NEXT_PUBLIC_RAMP_API_KEY) {
        sdkConfig.apiKey = process.env.NEXT_PUBLIC_RAMP_API_KEY;
        sdkConfig.hostApiKey = process.env.NEXT_PUBLIC_RAMP_API_KEY;
      }

      // For demo environment, add additional configuration
      if (isDemo) {
        sdkConfig.config = {
          // Demo-specific configuration
          environment: 'demo',
        };
      }

      const sdk = new RampInstantSDK(sdkConfig);

      // Enhanced event listeners for better UX and transaction tracking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sdk.on("*", (event: any) => {
        console.log("Ramp event:", event.type, event);
        
        switch (event.type) {
          case "WIDGET_CLOSE":
            setIsLoading(false);
            break;
          case "PURCHASE_CREATED":
            console.log("Purchase created:", event.payload);
            // Add transaction to history
            if (event.payload?.purchase) {
              const newTransaction: Transaction = {
                id: event.payload.purchase.id || Date.now().toString(),
                asset: selectedAsset,
                amount: event.payload.purchase.cryptoAmount || "0",
                fiatAmount: event.payload.purchase.fiatAmount || fiatAmount,
                fiatCurrency: selectedFiat,
                status: "pending",
                timestamp: new Date(),
              };
              setTransactions(prev => [newTransaction, ...prev]);
            }
            break;
          case "PURCHASE_SUCCESSFUL":
            console.log("Purchase successful:", event.payload);
            // Update transaction status
            if (event.payload?.purchase?.id) {
              setTransactions(prev => 
                prev.map(tx => 
                  tx.id === event.payload.purchase.id 
                    ? { ...tx, status: "completed" as const }
                    : tx
                )
              );
            }
            break;
          case "PURCHASE_FAILED":
            console.log("Purchase failed:", event.payload);
            // Update transaction status
            if (event.payload?.purchase?.id) {
              setTransactions(prev => 
                prev.map(tx => 
                  tx.id === event.payload.purchase.id 
                    ? { ...tx, status: "failed" as const }
                    : tx
                )
              );
            }
            break;
          case "WIDGET_ERROR":
            console.error("Ramp widget error:", event.payload);
            setIsLoading(false);
            break;
          default:
            // Handle any other events
            console.log("Unhandled Ramp event:", event.type);
            break;
        }
      });

      return sdk;
    } catch (error) {
      console.error("Error initializing Ramp SDK:", error);
      throw error;
    }
  }, [address, selectedAsset, selectedFiat, fiatAmount]);

  const openRamp = async () => {
    if (!isConnected) {
      setWalletError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setWalletError("");
    
    try {
      console.log("Initializing Ramp SDK with config:", {
        environment: process.env.NEXT_PUBLIC_RAMP_ENVIRONMENT,
        hasApiKey: !!process.env.NEXT_PUBLIC_RAMP_API_KEY,
        address: address,
        selectedAsset: selectedAsset,
        selectedFiat: selectedFiat,
        fiatAmount: fiatAmount,
      });

      const sdk = initializeRampSdk();
      setRampSdk(sdk);
      
      console.log("Ramp SDK initialized successfully, showing widget...");
      sdk.show();
    } catch (error) {
      console.error("Error opening Ramp widget:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to open Ramp widget. ";
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage += "API key configuration issue. Please check your Ramp Network API key.";
        } else if (error.message.includes("network")) {
          errorMessage += "Network connection issue. Please check your internet connection.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please try again.";
      }
      
      setWalletError(errorMessage);
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setWalletError("");
    
    try {
      if (!miniKit) {
        throw new Error("Wallet not available");
      }

      console.log("Attempting to connect wallet...");
      
      // @ts-expect-error - MiniKit methods may vary
      await miniKit.connect?.();
      
      console.log("Wallet connect called, waiting for connection...");
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Force check wallet status after connection
      await checkWalletStatus();
      
      // Additional check after a short delay
      setTimeout(async () => {
        await checkWalletStatus();
      }, 1000);
      
      console.log("Wallet connection attempt completed");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setWalletError(error instanceof Error ? error.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Crypto Purchase</h2>
        <p className="text-green-100">Buy CELO directly on Celo network</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "buy"
              ? "text-green-600 border-b-2 border-green-600 bg-green-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Buy CELO
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "history"
              ? "text-green-600 border-b-2 border-green-600 bg-green-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          History ({transactions.length})
        </button>
      </div>

      <div className="p-6">
        {activeTab === "buy" ? (
          <>
            {/* Enhanced Wallet Connection Status */}
            <div className="mb-6">
              {isConnected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                        <p className="text-xs text-green-600 font-mono truncate">
                          {address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Live
                      </div>
                      <button
                        onClick={checkWalletStatus}
                        className="text-xs text-green-600 hover:text-green-800 underline"
                        title="Refresh wallet status"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-lg p-4 ${
                  walletError 
                    ? "bg-red-50 border border-red-200" 
                    : "bg-yellow-50 border border-yellow-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        isConnecting 
                          ? "bg-blue-500 animate-pulse" 
                          : walletError 
                            ? "bg-red-500" 
                            : "bg-yellow-500"
                      }`}></div>
                      <div>
                        <p className={`text-sm font-medium ${
                          walletError ? "text-red-800" : "text-yellow-800"
                        }`}>
                          {isConnecting 
                            ? "Connecting..." 
                            : walletError 
                              ? "Connection Error" 
                              : "Wallet not connected"
                          }
                        </p>
                        <p className={`text-xs ${
                          walletError ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {walletError || "Connect to pre-fill your address"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                        isConnecting
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : walletError
                            ? "bg-red-100 hover:bg-red-200 text-red-800"
                            : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {isConnecting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                          Connecting...
                        </div>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Buy CELO
              </label>
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-800 mb-2">CELO</div>
                <div className="text-sm text-green-600">Celo Native Token</div>
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

            {/* Enhanced Buy Button */}
            <button
              onClick={openRamp}
              disabled={isLoading || !isConnected}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all ${
                isLoading || !isConnected
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 shadow-lg"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Opening Ramp...
                </div>
              ) : !isConnected ? (
                "Connect Wallet to Buy"
              ) : (
                "Buy CELO on Celo"
              )}
            </button>
            
            {/* Error Display */}
            {walletError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{walletError}</p>
              </div>
            )}

            {/* Debug Information - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Address: {address || 'None'}</div>
                  <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                  <div>MiniKit Available: {miniKit ? 'Yes' : 'No'}</div>
                  <div>Connecting: {isConnecting ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
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
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-green-600">
                            CELO
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            CELO Purchase
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
                        {tx.amount} CELO
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
          Powered by Ramp Network • Buy CELO on Celo Network
        </p>
      </div>
    </div>
  );
}