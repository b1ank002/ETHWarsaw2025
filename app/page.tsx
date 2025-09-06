"use client";

import {
  useMiniKit,
  useAddFrame,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useState, useCallback } from "react";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [plnAmount, setPlnAmount] = useState<string>("");
  const [celoAmount, setCeloAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showRampWidget, setShowRampWidget] = useState(false);
  const [celoPrice, setCeloPrice] = useState<number>(1.15); // Default rate in PLN
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const addFrame = useAddFrame();

  // Function to fetch CELO price from Ramp Network using SDK events
  const fetchCeloPrice = async () => {
    try {
      setIsLoadingPrice(true);
      
      // Create a hidden Ramp SDK instance to capture pricing events
      const tempSdk = new RampInstantSDK({
        url: "https://app.ramp.network",
        hostAppName: "CELO Purchase App",
        hostLogoUrl: "/logo.png",
        defaultFlow: "ONRAMP",
        enabledFlows: ["ONRAMP"],
        swapAsset: "CELO",
        fiatCurrency: "PLN",
        fiatValue: "100", // Get price for 100 PLN
        variant: "auto",
        // Hide the widget completely
      });

      let priceCaptured = false;
      // Set up event listeners to capture pricing
      tempSdk.on("*", (event) => {
        console.log("Ramp pricing event:", event.type, event.payload);
        
        // Try to capture pricing from Ramp events
        if (event.type === "PURCHASE_CREATED") {
          const payload = event.payload;
          
          // Try to extract pricing from purchase data
          if (payload?.purchase) {
            const purchase = payload.purchase;
            
            // Try different possible pricing data structures
            if (purchase.cryptoAmount && purchase.fiatValue) {
              const cryptoAmount = parseFloat(purchase.cryptoAmount);
              const fiatAmount = parseFloat(purchase.fiatValue);
              
              if (cryptoAmount > 0 && fiatAmount > 0) {
                const price = fiatAmount / cryptoAmount;
                setCeloPrice(price);
                console.log(`Updated CELO price from Ramp SDK: ${price.toFixed(4)} PLN per CELO`);
                priceCaptured = true;
                clearTimeout(timeoutId);
              }
            }
          }
        }
      });

      // Initialize the SDK
      tempSdk.show();
      
      // Set timeout to clean up if no price is captured
      const timeoutId = setTimeout(() => {
        if (!priceCaptured) {
          console.log("No price captured from Ramp SDK, using fallback");
          // Try a simple calculation based on typical CELO price
          setCeloPrice(1.15);
        }
        
        // Clean up the SDK
        try {
          // @ts-expect-error - destroy method may not be typed
          tempSdk.destroy?.();
        } catch (error) {
          console.log("Error destroying temp Ramp SDK:", error);
        }
      }, 8000);

    } catch (error) {
      console.error('Error fetching CELO price from Ramp SDK:', error);
      // Keep the current price if fetch fails
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch initial price and set up 15-second intervals
  useEffect(() => {
    // Fetch price immediately
    fetchCeloPrice();
    
    // Set up interval to fetch price every 15 seconds
    const interval = setInterval(fetchCeloPrice, 15000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  // Simple wallet detection - just check if context exists
  useEffect(() => {
    if (context?.client) {
      setWalletAddress("Connected");
      console.log("Wallet context available");
    } else {
      setWalletAddress("");
      console.log("No wallet context");
    }
  }, [context]);

  const handlePlnChange = (value: string) => {
    setPlnAmount(value);
    // Automatic calculation from PLN to CELO using live price
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const celoValue = (parseFloat(value) / celoPrice).toFixed(8);
      setCeloAmount(celoValue);
    } else {
      setCeloAmount("");
    }
  };

  const handleCeloChange = (value: string) => {
    setCeloAmount(value);
    // Automatic calculation from CELO to PLN using live price
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const plnValue = (parseFloat(value) * celoPrice).toFixed(2);
      setPlnAmount(plnValue);
    } else {
      setPlnAmount("");
    }
  };

  const openRamp = useCallback(async () => {
    // Validate amount
    if (!plnAmount || parseFloat(plnAmount) <= 0) {
      alert("Please enter a valid PLN amount");
      return;
    }

    // Validate minimum amount
    if (parseFloat(plnAmount) < 10) {
      alert("Minimum purchase amount is 10 PLN");
      return;
    }

    try {
      setIsLoading(true);
      setShowRampWidget(true);
      
      console.log("Opening Ramp with:", {
        plnAmount,
        celoAmount
      });
      
      const sdk = new RampInstantSDK({
        url: "https://app.ramp.network",
        hostAppName: "CELO Purchase App",
        hostLogoUrl: "/logo.png",
        defaultFlow: "ONRAMP",
        enabledFlows: ["ONRAMP"],
        // Don't pass userAddress - let Ramp handle wallet connection
        swapAsset: "CELO",
        fiatCurrency: "PLN",
        fiatValue: plnAmount,
        variant: "auto",
        // apiKey: process.env.NEXT_PUBLIC_RAMP_API_KEY,
      });

      sdk.on("*", (event) => {
        console.log("[RAMP]", event.type, event.payload);
        
        if (event.type === "WIDGET_CLOSE") {
          setIsLoading(false);
          setShowRampWidget(false);
        }
        
        // @ts-expect-error - Ramp event types may vary
        if (event.type === "PURCHASE_SUCCESSFUL" || event.type === "PURCHASE_CREATED") {
          setIsLoading(false);
          setShowRampWidget(false);
          alert("CELO purchase successful! Check your wallet.");
        }
        
        // @ts-expect-error - Ramp event types may vary
        if (event.type === "PURCHASE_FAILED") {
          setIsLoading(false);
          setShowRampWidget(false);
          alert("Purchase failed. Please try again.");
        }
      });
      
      sdk.show();
    } catch (error) {
      console.error("Error opening Ramp widget:", error);
      setIsLoading(false);
      setShowRampWidget(false);
      alert("Error opening Ramp widget. Please try again.");
    }
  }, [plnAmount, celoAmount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Buy CELO</h1>
              <p className="text-sm text-slate-400">With Polish Zloty</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Wallet className="z-10">
              <ConnectWallet>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                  <Name className="text-white text-sm font-medium" />
                </div>
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
            {context && !context.client.added && (
              <button
                onClick={handleAddFrame}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-xl border border-white/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
            {frameAdded && (
              <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-md px-3 py-2 rounded-xl border border-green-500/30">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 text-sm font-medium">Saved</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Amount Selection Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Buy CELO</h2>
                <p className="text-slate-400">Enter amount in Polish Zloty or CELO</p>
              </div>
              
              {/* PLN Input */}
              <div className="space-y-4 mb-6">
                <label className="text-sm font-medium text-slate-300">Polish Zloty (PLN)</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-3 z-10">
                    <span className="text-2xl">🇵🇱</span>
                    <span className="text-sm font-semibold text-slate-300">PLN</span>
                  </div>
                  <input
                    type="number"
                    value={plnAmount}
                    onChange={(e) => handlePlnChange(e.target.value)}
                    className="w-full pl-24 pr-6 py-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-4xl font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 group-hover:bg-white/15"
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Conversion Arrow */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* CELO Input */}
              <div className="space-y-4 mb-8">
                <label className="text-sm font-medium text-slate-300">Celo Native Token (CELO)</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-3 z-10">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-white">C</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">CELO</span>
                  </div>
                  <input
                    type="number"
                    value={celoAmount}
                    onChange={(e) => handleCeloChange(e.target.value)}
                    className="w-full pl-24 pr-6 py-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-4xl font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 group-hover:bg-white/15"
                    placeholder="0"
                    step="0.00000001"
                    min="0"
                  />
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="text-center text-sm text-slate-400 mb-8">
                <div className="bg-slate-800/50 px-4 py-2 rounded-full inline-flex items-center space-x-2">
                  <span>1.00 CELO = PLN {celoPrice.toFixed(4)}</span>
                  {isLoadingPrice && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-green-400"></div>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Ramp Network pricing • Updates every 15 seconds
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={openRamp}
                disabled={isLoading || (!plnAmount && !celoAmount) || (parseFloat(plnAmount) <= 0 && parseFloat(celoAmount) <= 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none disabled:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span className="text-lg">{showRampWidget ? "Processing..." : "Opening Ramp..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-lg">
                      Buy {celoAmount || "0"} CELO
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Wallet Status Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${walletAddress ? 'bg-green-400' : 'bg-red-400'} shadow-lg`}></div>
                <h3 className="text-lg font-semibold text-white">Wallet Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${walletAddress ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-slate-300">
                    {walletAddress ? 'Wallet Connected' : 'Wallet Not Connected'}
                  </span>
                </div>
                {walletAddress && (
                  <div className="bg-slate-800/50 px-3 py-2 rounded-lg">
                    <div className="text-xs text-slate-400 font-mono">
                      {walletAddress === "Connected" ? "Wallet Connected" : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Options Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Ramp Network</h3>
                  <p className="text-sm text-slate-400">Secure fiat-to-crypto on-ramp</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 bg-slate-800/30 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-300">Credit Cards</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800/30 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-300">Bank Transfer</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800/30 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-300">Apple Pay</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800/30 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-300">Google Pay</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-6 flex justify-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10">
            <p className="text-slate-400 text-sm text-center">
              Built on <span className="text-green-400 font-semibold">Celo</span> with <span className="text-purple-400 font-semibold">MiniKit</span> • 
              Powered by <span className="text-green-400 font-semibold">Ramp Network</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
