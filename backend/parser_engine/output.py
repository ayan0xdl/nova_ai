from . import processing as proc
from . import parser 
import os
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime

file = [] #insert resume filenames
#column names
labels = [
    "Name", "Email", "Phone", "LinkedIn", "portfolio", "address",
    "university", "degree", "graduation_date",'company_name','start_end date','technical_skills','soft_skills'
]

header_label = {    #this dictionary maps the extracted fields to the desired column names in the output
    "candidate_name": "Name",
    "Email": "Email",
    "Phone": "Phone",
    "LinkedIn": "LinkedIn",
    "portfolio": "portfolio",
    "address": "address",
    "education": {
        'university': 'university',
        'degree': 'degree',
        'DATE': 'graduation_date'
    },
    "professional experience":{"company_name": "company_name",'DATE':'start_end date'}, #subcolumns are defined for fields with multiple entities
    "technical skills": {"technical_skills":"technical_skills","soft_skills":"soft_skills"}
    # Add more mappings as needed
}

def fetch_doc(document): #calls the parser to extract text from the document
    doc = parser.get_text(document)
    return doc

def catch_entities(doc): #calls the processing file to extract entities from the text
    doc = proc.export_function(doc)
    return doc

def extract_map(file): #maps the extracted entities to the desired column names
    document = fetch_doc(file)
    classify = catch_entities(document)
    row = {label: "" for label in labels} #initializes a row with empty strings for each label

    # Handle fields
    for key, value in classify.items(): 
        mapped_label = header_label.get(key) #gets the corresponding column name from the header_label dictionary

        if isinstance(mapped_label, dict):
            # Example: education → map entities to subcolumns (university, degree, DATE)
            if isinstance(value, list): #checks if the value is a list of entities (for fields like education or experience)
                for entity in value:
                    text, label = entity['text'], entity['label'] #extracts the text and label from the entity
                    column = mapped_label.get(label) #gets the corresponding subcolumn name
                    if column:
                        row[column] = text #assigns the text to the appropriate subcolumn

        elif mapped_label and isinstance(value, str): #if the value is a single string, directly assign it to the column (for fields like name, email)
            row[mapped_label] = value

        elif mapped_label and isinstance(value, list):
            # Just join multiple extracted values into one cell
            texts = [ent['text'] for ent in value]
            row[mapped_label] = "; ".join(texts)

    return row


if __name__ == "__main__":
    results = [] #list to store the results
    size = len(file)
    if size > 0:
        with ThreadPoolExecutor(max_workers=size) as executor: #uses threading to process multiple resumes in parallel
            future_file = [] #list to store the future objects
            for f in file:
                future_file.append(executor.submit(extract_map, f)) #submits the extract_map function to the executor for each file
            for future in as_completed(future_file):
                results.append(future.result()) #appends the result of each future to the results list

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S") #adds current timestamp to the output file name
        output_file = f"resume_scan_results{timestamp}.xlsx"
        
        combined_df = pd.DataFrame(results, columns=labels)
        combined_df.to_excel(output_file, index=False)
    else:
        print("No files to process.")
