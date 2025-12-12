---
description: Low Priority Bug Fixes Plan
---

# Low Priority Fixes

## 1. Externalize API Configuration
- [ ] Create `services/config.ts` to manage API URLs
- [ ] Allow environment variables (`VITE_API_BASE`, etc.) to override defaults
- [ ] Refactor `services/lyricsService.ts` to use config

## 2. Fix Types (`components/lyrics/LyricLine.ts`)
- [ ] Remove `@ts-ignore` for `Intl.Segmenter`
- [ ] Add proper type augmentation if necessary
