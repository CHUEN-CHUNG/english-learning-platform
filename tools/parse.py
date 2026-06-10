import re
import csv

def parse_text():
    with open('raw_text.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    text = re.sub(r'-- \d+ of 7 --', '', text)
    text = text.replace('Flyers 單 字 表', '')
    text = text.replace('beginv', 'begin v')
    text = text.replace('preparev', 'prepare v')
    
    numbers = [str(i) for i in range(1, 553)]
    numbers.sort(key=int, reverse=True)
    
    # Split by \b(number)\s+(?=[a-zA-Z])
    pattern = r'\b(' + '|'.join(numbers) + r')\s+(?=[a-zA-Z])'
    parts = re.split(pattern, text)
    
    items = {}
    for i in range(1, len(parts), 2):
        num = int(parts[i])
        content = parts[i+1].strip()
        content = re.sub(r'\s+', ' ', content).strip()
        items[num] = content
        
    names = ["Betty", "David", "Emma", "Frank", "George", "Harry", "Helen", "Holly", "Katy", "Michael", "Oliver", "Richard", "Robert", "Sarah", "Sophia", "William"]
    
    pos_list = [r'adj \+ excl', r'adj \+ n', r'adj \+ adv', r'adv \+ conj', r'adv \+ det \+pron', r'adv \+ det', r'adv \+ prep', r'adv \+ n', r'n \+ adj', r'n \+ prep', r'n \+ v', r'adj\+excl', r'prep of time', r'adj', r'adv', r'conj', r'det', r'dis', r'excl', r'int', r'n', r'poss', r'prep', r'pron', r'v']
    pos_pattern = r'\b(?:' + '|'.join(pos_list) + r')\b'
    
    parsed_data = []
    
    for num in sorted(items.keys()):
        content = items[num]
        
        is_name = False
        for name in names:
            if content.startswith(name):
                is_name = True
                break
        if is_name:
            continue
            
        if num >= 541:
            # Abbreviations section
            parts_space = content.split(' ', 1)
            word = parts_space[0]
            pos = ""
            chinese = parts_space[1] if len(parts_space) > 1 else ""
        else:
            match = re.search(pos_pattern, content)
            if match:
                pos = match.group().replace('\\', '')
                word = content[:match.start()].strip()
                chinese = content[match.end():].strip()
            else:
                match_chinese = re.search(r'[\u4e00-\u9fff]', content)
                if match_chinese:
                    word = content[:match_chinese.start()].strip()
                    pos = ""
                    chinese = content[match_chinese.start():].strip()
                else:
                    word = content
                    pos = ""
                    chinese = ""
                
        parsed_data.append({
            '標號': num,
            '單字': word,
            '詞性': pos,
            '中文': chinese
        })
        
    with open('Flyers_Voc.csv', 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=['標號', '單字', '詞性', '中文'])
        writer.writeheader()
        for row in parsed_data:
            writer.writerow(row)

if __name__ == '__main__':
    parse_text()
