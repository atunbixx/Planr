#!/bin/bash

# Setup Git Hooks for Naming Convention Enforcement
# Run this script to install pre-commit hooks

echo "Setting up Git hooks for naming convention enforcement..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

echo "🔍 Running naming convention checks..."
npm run lint:naming

if [ $? -ne 0 ]; then
  echo "❌ Naming convention violations detected. Commit aborted."
  echo "💡 Run 'npm run lint:naming' to see details"
  exit 1
fi

echo "🔍 Running TypeScript checks..."
npm run typecheck

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected. Commit aborted."
  exit 1
fi

echo "🔍 Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ ESLint errors detected. Commit aborted."
  exit 1
fi

echo "✅ All checks passed! Proceeding with commit..."
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following checks will run before each commit:"
echo "  - Naming convention validation (npm run lint:naming)"
echo "  - TypeScript type checking (npm run typecheck)"
echo "  - ESLint validation (npm run lint)"
echo ""
echo "To bypass these checks (not recommended), use: git commit --no-verify"