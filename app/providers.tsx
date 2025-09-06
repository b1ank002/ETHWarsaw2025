"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiConfig, createConfig, http } from "wagmi";
import { base } from "viem/chains";

const wagmi = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmi}>
      <OnchainKitProvider 
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!}
        chain={base}
      >
        <MiniKitProvider>
          {children}
        </MiniKitProvider>
      </OnchainKitProvider>
    </WagmiConfig>
  );
}
