# Content Guard

Hard-blocks any prompts that imply **minors**. Designed as a front-door filter for NSFW models (e.g., Venice.ai pipelines).

## Overview

The Content Guard is a TypeScript/React implementation of a content safety system that validates user prompts before they're sent to AI models. It focuses specifically on blocking any content that references or implies minors, while allowing legitimate adult content.

## Features

- **Text Normalization**: Handles Unicode tricks, homoglyphs, leetspeak, zero-width characters
- **Age Detection**: Blocks explicit ages under 18, allows 18+
- **School Context Detection**: Catches K-12 school references (grades, middle school, high school, etc.)
- **Hard Term Blocking**: Immediately blocks dangerous genre/slur terms (loli, shota, child, minor, etc.)
- **Ambiguous Youth Descriptors**: Blocks terms like "teen", "schoolgirl", "barely legal", etc.
- **Adult Term Normalization**: Handles common typos in adult content (e.g., "boobiies" → "boobies")
- **Obfuscation Protection**: Production builds include aggressive code obfuscation to prevent tampering

## Installation

The content guard is already included in this project. To use it:

```bash
npm install
```

For production builds with obfuscation:

```bash
npm run build:obfuscated
```

## API Reference

### `assess(prompt: string, policyNukeOnMinor?: boolean): Decision`

Main function to assess a prompt for content safety.

**Parameters**:

- `prompt` (string): The text prompt to validate
- `policyNukeOnMinor` (boolean, optional): Whether to block on any minor signal (default: `true`)

**Returns**: `Decision` object

```typescript
interface Decision {
  allow: boolean;                    // true if content is safe
  action: 'ALLOW' | 'BLOCK' | 'REWRITE';
  reason: string;                     // Human-readable explanation
  normalizedPrompt: string;           // Normalized version of input
  rewrittenPrompt: string | null;     // Rewritten version if normalization occurred
  signals: Signals;                   // Detailed detection signals
}

interface Signals {
  hardTerms: string[];                // Detected hard block terms
  ambiguousYouth: string[];           // Detected youth descriptors
  adultAssertions: string[];          // Detected adult affirmations
  ages: number[];                     // Extracted age numbers
  schoolContext: string[];            // Detected school references
  normalized: string;                 // Normalized text
}
```

### `normalizeText(s: string): string`

Utility function to normalize text (removes obfuscation attempts).

**Parameters**:

- `s` (string): Text to normalize

**Returns**: Normalized string

## Usage Examples

### Standalone Usage

```typescript
import { assess } from './utils/contentGuard';

const decision = assess('25 year old woman');

if (decision.allow) {
  console.log('Content is safe');
  // Proceed with API call
} else {
  console.log('Content blocked:', decision.reason);
  // Show error to user
}
```

### React Hook Usage

```typescript
import { useContentGuard } from './hooks/useContentGuard';

function PromptForm() {
  const { decision, validate } = useContentGuard();
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    validate(prompt);
    
    if (decision?.allow) {
      // Submit to API
      submitToAPI(prompt);
    } else {
      setError(decision?.reason || 'Content not allowed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Generate</button>
    </form>
  );
}
```

### Real-time Validation

```typescript
import { useContentGuard } from './hooks/useContentGuard';

function PromptInput() {
  const { decision, validate } = useContentGuard();
  const [prompt, setPrompt] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    validate(value);
  };

  return (
    <div>
      <textarea 
        value={prompt} 
        onChange={handleChange}
        className={decision?.allow === false ? 'error' : ''}
      />
      {decision && !decision.allow && (
        <div className="warning">
          ⚠️ {decision.reason}
        </div>
      )}
    </div>
  );
}
```

## Decision Logic

The content guard uses a strict, layered approach:

1. **Age Check**: Any explicit age under 18 → BLOCK
2. **Hard Terms**: Any minor-implying term (loli, child, minor, etc.) → BLOCK
3. **School Context**: Any K-12 school reference → BLOCK
4. **Ambiguous Youth**: Any youth descriptor (teen, schoolgirl, etc.) → BLOCK
5. **Pass**: If no signals detected → ALLOW

Even if adult affirmations are present (e.g., "18+"), the presence of any youth signal will still block the content.

## Examples

### ✅ ALLOW Cases

```typescript
assess('25 year old woman');
// → { allow: true, action: 'ALLOW' }

assess('mature adult content, 30yo');
// → { allow: true, action: 'ALLOW' }

assess('boobiies'); // typo normalization
// → { allow: true, normalizedPrompt: 'boobies' }
```

### ❌ BLOCK Cases

```typescript
assess('17 year old');
// → { allow: false, reason: 'Explicit age under 18 detected' }

assess('loli character');
// → { allow: false, reason: "Minor-implying term(s): loli" }

assess('high school girl');
// → { allow: false, reason: 'K-12 school context implies minor' }

assess('teen romance');
// → { allow: false, reason: 'Ambiguous youth descriptor present' }

assess('18+ teen girl'); // Still blocked despite 18+
// → { allow: false, reason: 'Ambiguous youth descriptor present' }
```

## Obfuscation

Production builds use `javascript-obfuscator` with aggressive settings:

- String array encoding (base64)
- Control flow flattening
- Dead code injection
- Identifier mangling
- Self-defending code

To build with obfuscation:

```bash
npm run build:obfuscated
```

The obfuscated code is significantly harder to reverse engineer, but **not impossible**. For maximum security, consider:

1. **Server-Side Validation**: Implement the same checks on your backend
2. **API Rate Limiting**: Prevent brute-force attempts to find edge cases
3. **Monitoring**: Log blocked attempts and review patterns
4. **Regular Updates**: Keep the block lists and patterns up to date

## Security Considerations

> [!WARNING]
> **Client-Side Limitations**: Any client-side validation can be bypassed by determined attackers. This content guard should be part of a defense-in-depth strategy, not the only protection layer.

**Best Practices**:

1. ✅ **Use server-side validation** as the authoritative check
2. ✅ **Log all blocked attempts** for review and pattern analysis
3. ✅ **Update block lists regularly** based on new evasion techniques
4. ✅ **Monitor API usage** for suspicious patterns
5. ✅ **Educate users** about acceptable use policies
6. ❌ **Don't rely solely on obfuscation** for security

## Testing

Run the comprehensive test suite:

```bash
npm test contentGuard.test.ts
```

The test suite includes 50+ test cases covering:

- Text normalization
- Hard term detection
- Age pattern detection
- School context detection
- Ambiguous youth descriptors
- Adult content normalization
- Obfuscation attempts (leetspeak, homoglyphs, zero-width)
- Edge cases and boundary conditions

## Compliance

This module is designed for use with adult content platforms to ensure compliance with:

- Child protection laws (COPPA, GDPR Article 8, etc.)
- Platform policies (Venice.ai, Replicate, etc.)
- Content moderation requirements

**Legal Notice**: This is a technical tool and does not constitute legal advice. Consult with legal counsel to ensure compliance with applicable laws in your jurisdiction.

## License

MIT License - See LICENSE file for details.

## Contributing

To modify the block lists or detection patterns:

1. Edit the constants in [contentGuard.ts](file:///Users/super_user/Projects/VeniceAI/src/utils/contentGuard.ts)
2. Add corresponding test cases in [contentGuard.test.ts](file:///Users/super_user/Projects/VeniceAI/src/utils/contentGuard.test.ts)
3. Run `npm run preflight` to verify all tests pass
4. Build with obfuscation for production: `npm run build:obfuscated`

## Support

For issues or questions:

- Open an issue on GitHub
- Review the test suite for usage examples
- Check the inline documentation in the source code
