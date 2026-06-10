import pandas as pd

def main():
    # Read files
    bryan_df = pd.read_csv('bryan-word.csv')
    yle2_df = pd.read_csv('YLE-2-Bryan.csv')
    yle3_df = pd.read_csv('YLE-3-Bryan.csv')
    
    # Get sets of excluded words
    yle2_words = set(yle2_df['挑選後的單字'].str.lower().str.strip())
    yle3_existing_words = set(yle3_df['挑選後的單字'].str.lower().str.strip())

    # Context words to look for in bryan-word.csv
    context_words = [
        'bridge', 'station', 'chemist', 'police', 'supermarket', 'bread', 'shoe',
        'kitchen', 'living room', 'bookcase', 'book', 'chair', 'telephone', 'smile',
        'laugh', 'secret', 'money', 'bank', 'ticket', 'journey', 'trip', 'travel',
        'adventure', 'river', 'sky', 'cloud', 'mountain', 'lake', 'beach', 'ship', 'island',
        'programme', 'railway', 'stream', 'suitcase'
    ]
    
    candidates = []
    
    for index, row in bryan_df.iterrows():
        word = str(row['原始單字']).lower().strip()
        if word in yle2_words or word in yle3_existing_words:
            continue
            
        if word in context_words:
            candidates.append(row)
            if len(candidates) == 1:
                break
                
    print(f"Found {len(candidates)} context words to add.")
    
    if len(candidates) == 0:
        # If none found from context_words, just pick the first available one
        for index, row in bryan_df.iterrows():
            word = str(row['原始單字']).lower().strip()
            if word not in yle2_words and word not in yle3_existing_words:
                candidates.append(row)
                break
                
    if len(candidates) == 0:
        return
        
    new_df = pd.DataFrame(candidates)
    
    # Rename columns
    column_mapping = {
        '原始單字標號': '挑選後的單字標號',
        '原始單字': '挑選後的單字',
        '原始單字詞性': '挑選後的單字詞性',
        '原始單字中文': '挑選後的單字中文'
    }
    new_df = new_df.rename(columns=column_mapping)
    
    # Ensure all 12 columns are present
    expected_columns = [
        '挑選後的單字標號', '挑選後的單字', '挑選後的單字詞性', '挑選後的單字中文',
        '7000字內的同義詞一單字', '7000字內的同義詞一中文', '7000字內的同義詞二單字', '7000字內的同義詞二中文',
        '7000字內的反義詞一單字', '7000字內的反義詞一中文', '7000字內的反義詞二單字', '7000字內的反義詞二中文'
    ]
    
    new_df = new_df[expected_columns]
    
    # Append to existing YLE-3-Bryan.csv
    final_df = pd.concat([yle3_df, new_df], ignore_index=True)
    
    # Save to CSV
    final_df.to_csv('YLE-3-Bryan.csv', index=False, encoding='utf-8-sig')
    print(f"Successfully appended words. YLE-3-Bryan.csv now has {len(final_df)} words.")
    print(f"Added word: {candidates[0]['原始單字']}")

if __name__ == '__main__':
    main()
