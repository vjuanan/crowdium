#!/bin/bash
# Fix the multiline single-quote strings at line 770

# Replace stroke - width with stroke-width
sed -i '' 's/stroke - width/stroke-width/g' app.js

# Convert the problematic single-quoted multiline strings to backticks
# This is tricky, so we'll use perl for better multiline regex support
perl -i -p0e 's/\$\{isArchivedView \? '\''([^}]+?)'\''/\$\{isArchivedView ? \x60$1\x60/gs' app.js

echo "Fixed multiline strings"
