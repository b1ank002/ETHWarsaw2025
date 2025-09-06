# 🚀 Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] **Linting**: No ESLint errors
- [x] **TypeScript**: No type errors
- [x] **Code Formatting**: Consistent formatting applied
- [x] **Unused Code**: Removed all unused files and dependencies
- [x] **File Structure**: Clean, organized project structure

### ✅ Dependencies
- [x] **Package.json**: Clean dependencies (removed unused packages)
- [x] **Node Modules**: All required packages installed
- [x] **Version Compatibility**: All packages compatible with Next.js 15

### ✅ Configuration Files
- [x] **Next.js Config**: Properly configured for production
- [x] **TypeScript Config**: Properly configured
- [x] **Tailwind Config**: Properly configured
- [x] **ESLint Config**: Properly configured

## Environment Setup

### Required Environment Variables
Create a `.env.local` file with these variables:

```env
# OnchainKit Configuration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Base Mini App

# Ramp Network Configuration (Optional but recommended)
NEXT_PUBLIC_RAMP_API_KEY=your_ramp_api_key_here

# App Configuration
NEXT_PUBLIC_URL=https://your-domain.com
NEXT_PUBLIC_APP_HERO_IMAGE=/hero.png
NEXT_PUBLIC_SPLASH_IMAGE=/splash.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#1E40AF
```

### How to Get API Keys

#### 1. OnchainKit API Key
1. Go to [OnchainKit Dashboard](https://onchainkit.xyz/)
2. Create a new project
3. Copy your API key
4. Add to `NEXT_PUBLIC_ONCHAINKIT_API_KEY`

#### 2. Ramp Network API Key (Optional)
1. Go to [Ramp Dashboard](https://dashboard.ramp.network/)
2. Create a new application
3. Copy your API key
4. Add to `NEXT_PUBLIC_RAMP_API_KEY`

## Deployment Options

### Option 1: Vercel (Recommended)
1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Go to Project Settings → Environment Variables

3. **Deploy**:
   - Click "Deploy" button
   - Vercel will build and deploy automatically

### Option 2: Netlify
1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**:
   - Add in Site Settings → Environment Variables

### Option 3: Self-Hosted
1. **Build the Project**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

3. **Configure Reverse Proxy** (Nginx/Apache)

## Post-Deployment Checklist

### ✅ Testing
- [ ] **Homepage Loads**: App loads without errors
- [ ] **Wallet Connection**: MiniKit wallet connection works
- [ ] **Ramp Widget**: Ramp Network widget opens correctly
- [ ] **Asset Selection**: USDC/ETH selection works
- [ ] **Currency Selection**: USD/EUR/GBP selection works
- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **Error Handling**: Error states display properly

### ✅ Performance
- [ ] **Page Speed**: Good Lighthouse scores
- [ ] **Bundle Size**: Optimized bundle size
- [ ] **Loading Times**: Fast initial load

### ✅ Security
- [ ] **HTTPS**: Site uses HTTPS
- [ ] **API Keys**: Environment variables properly secured
- [ ] **CORS**: Proper CORS configuration if needed

## Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Environment Variables Not Working
- Check variable names start with `NEXT_PUBLIC_`
- Restart development server after adding variables
- Verify variables are set in deployment platform

#### 3. Ramp Widget Not Loading
- Check if `NEXT_PUBLIC_RAMP_API_KEY` is set
- Verify Ramp API key is valid
- Check browser console for errors

#### 4. Wallet Connection Issues
- Verify `NEXT_PUBLIC_ONCHAINKIT_API_KEY` is set
- Check if OnchainKit API key is valid
- Ensure Base network is properly configured

## Monitoring

### Analytics (Optional)
- Add Google Analytics or similar
- Monitor user interactions with Ramp widget
- Track conversion rates

### Error Monitoring (Optional)
- Add Sentry or similar error tracking
- Monitor for JavaScript errors
- Track API failures

## Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor for security vulnerabilities
- Update Ramp Network SDK when new versions available

### Backup
- Keep code in version control (Git)
- Backup environment variables
- Document any custom configurations

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test locally first with `npm run dev`
4. Check deployment platform logs
5. Review this checklist

---

**Ready to Deploy! 🚀**

Your project is clean, optimized, and ready for production deployment.