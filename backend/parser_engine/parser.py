from pdfminer.high_level import extract_text as pdf_extract_text #library to parse pdf
import os #to find files
from docx import Document #library to parse word documents

def get_text(filepath):
    _,extension=os.path.splitext(filepath) #divides the filepath string to find extension
    extension=extension.lower() #supports .PDF and .pdf
    try:
        if extension=='.pdf': #parses pdf
            text=pdf_extract_text(filepath) 
            return text
        elif extension=='.docx': #parses docx 
            doc=Document(filepath)
            text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except ValueError:
        print("unsupported file. only pdfs and docx files are supported")
              
