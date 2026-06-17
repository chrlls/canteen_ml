import os
import re

src_dir = r"c:\Users\Charl\canteen_ml\canteen-frontend\src\components"

# Patterns to remove
patterns_to_remove = [
    # Google fonts
    re.compile(r"@import url\('https://fonts\.googleapis\.com/css2\?family=Poppins:[^']+'\);?\s*"),
    
    # Common Keyframes
    re.compile(r"@keyframes spin\s*\{[^}]+\}\s*"),
    re.compile(r"@keyframes shimmer\s*\{[^}]+\}\s*"),
    re.compile(r"@keyframes dropIn\s*\{[^}]+\}\s*"),
    re.compile(r"@keyframes shimBarAnim\s*\{[^}]+\}\s*"),
]

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".jsx"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for p in patterns_to_remove:
                new_content = p.sub('', new_content)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Cleaned {file}")
