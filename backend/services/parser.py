import re
import io
import pypdf

class ResumeParser:
    def __init__(self):
        # Compiling regex patterns for PII sanitization
        # Email
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        # Phone numbers (generic international and US formats)
        self.phone_pattern = re.compile(r'(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}')
        # URL/Links (optional, but sometimes contain PII or social profiles) -> keeping for now, maybe sanitize if needed.
        
    def sanitize(self, text: str) -> str:
        text = self.email_pattern.sub("[EMAIL REDACTED]", text)
        text = self.phone_pattern.sub("[PHONE REDACTED]", text)
        return text

    async def parse(self, file_content: bytes) -> str:
        """
        Extracts text from PDF bytes and sanitizes PII.
        """
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            cleaned_text = self.sanitize(text)
            return cleaned_text
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            return ""

parser = ResumeParser()
