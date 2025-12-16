# Contributing to Venice Generator

Thank you for your interest in contributing to Venice Generator! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Bug Reports](#bug-reports)
8. [Feature Requests](#feature-requests)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned with this Code of Conduct.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git** for version control
- Basic knowledge of React, JavaScript/TypeScript
- Familiarity with the project (read the [README](README.md))

### First Contribution

Looking for a place to start? Check out:

- **Good First Issues**: Tagged as `good-first-issue` on GitHub
- **Documentation**: Always needs improvement
- **Tests**: Add test coverage for existing features
- **Bug Fixes**: Check open issues labeled `bug`

---

## Development Setup

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/venice-generator.git
cd venice-generator
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/venice-generator.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 6. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 7. Start Development Server

```bash
npm run dev
```

---

## Coding Standards

### JavaScript/TypeScript Conventions

Follow the project's ESLint configuration:

```bash
npm run lint
```

**Key Rules:**

- **Functional Components**: Use React functional components with Hooks
- **No Classes**: Prefer plain objects and ES modules over classes
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for components
  - `UPPERCASE_SNAKE_CASE` for constants
- **Imports**: Group by type (React, libraries, local)
- **File Structure**: Co-locate tests (`*.test.js`) with source files

### React Best Practices

From our [user rules](memory):

- **Hooks Only**: No class components
- **Pure Rendering**: Keep render logic pure; side effects in `useEffect`
- **One-Way Data Flow**: Lift state or use Context
- **No State Mutation**: Use setters, never mutate directly
- **Trust React Compiler**: Avoid manual `useMemo`/`useCallback` unless necessary

### Array Operations

Use declarative methods:

```javascript
// Good
const filtered = items.filter(item => item.active);
const mapped = items.map(item => ({ ...item, new: true }));

// Avoid
const filtered = [];
for (let item of items) {
  if (item.active) filtered.push(item);
}
```

### Code Comments

- **Why, not What**: Explain reasoning, not implementation
- **Update Comments**: Keep in sync with code changes
- **No Commented Code**: Delete unused code instead of commenting

---

## Testing Requirements

### Test Framework

We use **Vitest** with React Testing Library.

### Test Structure

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest src/utils/api.test.js

# Coverage report
npx vitest --coverage
```

### Test Requirements

- **New Features**: Must include tests
- **Bug Fixes**: Add regression test
- **Coverage**: Aim for >80% coverage on new code
- **All Tests Pass**: Before submitting PR

### Mocking

From our [user rules](memory):

```javascript
// ES modules
vi.mock('module-name', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fn: vi.fn() };
});

// Hoisted mocks
const myMock = vi.hoisted(() => vi.fn());
vi.mock('module', () => ({ fn: myMock }));
```

---

## Pull Request Process

### Before Submitting a PR

1. **Sync with Upstream**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run Preflight**:

   ```bash
   npm run preflight
   ```

   This runs build + lint. All must pass.

3. **Run Tests**:

   ```bash
   npm test
   ```

4. **Update Documentation**: If changing behavior or adding features

### Commit Messages

Follow conventional commits format:

```text
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```text
feat(chat): add message history export
fix(api): handle 429 rate limit errors correctly
docs(readme): update setup instructions
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Preflight check passed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: At least one maintainer approval required
5. **Merge**: Maintainer merges after approval

---

## Bug Reports

### Before Submitting a Bug Report

1. **Search Existing Issues**: Check if already reported
2. **Reproduce**: Verify the bug is reproducible
3. **Simplify**: Create minimal reproduction case

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. v18.17.0]
- App Version: [e.g. 1.0.0]

## Screenshots
If applicable

## Additional Context
Any other relevant information
```

---

## Feature Requests

### Before Submitting a Feature Request

1. **Check Existing Requests**: Avoid duplicates
2. **Consider Scope**: Is it aligned with project goals?
3. **Provide Details**: Clear use case and benefits

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought of

## Additional Context
Mockups, examples, references
```

---

## Development Workflow

### Typical Workflow

1. **Pick an Issue**: Comment to claim it
2. **Create Branch**: `git checkout -b feature/issue-123`
3. **Develop**: Write code and tests
4. **Test Locally**: `npm test` and `npm run dev`
5. **Commit**: Follow commit message guidelines
6. **Push**: `git push origin feature/issue-123`
7. **Create PR**: Open pull request on GitHub
8. **Address Feedback**: Make requested changes
9. **Merge**: Maintainer merges after approval

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Questions or Need Help?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and features
- **Discord**: Real-time chat with community
- **Email**: <maintainer@example.com>

---

## Attribution

Thank you to all contributors who help make Venice Generator better!

- See [all contributors](https://github.com/OWNER/venice-generator/graphs/contributors)
- This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct
