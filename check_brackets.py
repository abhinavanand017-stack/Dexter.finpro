import sys

def check_brackets(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    stack = []
    brackets = {'{': '}', '[': ']', '(': ')'}
    inverse_brackets = {v: k for k, v in brackets.items()}

    in_string = False
    string_char = ''
    in_single_comment = False
    in_multi_comment = False

    i = 0
    while i < len(content):
        c = content[i]

        if not in_string and not in_single_comment and not in_multi_comment:
            if c == '/' and i + 1 < len(content) and content[i+1] == '/':
                in_single_comment = True
                i += 1
            elif c == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_multi_comment = True
                i += 1
            elif c in ['\'', '\"', '`']:
                in_string = True
                string_char = c
            elif c in brackets:
                stack.append((c, i))
            elif c in inverse_brackets:
                if not stack:
                    line = content[:i].count('\n') + 1
                    print(f'Unmatched closing {c} at index {i} (line {line})')
                    return
                top, pos = stack.pop()
                if top != inverse_brackets[c]:
                    line = content[:i].count('\n') + 1
                    pos_line = content[:pos].count('\n') + 1
                    print(f'Mismatched closing {c} at index {i} (line {line}), expected {brackets[top]} for {top} at {pos} (line {pos_line})')
                    return
        elif in_single_comment:
            if c == '\n':
                in_single_comment = False
        elif in_multi_comment:
            if c == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_multi_comment = False
                i += 1
        elif in_string:
            if c == '\\':
                i += 1
            elif c == string_char:
                in_string = False

        i += 1

    if stack:
        for c, pos in stack:
            line = content[:pos].count('\n') + 1
            print(f'Unmatched opening {c} at index {pos} (line {line})')
    else:
        print('All brackets match!')

check_brackets('c:/Users/Abhin/fintech_repo/app.js')
