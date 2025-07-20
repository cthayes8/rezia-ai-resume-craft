import { OpenAIService } from './openai.service';
import { CustomSection } from '@/types/resume';

// Enhanced structured schema inspired by Resume-Matcher
export interface StructuredResumeData {
  id: string;
  fileName: string;
  rawContent: string;
  processedData: ProcessedResumeData;
  metadata: ParseMetadata;
}

export interface ProcessedResumeData {
  personalData: PersonalData;
  experiences: Experience[];
  education: Education[];
  skills: SkillsData;
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  extractedKeywords: ExtractedKeyword[];
  summary: string;
  customSections?: CustomSection[];
}

export interface PersonalData {
  name: string;
  email: string;
  phone: string;
  location: Location;
  links: ContactLink[];
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

export interface ContactLink {
  type: 'linkedin' | 'github' | 'website' | 'portfolio' | 'other';
  url: string;
  label?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  location?: Location;
  description: string;
  achievements: string[];
  technologies: string[];
  isCurrentRole: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  location?: Location;
  coursework?: string[];
  honors?: string[];
}

export interface SkillsData {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  languages: string[];
  domains: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  duration?: string;
  highlights: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';
}

export interface ExtractedKeyword {
  term: string;
  category: 'technical_skill' | 'soft_skill' | 'tool' | 'framework' | 'certification' | 'domain' | 'responsibility' | 'industry';
  frequency: number;
  confidence: number;
  context: string[];
}

export interface ParseMetadata {
  parseDate: Date;
  wordCount: number;
  format: 'pdf' | 'docx' | 'txt';
  confidence: number;
  extractionMethod: 'ai' | 'pattern' | 'hybrid';
  processingTime: number;
}

export class EnhancedResumeParserService {
  private openaiService: OpenAIService | null = null;

  constructor() {
    try {
      this.openaiService = new OpenAIService();
    } catch (error) {
      console.warn('OpenAI service not available, will use pattern-based parsing:', error);
      this.openaiService = null;
    }
  }

  async parseResume(file: File): Promise<StructuredResumeData> {
    const startTime = Date.now();
    
    try {
      // Step 1: Extract raw content using MarkItDown-like approach
      const rawContent = await this.extractRawContent(file);
      
      // Step 2: Process content through enhanced extraction pipeline
      const processedData = await this.processResumeContent(rawContent);
      
      // Step 3: Calculate metadata
      const processingTime = Date.now() - startTime;
      const metadata: ParseMetadata = {
        parseDate: new Date(),
        wordCount: rawContent.split(/\s+/).length,
        format: this.getFileFormat(file),
        confidence: this.calculateConfidence(processedData),
        extractionMethod: this.openaiService ? 'ai' : 'pattern',
        processingTime
      };

      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        rawContent,
        processedData,
        metadata
      };
    } catch (error) {
      console.error('Enhanced parsing error:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractRawContent(file: File): Promise<string> {
    try {
      const format = this.getFileFormat(file);
      
      switch (format) {
        case 'pdf':
          return await this.extractFromPDF(file);
        case 'docx':
          return await this.extractFromDOCX(file);
        case 'txt':
          return await file.text();
        default:
          throw new Error('Unsupported file format');
      }
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw new Error('Unable to extract content from file');
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    // Always use pdf2json as it's more reliable in our setup
    return await this.fallbackPDFExtraction(file);
  }

  private async fallbackPDFExtraction(file: File): Promise<string> {
    try {
      const { default: PDFParser } = await import('pdf2json');
      
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // Enable full text mode
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('PDF parsing timeout'));
        }, 15000);
        
        pdfParser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
          try {
            clearTimeout(timeout);
            let extractedText = '';
            
            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              for (const page of pdfData.Pages) {
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const textItem of page.Texts) {
                    if (textItem.R && Array.isArray(textItem.R)) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          try {
                            const decodedText = decodeURIComponent(run.T);
                            extractedText += decodedText + ' ';
                          } catch (decodeError) {
                            // If decoding fails, use raw text
                            extractedText += run.T + ' ';
                          }
                        }
                      }
                    }
                  }
                  extractedText += '\n';
                }
              }
            }
            
            if (extractedText.trim().length < 20) {
              reject(new Error('Insufficient text content extracted from PDF'));
            } else {
              resolve(this.cleanAndNormalizeText(extractedText));
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
        
        pdfParser.on('pdfParser_dataError', (error) => {
          clearTimeout(timeout);
          reject(new Error(`PDF parsing error: ${error}`));
        });
        
        // Convert file to buffer and parse
        file.arrayBuffer()
          .then(arrayBuffer => {
            const buffer = Buffer.from(arrayBuffer);
            pdfParser.parseBuffer(buffer);
          })
          .catch(error => {
            clearTimeout(timeout);
            reject(new Error(`Failed to convert file to buffer: ${error}`));
          });
      });
    } catch (error) {
      throw new Error(`PDF extraction initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromDOCX(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert ArrayBuffer to Buffer for mammoth
      const buffer = Buffer.from(arrayBuffer);
      
      // Extract raw text first (more reliable)
      const textResult = await mammoth.extractRawText({ buffer });
      
      if (textResult.value && textResult.value.trim().length > 20) {
        return this.cleanAndNormalizeText(textResult.value);
      }
      
      // If text extraction fails, try HTML extraction
      const htmlResult = await mammoth.convertToHtml({ buffer });
      
      if (htmlResult.value && htmlResult.value.length > 50) {
        // Simple HTML to text conversion (avoiding turndown dependency)
        const textFromHtml = htmlResult.value
          .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
          .replace(/&nbsp;/g, ' ')   // Replace &nbsp;
          .replace(/&amp;/g, '&')    // Replace &amp;
          .replace(/&lt;/g, '<')     // Replace &lt;
          .replace(/&gt;/g, '>')     // Replace &gt;
          .replace(/\s+/g, ' ')      // Normalize whitespace
          .trim();
        
        if (textFromHtml.length > 20) {
          return this.cleanAndNormalizeText(textFromHtml);
        }
      }
      
      throw new Error('No extractable text found in DOCX file');
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      throw new Error(`Unable to extract content from DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanAndNormalizeText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Preserve section breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Remove unwanted characters but preserve important punctuation
      .replace(/[^\w\s@.,-:()[\]{}|/"']/g, ' ')
      // Clean up multiple spaces again
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async processResumeContent(rawContent: string): Promise<ProcessedResumeData> {
    if (this.openaiService) {
      try {
        return await this.aiEnhancedExtraction(rawContent);
      } catch (error) {
        console.error('AI extraction failed, falling back to pattern-based:', error);
        return this.patternBasedExtraction(rawContent);
      }
    } else {
      return this.patternBasedExtraction(rawContent);
    }
  }

  private async aiEnhancedExtraction(rawContent: string): Promise<ProcessedResumeData> {
    const prompt = `
Analyze this resume text and extract comprehensive structured information. Return a JSON object with the following schema:

{
  "personalData": {
    "name": "Full Name",
    "email": "email@domain.com",
    "phone": "phone number",
    "location": {
      "city": "City",
      "state": "State",
      "country": "Country",
      "address": "Full address if available"
    },
    "links": [
      {
        "type": "linkedin|github|website|portfolio|other",
        "url": "URL",
        "label": "Display label"
      }
    ]
  },
  "experiences": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "Start Date",
      "endDate": "End Date or null if current",
      "location": {"city": "City", "state": "State"},
      "description": "Role description",
      "achievements": ["achievement 1", "achievement 2"],
      "technologies": ["tech1", "tech2"],
      "isCurrentRole": false
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "startDate": "Start Date",
      "endDate": "End Date",
      "gpa": "GPA if mentioned",
      "location": {"city": "City", "state": "State"},
      "coursework": ["course1", "course2"],
      "honors": ["honor1", "honor2"]
    }
  ],
  "skills": {
    "technical": ["technical skills"],
    "soft": ["soft skills"],
    "tools": ["tools and software"],
    "frameworks": ["frameworks"],
    "languages": ["programming languages"],
    "domains": ["domain expertise"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "url": "Project URL if available",
      "duration": "Duration",
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issueDate": "Issue Date",
      "expiryDate": "Expiry Date",
      "credentialId": "ID if available",
      "url": "Verification URL"
    }
  ],
  "languages": [
    {
      "name": "Language Name",
      "proficiency": "native|fluent|professional|intermediate|basic"
    }
  ],
  "extractedKeywords": [
    {
      "term": "keyword",
      "category": "technical_skill|soft_skill|tool|framework|certification|domain|responsibility|industry",
      "frequency": 1,
      "confidence": 0.8,
      "context": ["context where found"]
    }
  ],
  "summary": "Professional summary or objective"
}

Resume Content:
${rawContent}

Extract as much information as possible. Use empty arrays/objects for missing sections. Ensure all dates are in a consistent format.
    `;

    const structuredData = await this.openaiService!.extractStructuredData(prompt);
    return this.validateAndNormalizeData(structuredData);
  }

  private patternBasedExtraction(rawContent: string): ProcessedResumeData {
    const lines = rawContent.split('\n').filter(line => line.trim());
    
    // Extract contact information
    const personalData = this.extractPersonalData(rawContent);
    
    // Extract sections using pattern matching
    const sections = this.detectSections(rawContent);
    
    // Extract experiences
    const experiences = this.extractExperiences(sections.experience || '');
    
    // Extract education
    const education = this.extractEducation(sections.education || '');
    
    // Extract skills
    const skills = this.extractSkills(sections.skills || rawContent);
    
    // Extract projects
    const projects = this.extractProjects(sections.projects || '');
    
    // Extract keywords
    const extractedKeywords = this.extractKeywords(rawContent);

    // Extract custom sections
    const customSections = this.extractCustomSections(sections);

    return {
      personalData,
      experiences,
      education,
      skills,
      projects,
      certifications: this.extractCertificationsFromText(sections.certifications || ''),
      languages: this.extractLanguagesFromText(sections.languages || ''),
      extractedKeywords,
      summary: sections.summary || this.extractSummary(rawContent),
      customSections
    };
  }

  private extractPersonalData(content: string): PersonalData {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9-]+)/i;
    const githubRegex = /(?:github\.com\/)([a-zA-Z0-9-]+)/i;
    const websiteRegex = /(https?:\/\/[^\s]+)/g;
    
    const email = content.match(emailRegex)?.[0] || '';
    const phone = content.match(phoneRegex)?.[0] || '';
    const linkedinMatch = content.match(linkedinRegex);
    const githubMatch = content.match(githubRegex);
    const websites = content.match(websiteRegex) || [];
    
    // Extract name (heuristic: usually first meaningful line)
    const lines = content.split('\n').filter(line => line.trim());
    let name = '';
    
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.includes('@') && 
          !trimmed.match(phoneRegex) && 
          !trimmed.toLowerCase().includes('resume') &&
          trimmed.length > 2 && 
          trimmed.length < 50) {
        name = trimmed;
        break;
      }
    }

    const links: ContactLink[] = [];
    
    if (linkedinMatch) {
      links.push({
        type: 'linkedin',
        url: `https://linkedin.com/in/${linkedinMatch[1]}`,
        label: 'LinkedIn'
      });
    }
    
    if (githubMatch) {
      links.push({
        type: 'github',
        url: `https://github.com/${githubMatch[1]}`,
        label: 'GitHub'
      });
    }
    
    websites.forEach(url => {
      if (!url.includes('linkedin.com') && !url.includes('github.com')) {
        links.push({
          type: 'website',
          url,
          label: 'Website'
        });
      }
    });

    return {
      name,
      email,
      phone,
      location: this.extractLocation(content),
      links
    };
  }

  private extractLocation(content: string): Location {
    // Pattern for city, state format
    const cityStateRegex = /([A-Za-z\s]+),\s*([A-Z]{2})\b/;
    const match = content.match(cityStateRegex);
    
    if (match) {
      return {
        city: match[1].trim(),
        state: match[2].trim()
      };
    }
    
    return {};
  }

  private detectSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionHeaders = {
      experience: /(?:work\s+)?experience|employment|professional\s+experience|career\s+history/i,
      education: /education|academic\s+background|qualifications|schooling/i,
      skills: /skills|technical\s+skills|competencies|expertise|technologies/i,
      projects: /projects|portfolio|personal\s+projects|side\s+projects/i,
      summary: /summary|objective|profile|about|overview/i,
      certifications: /certifications?|licenses?|credentials?|training/i,
      languages: /languages?|linguistic\s+skills/i,
      awards: /awards?|honors?|achievements?|recognition/i,
      publications: /publications?|papers?|articles?|research/i,
      volunteer: /volunteer|volunteering|community\s+service|social\s+work/i,
      interests: /interests?|hobbies|personal\s+interests?|activities/i,
      references: /references?|referees?/i
    };
    
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (currentSection) {
          currentContent += line + '\n';
        }
        continue;
      }
      
      // Check if this line is a section header
      let foundSection = '';
      for (const [section, regex] of Object.entries(sectionHeaders)) {
        if (regex.test(trimmedLine) && trimmedLine.length < 50) {
          foundSection = section;
          break;
        }
      }
      
      if (foundSection) {
        // Save previous section
        if (currentSection && currentContent.trim()) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = foundSection;
        currentContent = '';
      } else if (currentSection) {
        currentContent += line + '\n';
      } else {
        // Check if this could be a custom section header
        // Headers are typically short, often all caps or title case, and don't contain common sentence patterns
        if (this.isLikelyCustomSectionHeader(trimmedLine)) {
          // Save any existing unassigned content as a custom section
          if (currentContent.trim()) {
            const customSectionName = this.generateCustomSectionName(currentContent);
            sections[customSectionName] = currentContent.trim();
            currentContent = '';
          }
          
          // Start new custom section
          const customSectionId = this.sanitizeSectionName(trimmedLine);
          currentSection = customSectionId;
          currentContent = '';
        } else {
          currentContent += line + '\n';
        }
      }
    }
    
    // Save last section
    if (currentSection && currentContent.trim()) {
      sections[currentSection] = currentContent.trim();
    }
    
    // Handle any remaining unassigned content
    if (!currentSection && currentContent.trim()) {
      sections['additional_info'] = currentContent.trim();
    }
    
    return sections;
  }

  private isLikelyCustomSectionHeader(line: string): boolean {
    // Skip if too long (likely not a header)
    if (line.length > 60) return false;
    
    // Skip if contains common sentence indicators
    if (/\.|,|;|:/.test(line)) return false;
    
    // Skip if contains common resume content words
    if (/\b(the|and|or|at|in|on|for|with|to|from|by|of)\b/i.test(line)) return false;
    
    // Skip if looks like a date or location
    if (/\d{4}|\d{1,2}\/\d{1,2}|\w+,\s*\w+/i.test(line)) return false;
    
    // Skip if looks like contact info
    if (/@|phone|email|linkedin|github/i.test(line)) return false;
    
    // Likely a header if:
    // - All caps
    // - Title case
    // - Contains relevant keywords
    const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
    const isTitleCase = /^[A-Z][a-z]*(\s+[A-Z][a-z]*)*$/.test(line);
    const hasRelevantKeywords = /awards?|honors?|publications?|volunteer|activities|interests?|additional|other|miscellaneous/i.test(line);
    
    return isAllCaps || isTitleCase || hasRelevantKeywords;
  }

  private sanitizeSectionName(header: string): string {
    return header.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30); // Limit length
  }

  private generateCustomSectionName(content: string): string {
    const firstWords = content.trim().split(/\s+/).slice(0, 3).join('_');
    return `custom_${this.sanitizeSectionName(firstWords)}`;
  }

  private extractExperiences(experienceText: string): Experience[] {
    if (!experienceText.trim()) return [];
    
    const experiences: Experience[] = [];
    // Enhanced extraction to capture achievements/bullet points
    const jobEntries = experienceText.split(/(?=\n\s*[A-Z][^a-z]*(?:,|\n))/);
    
    for (const entry of jobEntries) {
      if (entry.trim().length < 20) continue;
      
      const lines = entry.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) continue;
      
      // Extract achievements/bullet points
      const achievements: string[] = [];
      const bulletRegex = /^\s*[•·*-]\s*(.+)/;
      const numberedRegex = /^\s*\d+[\.)]\s*(.+)/;
      
      let description = '';
      
      for (const line of lines) {
        const bulletMatch = line.match(bulletRegex);
        const numberedMatch = line.match(numberedRegex);
        
        if (bulletMatch) {
          achievements.push(bulletMatch[1].trim());
        } else if (numberedMatch) {
          achievements.push(numberedMatch[1].trim());
        } else if (line.length > 30 && !line.includes('@') && !line.includes('•')) {
          // Likely a description line if it's long enough and doesn't contain email or bullets
          if (description) {
            description += ' ' + line.trim();
          } else {
            description = line.trim();
          }
        }
      }
      
      // Extract basic info (simplified but improved)
      const experience: Experience = {
        company: this.extractCompanyFromEntry(entry),
        position: this.extractPositionFromEntry(entry),
        startDate: this.extractStartDateFromEntry(entry),
        endDate: this.extractEndDateFromEntry(entry),
        description: description || entry.split('\n')[0] || '',
        achievements: achievements,
        technologies: this.extractTechnologiesFromEntry(entry),
        isCurrentRole: this.checkIfCurrentRole(entry)
      };
      
      experiences.push(experience);
    }
    
    return experiences;
  }
  
  private extractCompanyFromEntry(entry: string): string {
    // Try to find company name patterns
    const lines = entry.split('\n').filter(l => l.trim());
    // Look for patterns like "Company Name | Position" or "Position at Company Name"
    for (const line of lines) {
      const atMatch = line.match(/(.+)\s+at\s+(.+?)(?:\s*\||\s*,|\s*$)/i);
      if (atMatch) return atMatch[2].trim();
      
      const pipeMatch = line.match(/(.+?)\s*\|\s*(.+)/);
      if (pipeMatch && pipeMatch[1].length > 3) return pipeMatch[1].trim();
    }
    return '';
  }
  
  private extractPositionFromEntry(entry: string): string {
    const lines = entry.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const atMatch = line.match(/(.+)\s+at\s+(.+)/i);
      if (atMatch) return atMatch[1].trim();
      
      const pipeMatch = line.match(/(.+?)\s*\|\s*(.+)/);
      if (pipeMatch && pipeMatch[2].length > 3) return pipeMatch[2].trim();
    }
    return '';
  }
  
  private extractStartDateFromEntry(entry: string): string {
    const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\b\d{1,2}\/\d{4}\b|\b\d{4}\b/i;
    const match = entry.match(dateRegex);
    return match ? match[0] : '';
  }
  
  private extractEndDateFromEntry(entry: string): string {
    // Look for patterns like "Jan 2020 - Dec 2022" or "01/2020 - 12/2022"
    const rangeRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current)/i;
    const match = entry.match(rangeRegex);
    if (match && !match[1].toLowerCase().includes('present') && !match[1].toLowerCase().includes('current')) {
      return match[1];
    }
    return '';
  }
  
  private extractTechnologiesFromEntry(entry: string): string[] {
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Jenkins', 'CI/CD',
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST'
    ];
    
    const foundTech = techKeywords.filter(tech => 
      entry.toLowerCase().includes(tech.toLowerCase())
    );
    
    return foundTech;
  }
  
  private checkIfCurrentRole(entry: string): boolean {
    return /present|current/i.test(entry);
  }

  private extractEducation(educationText: string): Education[] {
    // Simplified education extraction
    if (!educationText.trim()) return [];
    
    return [{
      institution: '',
      degree: '',
      field: ''
    }];
  }

  private extractSkills(skillsText: string): SkillsData {
    const skillKeywords = {
      technical: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'HTML', 'CSS'],
      tools: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Azure', 'Jira', 'Slack'],
      frameworks: ['React', 'Angular', 'Vue', 'Express', 'Django', 'Spring', 'Flask'],
      languages: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Go', 'Rust', 'C#']
    };
    
    const foundSkills: SkillsData = {
      technical: [],
      soft: [],
      tools: [],
      frameworks: [],
      languages: [],
      domains: []
    };
    
    const lowerContent = skillsText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(skillKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          (foundSkills as any)[category].push(keyword);
        }
      }
    }
    
    return foundSkills;
  }

  private extractProjects(_projectsText: string): Project[] {
    // Simplified project extraction
    return [];
  }

  private extractSummary(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Look for summary-like content in the first few lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 50 && line.length < 500 && !line.includes('@')) {
        return line;
      }
    }
    
    return '';
  }

  private extractKeywords(content: string): ExtractedKeyword[] {
    const keywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 
      'Leadership', 'Project Management', 'Agile', 'Scrum'
    ];
    
    return keywords
      .filter(keyword => content.toLowerCase().includes(keyword.toLowerCase()))
      .map(keyword => ({
        term: keyword,
        category: 'technical_skill' as const,
        frequency: 1,
        confidence: 0.7,
        context: []
      }));
  }

  private extractCustomSections(sections: Record<string, string>): CustomSection[] {
    const customSections: CustomSection[] = [];
    const standardSections = ['experience', 'education', 'skills', 'projects', 'summary', 'certifications', 'languages'];
    
    for (const [sectionName, content] of Object.entries(sections)) {
      if (!standardSections.includes(sectionName) && content.trim()) {
        // Generate a proper title from the section name
        const title = this.formatSectionTitle(sectionName);
        
        customSections.push({
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          title,
          content: content.trim(),
          items: []
        });
      }
    }
    
    return customSections;
  }

  private formatSectionTitle(sectionName: string): string {
    return sectionName
      .replace(/^custom_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private extractCertificationsFromText(certificationsText: string): Certification[] {
    if (!certificationsText.trim()) return [];
    
    const certifications: Certification[] = [];
    const lines = certificationsText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5) { // Skip very short lines
        // Try to parse certification with issuer and date
        const match = trimmed.match(/^(.+?)\s*[-–—]\s*(.+?)\s*[-–—]?\s*(\d{4})?/);
        
        if (match) {
          certifications.push({
            name: match[1].trim(),
            issuer: match[2].trim(),
            date: match[3] || undefined
          });
        } else {
          // Fallback: just use the line as certification name
          certifications.push({
            name: trimmed,
            issuer: '',
            date: ''
          });
        }
      }
    }
    
    return certifications;
  }

  private extractLanguagesFromText(languagesText: string): Language[] {
    if (!languagesText.trim()) return [];
    
    const languages: Language[] = [];
    const lines = languagesText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 2) {
        // Try to parse language with proficiency
        const match = trimmed.match(/^(.+?)\s*[-–—:]\s*(.+)$/);
        
        if (match) {
          languages.push({
            name: match[1].trim(),
            fluency: match[2].trim()
          });
        } else {
          // Just language name, assume native/fluent
          languages.push({
            name: trimmed,
            fluency: 'Professional'
          });
        }
      }
    }
    
    return languages;
  }

  private validateAndNormalizeData(data: Record<string, unknown>): ProcessedResumeData {
    return {
      personalData: {
        name: (data.personalData as Record<string, unknown>)?.name as string || '',
        email: (data.personalData as Record<string, unknown>)?.email as string || '',
        phone: (data.personalData as Record<string, unknown>)?.phone as string || '',
        location: (data.personalData as Record<string, unknown>)?.location as Location || {},
        links: Array.isArray((data.personalData as Record<string, unknown>)?.links) ? (data.personalData as Record<string, unknown>).links as ContactLink[] : []
      },
      experiences: Array.isArray(data.experiences) ? (data.experiences as Array<Record<string, unknown>>).map((exp) => ({
        company: exp.company as string || '',
        position: exp.position as string || '',
        startDate: exp.startDate as string || '',
        endDate: exp.endDate as string || '',
        location: exp.location as Location || {},
        description: exp.description as string || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements as string[] : [],
        technologies: Array.isArray(exp.technologies) ? exp.technologies as string[] : [],
        isCurrentRole: Boolean(exp.isCurrentRole)
      })) : [],
      education: Array.isArray(data.education) ? (data.education as Array<Record<string, unknown>>).map((edu) => ({
        institution: edu.institution as string || '',
        degree: edu.degree as string || '',
        field: edu.field as string || '',
        startDate: edu.startDate as string || '',
        endDate: edu.endDate as string || '',
        gpa: edu.gpa as string || undefined,
        location: edu.location as Location || {},
        coursework: Array.isArray(edu.coursework) ? edu.coursework as string[] : [],
        honors: Array.isArray(edu.honors) ? edu.honors as string[] : []
      })) : [],
      skills: {
        technical: Array.isArray((data.skills as Record<string, unknown>)?.technical) ? (data.skills as Record<string, unknown>).technical as string[] : [],
        soft: Array.isArray((data.skills as Record<string, unknown>)?.soft) ? (data.skills as Record<string, unknown>).soft as string[] : [],
        tools: Array.isArray((data.skills as Record<string, unknown>)?.tools) ? (data.skills as Record<string, unknown>).tools as string[] : [],
        frameworks: Array.isArray((data.skills as Record<string, unknown>)?.frameworks) ? (data.skills as Record<string, unknown>).frameworks as string[] : [],
        languages: Array.isArray((data.skills as Record<string, unknown>)?.languages) ? (data.skills as Record<string, unknown>).languages as string[] : [],
        domains: Array.isArray((data.skills as Record<string, unknown>)?.domains) ? (data.skills as Record<string, unknown>).domains as string[] : []
      },
      projects: Array.isArray(data.projects) ? (data.projects as Array<Record<string, unknown>>).map((proj) => ({
        name: proj.name as string || '',
        description: proj.description as string || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies as string[] : [],
        url: proj.url as string || undefined,
        duration: proj.duration as string || undefined,
        highlights: Array.isArray(proj.highlights) ? proj.highlights as string[] : []
      })) : [],
      certifications: Array.isArray(data.certifications) ? (data.certifications as Array<Record<string, unknown>>).map((cert) => ({
        name: cert.name as string || '',
        issuer: cert.issuer as string || '',
        issueDate: cert.issueDate as string || undefined,
        expiryDate: cert.expiryDate as string || undefined,
        credentialId: cert.credentialId as string || undefined,
        url: cert.url as string || undefined
      })) : [],
      languages: Array.isArray(data.languages) ? (data.languages as Array<Record<string, unknown>>).map((lang) => ({
        name: lang.name as string || '',
        proficiency: (['native', 'fluent', 'professional', 'intermediate', 'basic'].includes(lang.proficiency as string) 
          ? lang.proficiency as Language['proficiency'] 
          : 'basic')
      })) : [],
      extractedKeywords: Array.isArray(data.extractedKeywords) ? (data.extractedKeywords as Array<Record<string, unknown>>).map((kw) => ({
        term: kw.term as string || '',
        category: (['technical_skill', 'soft_skill', 'tool', 'framework', 'certification', 'domain', 'responsibility', 'industry'].includes(kw.category as string)
          ? kw.category as ExtractedKeyword['category']
          : 'technical_skill'),
        frequency: (kw.frequency as number) || 1,
        confidence: (kw.confidence as number) || 0.5,
        context: Array.isArray(kw.context) ? kw.context as string[] : []
      })) : [],
      summary: data.summary as string || ''
    };
  }

  private getFileFormat(file: File): 'pdf' | 'docx' | 'txt' {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    return 'txt';
  }

  private calculateConfidence(data: ProcessedResumeData): number {
    let confidence = 0;
    
    // Contact information (40 points max)
    if (data.personalData.name) confidence += 15;
    if (data.personalData.email) confidence += 15;
    if (data.personalData.phone) confidence += 10;
    
    // Professional content (60 points max)
    if (data.experiences.length > 0) confidence += 25;
    if (data.education.length > 0) confidence += 15;
    if (data.skills.technical.length > 0) confidence += 10;
    if (data.extractedKeywords.length > 0) confidence += 10;
    
    return Math.min(confidence, 100);
  }
}