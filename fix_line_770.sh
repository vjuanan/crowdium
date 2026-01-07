#!/bin/bash
# Fix the illegal multiline single-quote strings at lines 770-782

# Backup first
cp app.js app.js.broken

# Use perl to replace the specific ternary expression
# Line 770: ${isArchivedView ? ' needs to become ${isArchivedView ? `
# Line 775: ' : ' needs to become ` : `  
# Line 782: '} needs to become `}

perl -i -pe '
if ($. == 770) {
    s/\$\{isArchivedView \? '\''$/\$\{isArchivedView ? \x60/;
}
if ($. == 775) {
    s/^    '\'' : '\''$/    \x60 : \x60/;
}
if ($. == 782) {
    s/^    '\''\}$/    \x60}/;
}
' app.js

echo "Fixed multiline strings at lines 770, 775, 782"
