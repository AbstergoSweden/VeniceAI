# Content Guard - Quick Start Guide

## What is Content Guard?

A TypeScript/React content safety system that validates user prompts to **hard-block any content referencing or implying minors**. Translated from Python with aggressive obfuscation to prevent tampering.

## Files Created

```
src/
├── utils/
│   ├── contentGuard.ts          # Core validation logic (347 lines)
│   └── contentGuard.test.ts     # Test suite (421 lines, 50+ tests)
└── hooks/
    └── useContentGuard.ts        # React hook (71 lines)

scripts/
├── obfuscate-guard.js            # Build-time obfuscation (97 lines)
└── verify-guard.mjs              # Manual verification script

docs/
└── CONTENT_GUARD_README.md       # Full documentation (325 lines)
```

## Quick Usage

### Option 1: Standalone Function

```typescript
import { assess } from './utils/contentGuard';

const decision = assess('your prompt here');

if (decision.allow) {
  // ✅ Safe to proceed
  await submitToAPI(decision.normalizedPrompt);
} else {
  // ❌ Blocked
  console.error(decision.reason);
  // Examples:
  // - "Explicit age under 18 detected"
  // - "Minor-implying term(s): loli"
  // - "K-12 school context implies minor"
  // - "Ambiguous youth descriptor present"
}
```

### Option 2: React Hook

```typescript
import { useContentGuard } from './hooks/useContentGuard';

function MyComponent() {
  const { decision, validate } = useContentGuard();
  
  const handleSubmit = (prompt) => {
    validate(prompt);
    
    if (decision?.allow) {
      submitPrompt(prompt);
    } else {
      alert(decision?.reason);
    }
  };
}
```

## What Gets Blocked?

### ❌ BLOCK Examples

```typescript
assess('17 year old')          // Age < 18
assess('loli character')        // Hard term
assess('high school girl')      // School context  
assess('teen romance')          // Ambiguous youth
assess('l0li anime')            // Obfuscated (l33t)
assess('ⓛⓞⓛⓘ')                 // Obfuscated (homoglyphs)
assess('18+ teen girl')         // Youth term despite 18+
```

### ✅ ALLOW Examples

```typescript
assess('25 year old woman')     // Adult age
assess('mature content')        // Adult descriptors
assess('boobiies')              // Adult typo (normalized)
assess('adult professional')    // Safe context
```

## Building for Production

### Standard Build

```bash
npm run build
```

### Obfuscated Build (Recommended)

```bash
npm run build:obfuscated
```

This applies aggressive obfuscation:

- String array encoding (base64)
- Control flow flattening
- Dead code injection
- Identifier mangling
- Self-defending code

**Result**: 3-4x size increase, near-zero readability

## Testing

Run the test suite:

```bash
npm test contentGuard.test.ts
```

50+ tests covering:

- Normalization (Unicode, leetspeak, homoglyphs)
- Age detection (<18 blocked, ≥18 allowed)
- Hard terms (loli, shota, child, minor, etc.)
- School contexts (K-12 references)
- Ambiguous youth (teen, schoolgirl, etc.)
- Obfuscation attempts
- Edge cases

## Decision Object Structure

```typescript
interface Decision {
  allow: boolean;                  // true = safe, false = blocked
  action: 'ALLOW' | 'BLOCK';
  reason: string;                   // Human-readable explanation
  normalizedPrompt: string;         // After Unicode/leetspeak normalization
  rewrittenPrompt: string | null;   // If normalized ≠ original
  signals: {
    hardTerms: string[];            // Detected block terms
    ambiguousYouth: string[];       // Youth descriptors
    adultAssertions: string[];      // Adult affirmations
    ages: number[];                 // Extracted ages
    schoolContext: string[];        // K-12 references
    normalized: string;             // Normalized text
  };
}
```

## Security Notes

> ⚠️ **Client-side limitations**: Obfuscation makes reverse engineering difficult but not impossible. For production:

1. ✅ Use this for **fast user feedback**
2. ✅ Add **server-side validation** (same logic)
3. ✅ Implement **rate limiting**
4. ✅ Monitor and **log blocked attempts**
5. ❌ Don't rely solely on client-side checks

## Integration with Venice AI Generator

### Chat Panel Integration

```tsx
// In ChatPanel.tsx or similar
import { useContentGuard } from '../hooks/useContentGuard';

function ChatPanel() {
  const { decision, validate } = useContentGuard();
  const [message, setMessage] = useState('');
  
  const handleSend = () => {
    validate(message);
    
    if (decision?.allow) {
      sendMessage(message);
    } else {
      toast.error(`Content blocked: ${decision.reason}`);
    }
  };
}
```

### Image Generation Integration

```tsx
// In App.jsx or generation component  
import { assess } from './utils/contentGuard';

const handleGenerate = async (prompt) => {
  const check = assess(prompt);
  
  if (!check.allow) {
    setError(check.reason);
    return;
  }
  
  // Proceed with generation
  const result = await generateImage(check.normalizedPrompt);
};
```

## Documentation

Full documentation available at:

- [CONTENT_GUARD_README.md](file:///Users/super_user/Projects/VeniceAI/docs/CONTENT_GUARD_README.md) - Complete API reference
- [walkthrough.md](file:///Users/super_user/.gemini/antigravity/brain/fa286af9-a6be-4dbb-b7fb-8c5c452b76fe/walkthrough.md) - Implementation details

## Troubleshooting

**Q: Tests fail to import module?**
A: Ensure TypeScript is configured correctly in `vitest.config.ts`

**Q: Obfuscation script fails?**
A: Run `npm install javascript-obfuscator` first

**Q: False positives blocking valid content?**
A: Review block lists in `contentGuard.ts` and adjust as needed

**Q: Need different strictness levels?**
A: Modify the HARD_TERMS, AMBIGUOUS_YOUTH arrays in `contentGuard.ts`

## License

MIT License - See project LICENSE file

## Support

For issues:

1. Check [CONTENT_GUARD_README.md](file:///Users/super_user/Projects/VeniceAI/docs/CONTENT_GUARD_README.md)
2. Review test cases for usage examples
3. Open a GitHub issue

---

**Ready to use!** Import and call `assess()` or use the `useContentGuard()` hook in your components.
