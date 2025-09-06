# Base Mini App with Ramp Network Integration

This is a Next.js miniapp that integrates with Ramp Network to allow users to buy crypto directly on the Base network.

## Features

### Basic Version (`RampMiniapp.tsx`)
- Simple crypto purchase interface
- Wallet connection via MiniKit
- Asset selection (USDC, ETH)
- Fiat currency selection (USD, EUR, GBP)
- Optional amount input
- Direct Ramp Network widget integration

### Enhanced Version (`EnhancedRampMiniapp.tsx`)
- All basic features plus:
- Transaction history tracking
- Tabbed interface (Buy/History)
- Better UI/UX with gradients and animations
- Real-time transaction status updates
- Enhanced wallet connection status
- Better error handling and loading states

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `env.example` to `.env.local`
   - Get your Ramp Network API key from [Ramp Dashboard](https://dashboard.ramp.network/)
   - Add your API key to `NEXT_PUBLIC_RAMP_API_KEY`

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Usage

1. **Connect Wallet:** The app will attempt to connect to your wallet via MiniKit
2. **Select Asset:** Choose between USDC or ETH on Base network
3. **Choose Currency:** Select your preferred fiat currency
4. **Enter Amount:** Optionally specify the amount you want to buy
5. **Buy Crypto:** Click the buy button to open the Ramp Network widget

## Ramp Network Configuration

The app is configured to use Ramp Network's production environment. Key settings:

- **URL:** `https://app.ramp.network`
- **Flow:** ONRAMP only (buying crypto with fiat)
- **Assets:** USDC_BASE, ETH_BASE
- **Variant:** Auto (modal or new tab based on device)

## Customization

### Adding New Assets
To add support for new crypto assets, update the `selectedAsset` state type and options in both components.

### Styling
The app uses Tailwind CSS for styling. You can customize the appearance by modifying the className props.

### API Integration
To use your Ramp Network API key, uncomment the `apiKey` line in the SDK configuration and add your key to the environment variables.

## File Structure

```
app/
├── components/
│   ├── RampMiniapp.tsx          # Basic miniapp component
│   └── EnhancedRampMiniapp.tsx  # Enhanced miniapp with history
├── page.tsx                     # Main page with toggle
└── layout.tsx                   # App layout
```

## Dependencies

- `@ramp-network/ramp-instant-sdk` - Ramp Network integration
- `@coinbase/onchainkit` - MiniKit for wallet connection
- `next` - React framework
- `react` - UI library
- `tailwindcss` - Styling

## Testing

The app works in both development and production environments. For testing:

1. Use the staging Ramp URL: `https://ri-widget-staging.firebaseapp.com`
2. Test with small amounts first
3. Check browser console for Ramp events and errors

## Support

For issues with:
- Ramp Network: Check [Ramp Documentation](https://docs.ramp.network/)
- MiniKit: Check [OnchainKit Documentation](https://onchainkit.xyz/)
- Next.js: Check [Next.js Documentation](https://nextjs.org/docs)