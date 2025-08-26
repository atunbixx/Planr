#!/bin/bash

echo "🔄 Committing checklist fixes..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: implement functional wedding checklist page

- Replace 'coming soon' placeholder with full checklist functionality
- Fix variable name conflict in tasks page (error -> localError)
- Implement wedding progress tracking with visual indicators
- Add proper authentication using AuthClient
- Connect to existing checklist API for automatic progress detection
- Add progress bar, completion percentage, and task icons
- Include helpful tips about how checklist auto-updates
- Fix import paths and error handling

Features:
✅ Auto-tracks wedding date, venue, guests, budget, photographer
✅ Visual progress indicators with icons and completion status
✅ Responsive design with proper dark mode support
✅ Real-time updates based on user data in other sections"

echo "✅ Changes committed successfully!"
echo ""
echo "Summary of changes:"
echo "- Fixed /checklist route from placeholder to functional page"
echo "- Resolved JavaScript compilation errors"
echo "- Added wedding progress tracking functionality"
echo "- Improved authentication and error handling"