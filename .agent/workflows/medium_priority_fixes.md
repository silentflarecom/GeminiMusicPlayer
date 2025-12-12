---
description: Medium Priority Bug Fixes Plan
---

# Medium Priority Fixes

## 1. Search Debounce (`hooks/useSearchModal.ts`)
- [ ] Add debounce to search input processing
- [ ] Ensure API calls are not made on every keystroke
- [ ] Suggested debounce time: 300-500ms

## 2. Memory Leak Prevention (`hooks/usePlayer.ts`)
- [ ] Improve `cleanupSourceBuffer` logging and error handling
- [ ] Ensure `URL.revokeObjectURL` is called reliably
- [ ] Add abort controller to more fetch requests

## 3. Play Mode Toggle Logic (`hooks/usePlayer.ts`)
- [ ] Verify `toggleMode` maintains current song connection when switching from SHUFFLE
- [ ] Fix potential index mismatch when restoring `originalQueue`
