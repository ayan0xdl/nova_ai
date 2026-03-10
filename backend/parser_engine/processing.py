from dataclasses import field
import spacy #for classification of non-labeled text
from spacy.pipeline import entityruler
import re #to impelement regular expressions
nlp=spacy.load('en_core_web_lg') 
ruler=nlp.add_pipe('entity_ruler',before='ner',config={"overwrite_ents":True,"validate":True})
pattern={ 
         #fields with definite formats use regex
        'candidate_name':{'type':'custom'},
        'Email':{'type':'regex','pattern':r'(?:Email[:\- ]+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'},
        'Phone':{'type':'regex','pattern':r'(?:(?:Phone|Mobile|Contact)[:\- ]+)?((?:\+91[\s\-]?|0)?[6-9]\d{4}[\s\-]?\d{5}|(?:\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})'},
        'LinkedIn':{'type':'regex','pattern':r'(?:(?:LinkedIn|LinkedIn Profile)[:\- ]+)?((?:https?:\/\/)?(?:www\.)?linkedin\.com\/[a-zA-Z0-9\-_\/?=]+)'},
         'portfolio':{'type':'regex','pattern':r'(?:(?:GitHub|Portfolio)[:\- ]+)?((?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+/?)'},
        'address':{'type':'regex','pattern':r'(?:(?:Location|Address)[:\- ]+([A-Za-z0-9 ,.-]+)|^\s*(\d+\s+[A-Za-z][A-Za-z0-9 ,.-]*))'},
        #multiple aliases for fields with variable formats use regex block extraction followed by nlp classification hence type block
        'professional experience':{'type':'block','aliases':['work experience','experience','employment history','relevant experience']},
        'education':{'type':'block','aliases':['academic background','qualifications','educational background']},
        'technical skills':{'type':'block','aliases':['skills','core competencies','key skills','additional skills','skill highlights']},
        'projects':{'type':'block','aliases':['personal projects','project work','notable projects']},
        'interests':{'type':'block','aliases':['hobbies','personal interests','areas of interest']},
        'certifications':{'type':'block','aliases':['licenses','accreditations','certificates']}
        
}
#spacy entity ruler patterns to classify entities without definite formats
ruler_patterns=[{'label': 'university', 'pattern': [{'POS':'PROPN','OP':'+'},{'LOWER': {'IN': ['university', 'institute', 'college']}}]},
                 {
        "label": "degree",
        "pattern":[ {"LOWER": {"IN": [
                "bachelor", "master", "phd", "b.s.", "m.s.", "b.tech.", "m.tech.", "b.e.", "m.e.", "b.sc.", "m.sc.",
                "b.a.", "m.a.", "b.com.", "m.com.", "bs", "ms", "btech", "mtech", "be", "me", "bsc", "msc", "ba", "ma", "bcom", "mcom"
            ]}},
            {"LOWER": {"IN": ["in", "of"]}},
            {"IS_ALPHA": True, "OP": "+"}
        ]
        
    },
    
    {
    "label": "company_name",
    "pattern": [
        # Optional anchor words (prepositions)
        {"LOWER": {"IN": ["software", "global", "international", "services", "consulting", "solutions",
            "technologies", "technology", "systems", "labs", "group", "institute","inc", "ltd", "llc", "corporation", "company", "corp", "pvt", "limited"]}, "OP": "?"},
    ]
       
},
    {
    "label": "technical_skills",
    "pattern": [
       
        {"LOWER": {"IN":["python","java","javascript","c++","c#","ruby","go","swift","kotlin","typescript","sql","kubernetes","docker","c","network security","machine learning","html","css"] }, "OP": "?"},
    ]
       
},
    {
        "label":"soft_skills",
        "pattern":{"LOWER":{"IN":["public speaking","leadership","communication", "teamwork", "adaptability", "problem-solving", "critical thinking", "time management"]}}
    }
    
   
]

ruler.add_patterns(ruler_patterns)

def clean_text(doc):
    # Minimal cleaning: only strip whitespace
    return doc.strip()

def extract_definite_formats(doc,pattern): #extracts text with definite formats using regex pattern recognition
    print(f"[DEBUG] extract_definite_formats: Searching for pattern: {pattern} in doc: {doc[:100]}...")    
    match=re.search(pattern,doc,re.IGNORECASE) #searches for the pattern
    if match:
        matched=match.group(1).strip() #returns entire text including field name
        cleaned_matched = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', matched)
        print(f"[DEBUG] extract_definite_formats: Found match: {cleaned_matched}")
        return cleaned_matched
    
def extract_block(doc, section, aliases=None):
    print(f"[DEBUG] extract_block: Extracting block for section: {section}, aliases: {aliases}")
    # Prepare all possible header names (section + aliases)
    all_labels = [section] + aliases if aliases else [section]
    # Remove colons and lowercase for matching
    all_labels = [label.lower().replace(':', '') for label in all_labels]

    # Build a regex pattern to match any of the headers, allowing for formatting artifacts
    # e.g., whitespace, non-word chars, semicolons, colons, etc.
    header_pattern = r"|".join([rf"[\s\W]*{re.escape(label)}[\s\W]*[:;]?[\s\W]*" for label in all_labels])
    # The next header is any all-caps or Title Case line, possibly with formatting artifacts
    # We'll use a generic pattern for the next header (greedy, but stops at next header or end)
    main_headers = [key.lower().replace(':', '') for key in pattern.keys() if pattern[key]['type'] == 'block']
    main_header_pattern = r"|".join([rf"[\s\W]*{re.escape(h)}[\s\W]*[:;]?" for h in main_headers])
    block_pat = (
        rf"(?im)"
        rf"^({header_pattern})[\s\n]*"  # Match the specific section header
        rf"((?:[\s\S]*?))"  # Capture all content until the next main header
        rf"(?=^({main_header_pattern})\n|\Z)"  # Lookahead for next main header or end
    )
    match = re.search(block_pat, doc, re.DOTALL | re.MULTILINE | re.IGNORECASE)
    if match:
       if match:
        block_content = match.group(2).strip()
        print(f"[DEBUG] extract_block: Block content extracted: {block_content[:100]}...") #debug statements (can be removed later)


        # ---- Clean up bullet points and merge lines ----
        block_lines = block_content.splitlines()

# Merge lines into a single line
        merged = ' '.join(block_lines)

# Remove common bullet characters and dashes
        merged = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219\-\*]+\s*', ' ', merged)

# Remove ANSI escape sequences (color codes and styling)
        merged = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', merged)

# Normalize multiple spaces
        merged = re.sub(r'\s{2,}', ' ', merged)
        print(f"[DEBUG] extract_block: Merged block content: {merged[:100]}...")



        return merged.strip()
    else:
        print(f"[DEBUG] extract_block: No block found for section: {section}")

        return None


def extract_block_content_with_spacy(doc, section, allowed_labels=None, aliases=None):
    print(f"[DEBUG] extract_block_content_with_spacy: Running NER on section: {section[:100]}...")

    if not section:
       print(f"[DEBUG] extract_block_content_with_spacy: No section found.")
       return [] #return empty list if section not found

    content = nlp(section) #classifies the section using spacy
   
    entities = [] #list to store the entities
    for ent in content.ents:
        print(f"[DEBUG] NER found entity: {ent.text} with label: {ent.label_}")

        if allowed_labels is None or not allowed_labels or ent.label_ in allowed_labels:
           entities.append({'text': ent.text, 'label': ent.label_}) #appends the entity to the list
    print(f"[DEBUG] extract_block_content_with_spacy: Entities extracted: {entities}")

    return entities


def extract_name(doc): #extracts the first two lines parsed from resume i.e name (need changes)
    lines=doc.strip().split("\n")
    for line in lines[:2]:
        if line.strip() and len(line.strip()) > 2:
            return line.strip()


    
    

def process_resume(doc, pattern):
    print(f"[DEBUG] process_resume: Starting processing for doc: {doc[:100]}...")

    fields = {}
    for field_name, config in pattern.items():
        print(f"[DEBUG] process_resume: Processing field: {field_name}, type: {config['type']}")

        try:
            if config['type'] == 'regex':
                # Only use regex for these fields
                result = extract_definite_formats(doc, config['pattern'])
                if result:
                    fields[field_name] = result
            elif config['type'] == 'block':
                # Extract block content using header and aliases
                aliases = config.get('aliases', [])
                block_content = extract_block(doc, field_name, aliases)
                if block_content:
                    # Use spaCy NER on the extracted block content
                    ner_results = extract_block_content_with_spacy(block_content, block_content)
                    
                    if ner_results:
                        fields[field_name] = ner_results
            elif config['type'] == 'custom' and field_name == 'candidate_name':
                result = extract_name(doc)
                if result:
                    fields[field_name] = result
        except ValueError as e:
            print(f"[ERROR] Error processing field '{field_name}': {e}")
            continue
    print(f"[DEBUG] process_resume: Final extracted fields: {fields}")

    return fields

def export_function(doc):
    doc=clean_text(doc)
    print(f"[DEBUG] export_function: Cleaned doc: {doc[:100]}...")

    result=process_resume(doc,pattern)
    print(f"[DEBUG] export_function: Processed result: {result}")
    return result

