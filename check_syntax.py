import re
import sys

def check_syntax(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # 1. Check for unclosed quotes
    in_str = False
    str_char = ''
    in_multi = False
    
    for i, line in enumerate(lines):
        j = 0
        while j < len(line):
            c = line[j]
            if not in_str and not in_multi:
                if c == '/' and j+1 < len(line) and line[j+1] == '/':
                    break
                elif c == '/' and j+1 < len(line) and line[j+1] == '*':
                    in_multi = True
                    j += 1
                elif c in ["'", '"', '`']:
                    in_str = True
                    str_char = c
            elif in_multi:
                if c == '*' and j+1 < len(line) and line[j+1] == '/':
                    in_multi = False
                    j += 1
            elif in_str:
                if c == '\\':
                    j += 1
                elif c == str_char:
                    in_str = False
            j += 1
            
        if in_str and str_char != '`':
            print(f"Unclosed string on line {i+1}: {line}")
            in_str = False
            
check_syntax('c:/Users/Abhin/fintech_repo/app.js')
