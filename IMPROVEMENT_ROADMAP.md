# ProductWhisper Frontend - Improvement Roadmap

**Date:** 2026-05-19

---

## Phase 1: Foundation (1-2 weeks)

### Backend Integration
- [ ] Connect to real backend API at localhost:8000
- [ ] Verify all API contracts (search, products, auth, trends, comparison)
- [ ] Implement proper error handling for all API failure modes
- [ ] Set up proper token refresh and session management

### Testing
- [ ] Install Vitest + React Testing Library
- [ ] Write unit tests for Auth, Search, Notification contexts
- [ ] Write component tests for ProductCard, ReviewCard, SentimentChart
- [ ] Write integration tests for key user flows (search, product view)
- [ ] Add CI pipeline for automated testing

### Security
- [ ] Run `npm audit fix` to resolve 22 vulnerabilities
- [ ] Add CSP headers configuration
- [ ] Implement rate limiting on the frontend for API calls
- [ ] Add input sanitization for search queries

---

## Phase 2: Polish (2-4 weeks)

### UI/UX Enhancement with shadcn/ui
- [ ] Add shadcn `DropdownMenu` for user profile menu in Header
- [ ] Add shadcn `Dialog` for confirmation modals (delete, logout)
- [ ] Add shadcn `Toast` (sonner) to replace custom Toast implementation
- [ ] Add shadcn `Command` for search with keyboard shortcuts (Cmd+K)
- [ ] Add shadcn `Breadcrumb` for page navigation hierarchy
- [ ] Add shadcn `Pagination` for search results and review lists

### Responsive Design
- [ ] Audit all pages at 320px, 375px, 768px, 1024px, 1440px
- [ ] Fix ProductPage tab overflow on mobile
- [ ] Optimize hero section for small screens
- [ ] Test touch interactions on comparison drag-and-drop

### Accessibility
- [ ] Add skip-to-content link
- [ ] Ensure all interactive elements are keyboard navigable
- [ ] Add aria-live regions for dynamic content updates
- [ ] Test with VoiceOver/NVDA screen readers
- [ ] Ensure color contrast meets WCAG AA standards

---

## Phase 3: Performance (4-6 weeks)

### Bundle Optimization
- [ ] Analyze bundle with `npx vite-bundle-visualizer`
- [ ] Lazy-load Framer Motion only on pages that use it
- [ ] Tree-shake unused lucide-react and react-icons icons
- [ ] Consider replacing react-icons/fi with lucide-react entirely (already partially done)
- [ ] Implement route-based code splitting for all pages

### Runtime Performance
- [ ] Add React.memo to list item components (ProductCard, ReviewCard)
- [ ] Virtualize long lists with @tanstack/virtual
- [ ] Implement proper image optimization (srcset, lazy loading, WebP)
- [ ] Add service worker for offline support and caching
- [ ] Implement stale-while-revalidate pattern for API data

### Monitoring
- [ ] Add error tracking (Sentry or similar)
- [ ] Add performance monitoring (Web Vitals)
- [ ] Add analytics for user behavior tracking

---

## Phase 4: Features (6-12 weeks)

### Real-time Features
- [ ] Install socket.io-client and implement real WebSocket connection
- [ ] Real-time notification delivery
- [ ] Live sentiment score updates
- [ ] Collaborative comparison sessions

### Advanced Search
- [ ] Implement faceted search with URL-synced filters
- [ ] Add search suggestions/autocomplete from API
- [ ] Add voice search capability
- [ ] Implement search history with local storage

### User Experience
- [ ] Add dark mode support (Tailwind dark: classes + context)
- [ ] Add user preference persistence (theme, layout, sort preferences)
- [ ] Implement product watchlist/favorites with persistence
- [ ] Add email notification preferences UI
- [ ] Add data export (PDF reports for product comparisons)

### Content
- [ ] Add product image galleries with zoom
- [ ] Add video review embeds
- [ ] Add interactive sentiment timeline charts (recharts or visx)
- [ ] Add comparison radar charts

---

## Technical Debt to Address

| Item | Priority | Effort |
|------|----------|--------|
| Unify icon library (react-icons vs lucide-react) | Medium | 2h |
| Remove Framer Motion from pages that don't need it | Low | 1h |
| Add proper TypeScript strict mode | Medium | 4h |
| Set up Storybook for component documentation | Low | 4h |
| Add pre-commit hooks (husky + lint-staged) | Medium | 1h |
| Configure proper production environment variables | High | 1h |
