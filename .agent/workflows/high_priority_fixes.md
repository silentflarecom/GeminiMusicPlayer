---
description: High Priority Bug Fixes Plan
---

# High Priority Fixes

## 1. Lyric Animation Fix (`components/lyrics/LyricLine.ts`)
- [ ] Relax conditions for glow animation
- [ ] Allow shorter words and shorter durations to have effects
- [ ] Adjust fade-in/out logic for short durations

## 2. Cache Strategy Fix (`services/cache.ts`)
- [ ] Modify `createSizeLimitedLRU` to support dynamic limits
- [ ] Make `IMAGE_CACHE_LIMIT` and `AUDIO_CACHE_LIMIT` dynamic functions
- [ ] Re-check eviction on set/get

## 3. Audio Error Handling (`hooks/usePlayer.ts`)
- [ ] Use `useToast` for user feedback
- [ ] Implement retry logic (max 3 retries)
- [ ] Add explicit error UI feedback
