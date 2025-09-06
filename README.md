# Base Mini App with Ramp Network

A clean, modern Next.js miniapp that integrates with Ramp Network to allow users to buy crypto directly on the Base network.

## Features

- 🚀 **Ramp Network Integration** - Buy USDC and ETH directly with fiat
- 💳 **Multiple Payment Methods** - Support for USD, EUR, GBP
- 🔗 **MiniKit Wallet Connection** - Seamless wallet integration
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Clean, beautiful interface with Tailwind CSS
- 📊 **Transaction History** - Track your purchases (Enhanced version)

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [MiniKit](https://docs.base.org/builderkits/minikit/overview) - Base wallet integration
- [OnchainKit](https://www.base.org/builders/onchainkit) - Web3 components
- [Ramp Network](https://ramp.network) - Crypto on-ramp
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TypeScript](https://www.typescriptlang.org) - Type safety

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
   NEXT_PUBLIC_RAMP_API_KEY=your_ramp_api_key
   NEXT_PUBLIC_URL=http://localhost:3000
   NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Base Mini App
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Connect Wallet** - The app will attempt to connect to your wallet via MiniKit
2. **Select Asset** - Choose between USDC or ETH on Base network
3. **Choose Currency** - Select your preferred fiat currency
4. **Enter Amount** - Optionally specify the amount you want to buy
5. **Buy Crypto** - Click the buy button to open the Ramp Network widget

## Project Structure

```
app/
├── components/
│   ├── RampMiniapp.tsx          # Basic miniapp component
│   └── EnhancedRampMiniapp.tsx  # Enhanced miniapp with history
├── page.tsx                     # Main page with toggle
├── layout.tsx                   # App layout
└── providers.tsx                # MiniKit and OnchainKit providers
```

## Configuration

### Ramp Network
- Get your API key from [Ramp Dashboard](https://dashboard.ramp.network/)
- Add it to your environment variables
- The app is configured for Base network (USDC_BASE, ETH_BASE)

### MiniKit
- Configure your OnchainKit API key
- The app uses Base network by default
- Wallet connection is handled automatically

## Learn More

- [Ramp Network Documentation](https://docs.ramp.network/)
- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builders/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)