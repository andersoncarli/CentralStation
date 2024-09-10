#!/bin/bash

# Name of the output file
OUTPUT_FILE="combined_app_files.txt"

# Function to add a file to the output with a header
add_file() {
    echo "==== $1 ====" >> "$OUTPUT_FILE"
    cat "$1" >> "$OUTPUT_FILE"
    echo "\n\n" >> "$OUTPUT_FILE"
}

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Add package.json
add_file "package.json"

# Add next.config.js
add_file "next.config.js"

# Add tsconfig.json
add_file "tsconfig.json"

# Add tailwind.config.js
add_file "tailwind.config.js"

# Add middleware.ts
add_file "middleware.ts"

# Add src/styles files
add_file "src/styles/globals.css"
add_file "src/styles/app.css"

# Add src/lib files
add_file "src/lib/mongodb.ts"

# Add src/components files
for file in src/components/*.tsx; do
    add_file "$file"
done

# Add src/app files
add_file "src/app/layout.tsx"
add_file "src/app/page.tsx"

# Add other app pages
add_file "src/app/about/page.tsx"
add_file "src/app/blog/page.tsx"
add_file "src/app/todo/page.tsx"

# Add API routes
add_file "src/app/api/todos/route.ts"

# Add locales
for lang in en es; do
    for file in public/locales/$lang/*.json; do
        add_file "$file"
    done
done

echo "All application files have been combined into $OUTPUT_FILE"