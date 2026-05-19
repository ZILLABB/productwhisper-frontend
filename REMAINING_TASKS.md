# ProductWhisper Frontend - Remaining Tasks

**Date:** 2026-05-19

---

## High Priority

### 1. Install socket.io-client (when backend is ready)
The SocketContext is currently a stub. When the backend WebSocket server is available:
- `npm install socket.io-client`
- Rewrite `src/contexts/SocketContext.tsx` with real socket.io connection
- Wire up real-time notifications

### 2. npm audit fix
22 vulnerabilities reported. Run:
```bash
npm audit fix
```
Some may require `--force` for breaking changes.

### 3. ESLint Configuration & Fixes
- ESLint is configured but warnings haven't been systematically addressed
- Run `npx eslint src/ --fix` and review remaining warnings

### 4. Backend API Integration
All pages currently fall back to mock data. When the backend (localhost:8000) is running:
- Verify all API endpoints match the contracts in `src/services/api.ts`
- Test error handling and token refresh flows
- Verify search, product details, trends, comparison, and auth flows

---

## Medium Priority

### 5. Responsive / Mobile UI Review
- Test all pages at mobile breakpoints (320px, 375px, 768px)
- ProductPage tabs may need horizontal scroll on mobile
- SearchPage filter sheet already uses Sheet component (mobile-ready)

### 6. Particle Effects
FloatingParticles and ParticleBackground are currently stubs. If particle effects are desired:
- `npm install @tsparticles/react tsparticles`
- Restore the original implementations

### 7. Testing Infrastructure
- No test runner or test files exist (App.test.tsx was deleted)
- Set up Vitest + React Testing Library
- Add unit tests for contexts (Auth, Search, Notification)
- Add component tests for key UI components

### 8. Form Validation Enhancement
- ProfilePage has basic validation; consider using react-hook-form + zod
- LoginPage and RegisterPage could benefit from the same

---

## Low Priority

### 9. Performance Optimization
- SearchPage chunk is 117KB gzipped (35KB) - consider further code splitting
- Consider virtualizing long product lists (react-window or @tanstack/virtual)
- Add `React.memo` to ProductCard and ReviewCard if lists grow large

### 10. Accessibility Improvements
- Add skip-to-content link
- Ensure all forms have proper error announcements (aria-live)
- Test with screen reader
- Add keyboard navigation to custom interactive elements

### 11. SEO / Meta Tags
- Add react-helmet-async for page-specific meta tags
- Add structured data (JSON-LD) for product pages

### 12. Error Boundary Coverage
- Wrap each page route in its own ErrorBoundary
- Add error recovery UI beyond the generic fallback

### 13. Internationalization (i18n)
- No i18n setup exists; all strings are hardcoded English
- Consider react-intl or i18next if multi-language support is needed
