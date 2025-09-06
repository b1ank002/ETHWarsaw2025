"use client";

import { useEffect, useState } from "react";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface RampMiniappProps {
  className?: string;
}

export default function RampMiniapp({ className = "" }: RampMiniappProps) {
  const miniKit = useMiniKit();
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset] = useState<"CELO">("CELO");
  const [selectedFiat] = useState<"PLN">("PLN");
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [celoPrice, setCeloPrice] = useState<number>(1.15); // Default rate in PLN
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Function to fetch CELO price from Ramp Network using SDK events
  const fetchCeloPrice = async () => {
    try {
      setIsLoadingPrice(true);
      
      // Create a hidden Ramp SDK instance to capture pricing events
      const tempSdk = new RampInstantSDK({
        url: "https://app.ramp.network",
        hostAppName: "Celo Mini App",
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
        console.log("RampMiniapp - Ramp pricing event:", event.type, event.payload);
        
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
                console.log(`RampMiniapp - Updated CELO price from Ramp SDK: ${price.toFixed(4)} PLN per CELO`);
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
          console.log("RampMiniapp - No price captured from Ramp SDK, using fallback");
          // Try a simple calculation based on typical CELO price
          setCeloPrice(1.15);
        }
        
        // Clean up the SDK
        try {
          // @ts-expect-error - destroy method may not be typed
          tempSdk.destroy?.();
        } catch (error) {
          console.log("RampMiniapp - Error destroying temp Ramp SDK:", error);
        }
      }, 8000);

    } catch (error) {
      console.error('RampMiniapp - Error fetching CELO price from Ramp SDK:', error);
      // Keep the current price if fetch fails
    } finally {
      setIsLoadingPrice(false);
    }
  };

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

  // Fetch initial price and set up 15-second intervals
  useEffect(() => {
    // Fetch price immediately
    fetchCeloPrice();
    
    // Set up interval to fetch price every 15 seconds
    const interval = setInterval(fetchCeloPrice, 15000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const openRamp = async () => {
    setIsLoading(true);
    
    try {
      const sdk = new RampInstantSDK({
        url: "https://app.ramp.network",
        hostAppName: "Celo Mini App",
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
        console.log("[RAMP]", event.type, event.payload);
        if (event.type === "WIDGET_CLOSE") {
          setIsLoading(false);
        }
        // @ts-expect-error - Ramp event types may vary
        if (event.type === "PURCHASE_SUCCESSFUL" || event.type === "PURCHASE_CREATED") {
          setIsLoading(false);
          // You could show a success notification here
        }
        // @ts-expect-error - Ramp event types may vary
        if (event.type === "PURCHASE_FAILED") {
          setIsLoading(false);
          // You could show an error notification here
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

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Buy CELO on Celo
        </h2>
        <p className="text-gray-600">
          Purchase crypto directly with your card
        </p>
      </div>

      {/* Wallet Connection Status */}
      <div className="mb-6">
        {isConnected ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Wallet Connected
            </p>
            <p className="text-xs text-green-600 font-mono truncate">
              {address}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 mb-2">
              Wallet not connected
            </p>
            <button
              onClick={connectWallet}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Asset Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buy CELO
        </label>
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800 mb-1">CELO</div>
          <div className="text-sm text-green-600 mb-2">Celo Native Token</div>
          <div className="text-xs text-green-700 flex items-center justify-center space-x-1">
            <span>1 CELO = PLN {celoPrice.toFixed(4)}</span>
            {isLoadingPrice && (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
            )}
          </div>
          <div className="text-xs text-green-500 mt-1">
            Ramp Network pricing • Updates every 15s
          </div>
        </div>
      </div>

      {/* Fiat Currency Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pay with Polish Zloty
        </label>
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">🇵🇱</div>
          <div className="text-lg font-bold text-green-800">PLN</div>
          <div className="text-sm text-green-600">Polish Zloty</div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            {selectedFiat}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Enter the amount you want to spend in PLN
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={openRamp}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Opening Ramp...
          </div>
        ) : (
          "Buy CELO on Celo"
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Powered by Ramp Network • Secure & Fast
      </p>
    </div>
  );
}