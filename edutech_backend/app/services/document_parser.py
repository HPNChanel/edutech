import os
import re
from typing import Tuple, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DocumentParserService:
    
    SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown']
    
    @staticmethod
    def is_supported_format(file_path: str) -> bool:
        """Check if the file format is supported for conversion"""
        extension = Path(file_path).suffix.lower()
        return extension in DocumentParserService.SUPPORTED_EXTENSIONS
    
    @staticmethod
    def extract_title_from_filename(filename: str) -> str:
        """Extract a clean title from filename"""
        # Remove file extension
        title = Path(filename).stem
        
        # Replace common separators with spaces
        title = re.sub(r'[_-]+', ' ', title)
        
        # Capitalize words
        title = title.title()
        
        # Clean up extra spaces
        title = re.sub(r'\s+', ' ', title).strip()
        
        return title or "Untitled Document"
    
    @staticmethod
    def read_file_content(file_path: str) -> str:
        """Read and return file content with encoding handling"""
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    return file.read()
            except UnicodeDecodeError:
                continue
            except Exception as e:
                raise Exception(f"Failed to read file: {str(e)}")
        
        raise Exception("Could not decode file with any supported encoding")
    
    @staticmethod
    def generate_summary(content: str, max_sentences: int = 3) -> str:
        """Generate a simple summary from content"""
        if not content or not content.strip():
            return ""
        
        # Remove markdown headers and formatting
        clean_content = re.sub(r'^#+\s*', '', content, flags=re.MULTILINE)
        clean_content = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_content)
        clean_content = re.sub(r'\*([^*]+)\*', r'\1', clean_content)
        clean_content = re.sub(r'`([^`]+)`', r'\1', clean_content)
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', clean_content)
        
        # Filter out empty sentences and get first few
        meaningful_sentences = [
            s.strip() for s in sentences 
            if s.strip() and len(s.strip()) > 10
        ]
        
        if not meaningful_sentences:
            return ""
        
        # Take first few sentences and join
        summary_sentences = meaningful_sentences[:max_sentences]
        summary = '. '.join(summary_sentences)
        
        # Ensure it ends with a period
        if summary and not summary.endswith('.'):
            summary += '.'
        
        return summary[:500]  # Limit length
    
    @staticmethod
    def parse_document(file_path: str, filename: str) -> Tuple[str, str, str]:
        """
        Parse document and extract title, content, and summary
        
        Returns:
            Tuple[title, content, summary]
        """
        if not DocumentParserService.is_supported_format(file_path):
            raise ValueError(f"Unsupported file format: {Path(file_path).suffix}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Extract title from filename
        title = DocumentParserService.extract_title_from_filename(filename)
        
        # Read file content
        content = DocumentParserService.read_file_content(file_path)
        
        if not content.strip():
            raise ValueError("Document content is empty")
        
        # Generate summary
        summary = DocumentParserService.generate_summary(content)
        
        return title, content, summary
    
    @staticmethod
    def _parse_text_file(file_path: str, filename: str) -> Tuple[str, str, str]:
        """Parse plain text or markdown file"""
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # Try with different encoding if UTF-8 fails
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        
        # Extract title from filename or first line
        title = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ').title()
        
        # Try to extract title from content (first heading or first line)
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line:
                # Check for markdown heading
                if line.startswith('#'):
                    title = line.lstrip('#').strip()
                    break
                # Use first non-empty line as title if no heading found
                elif len(line) < 100:  # Reasonable title length
                    title = line
                    break
        
        # Generate simple summary (first few sentences)
        summary = DocumentParserService._generate_summary(content)
        
        return title, content, summary
    
    @staticmethod
    def _parse_html_file(file_path: str, filename: str) -> Tuple[str, str, str]:
        """Parse HTML file (basic implementation)"""
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='latin-1') as f:
                html_content = f.read()
        
        # Very basic HTML parsing - extract text content
        # In a real implementation, you'd use BeautifulSoup or similar
        import re
        
        # Remove script and style elements
        html_content = re.sub(r'<script.*?</script>', '', html_content, flags=re.DOTALL)
        html_content = re.sub(r'<style.*?</style>', '', html_content, flags=re.DOTALL)
        
        # Extract title from <title> tag
        title_match = re.search(r'<title.*?>(.*?)</title>', html_content, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ').title()
        
        # Remove HTML tags to get plain text
        content = re.sub(r'<.*?>', '', html_content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        # Generate summary
        summary = DocumentParserService._generate_summary(content)
        
        return title, content, summary
    
    @staticmethod
    def _parse_generic_file(file_path: str, filename: str) -> Tuple[str, str, str]:
        """Handle unsupported file types"""
        
        title = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ').title()
        content = f"This document ({filename}) was uploaded but requires manual processing for content extraction."
        summary = "Document uploaded successfully. Content extraction not available for this file type."
        
        return title, content, summary
    
    @staticmethod
    def _generate_summary(content: str, max_sentences: int = 3) -> str:
        """Generate a simple summary by taking the first few sentences"""
        
        if not content.strip():
            return "No content available for summary."
        
        # Split into sentences (basic implementation)
        import re
        sentences = re.split(r'[.!?]+', content)
        
        # Clean and filter sentences
        clean_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and len(sentence) > 10:  # Filter out very short fragments
                clean_sentences.append(sentence)
                if len(clean_sentences) >= max_sentences:
                    break
        
        if not clean_sentences:
            # Fallback: take first 200 characters
            return content[:200].strip() + "..." if len(content) > 200 else content
        
        summary = '. '.join(clean_sentences)
        if not summary.endswith('.'):
            summary += '.'
            
        return summary
