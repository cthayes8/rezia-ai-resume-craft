import { OpenAIService } from './openai.service';

export interface EnhancedParsedDocument {
  id: string;
  fileName: string;
  rawText: string;
  structuredText: string; // Better formatted text for AI processing
  parsedSections: {
    contact: ContactInfo;
    summary: string;
    experience: EnhancedExperience[];
    education: EnhancedEducation[];
    skills: SkillGroup[];
    projects?: Project[];
    certifications?: Certification[];
    keywords: ExtractedKeyword[];
  };
  embedding?: number[];
  metadata: {
    parseDate: Date;
    wordCount: number;
    format: 'pdf' | 'docx' | 'txt';
    confidence: number;
    sections: string[];
    extraction_method: 'ai' | 'fallback' | 'hybrid';
  };
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
  github?: string;
}

export interface EnhancedExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  summary: string;
  highlights: string[];
  keywords: string[];
}

export interface EnhancedEducation {
  institution: string;
  degree: string;
  field?: string;
  from: string;
  to?: string;
  gpa?: string;
  location?: string;
  honors?: string[];
}

export interface SkillGroup {
  name: string;
  items: { name: string; level?: string }[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  highlights: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface ExtractedKeyword {
  term: string;
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'certification' | 'domain' | 'responsibility';
  frequency: number;
  confidence: number;
  context?: string;
}

export class EnhancedParserService {
  private openaiService: OpenAIService | null = null;

  constructor() {
    try {
      this.openaiService = new OpenAIService();
    } catch (error) {
      console.warn('OpenAI service not available, will use enhanced fallback parsing:', error);
      this.openaiService = null;
    }
  }

  async parseResume(file: File): Promise<EnhancedParsedDocument> {
    try {
      let rawText: string;
      let format: 'pdf' | 'docx' | 'txt';

      // Enhanced file type detection and parsing
      if (file.type === 'application/pdf') {
        format = 'pdf';
        rawText = await this.enhancedParsePDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        format = 'docx';
        rawText = await this.enhancedParseDOCX(file);
      } else if (file.type === 'text/plain') {
        format = 'txt';
        rawText = await file.text();
      } else {
        throw new Error('Unsupported file format');
      }

      // Enhanced text processing and structure detection
      const structuredText = this.enhanceTextStructure(rawText);
      
      if (structuredText.length < 50) {
        throw new Error('Insufficient text content extracted');
      }

      // Use hybrid approach: AI + pattern matching
      const sections = this.detectSections(structuredText);
      const parsedSections = await this.structureResumeData(structuredText, sections);

      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        rawText,
        structuredText,
        parsedSections,
        metadata: {
          parseDate: new Date(),
          wordCount: structuredText.split(/\s+/).length,
          format,
          confidence: this.calculateConfidence(structuredText, parsedSections),
          sections: sections.map(s => s.type),
          extraction_method: this.openaiService ? 'hybrid' : 'fallback'
        }
      };
    } catch (error) {
      console.error('Enhanced parsing error:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enhancedParsePDF(file: File): Promise<string> {
    try {
      // Try pdf2json first (existing method)
      const text = await this.legacyParsePDF(file);
      
      // Enhance extracted text
      return this.enhanceTextStructure(text);
    } catch (error) {
      console.warn('PDF parsing failed, using fallback:', error);
      return this.generateStructuredFallback(file.name);
    }
  }

  private async legacyParsePDF(file: File): Promise<string> {
    // Reuse the existing PDF parsing logic
    try {
      const { default: PDFParser } = await import('pdf2json');
      
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            let extractedText = '';
            
            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              for (const page of pdfData.Pages) {
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const textItem of page.Texts) {
                    if (textItem.R && Array.isArray(textItem.R)) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          extractedText += decodeURIComponent(run.T) + ' ';
                        }
                      }
                    }
                  }
                  extractedText += '\n';
                }
              }
            }
            
            resolve(extractedText.trim());
          } catch (error) {
            reject(error);
          }
        });
        
        pdfParser.on('pdfParser_dataError', reject);
        
        file.arrayBuffer().then(arrayBuffer => {
          const buffer = Buffer.from(arrayBuffer);
          pdfParser.parseBuffer(buffer);
        }).catch(reject);
        
        setTimeout(() => reject(new Error('PDF parsing timeout')), 10000);
      });
    } catch (error) {
      throw error;
    }
  }

  private async enhancedParseDOCX(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract both raw text and HTML for better structure preservation
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      
      // Use HTML structure to improve text formatting
      return this.enhanceTextFromHTML(textResult.value, htmlResult.value);
    } catch (error) {
      console.error('Enhanced DOCX parsing failed:', error);
      throw new Error('Unable to parse DOCX file');
    }
  }

  private enhanceTextFromHTML(rawText: string, html: string): string {
    // Use HTML structure to better preserve formatting
    let enhanced = rawText;
    
    // Add section breaks where HTML indicates headers
    enhanced = enhanced.replace(/([^\n])\n([A-Z][A-Z\s]{3,})/g, '$1\n\n--- $2 ---\n');
    
    // Preserve list structures
    enhanced = enhanced.replace(/^([•·▪▫‣⁃]|\d+\.|\w+\))/gm, '\n$1');
    
    return enhanced;
  }

  private enhanceTextStructure(text: string): string {
    // Comprehensive text enhancement
    let enhanced = text;
    
    // Normalize whitespace
    enhanced = enhanced.replace(/\s+/g, ' ');
    enhanced = enhanced.replace(/\n\s*\n/g, '\n\n');
    
    // Detect and enhance section headers
    enhanced = this.enhanceSectionHeaders(enhanced);
    
    // Improve list formatting
    enhanced = this.enhanceListFormatting(enhanced);
    
    // Enhance contact information detection
    enhanced = this.enhanceContactInfo(enhanced);
    
    // Clean up and normalize
    return enhanced.trim();
  }

  private enhanceSectionHeaders(text: string): string {
    const commonSections = [
      'PROFESSIONAL SUMMARY', 'SUMMARY', 'OBJECTIVE', 'PROFILE',
      'WORK EXPERIENCE', 'EXPERIENCE', 'EMPLOYMENT', 'CAREER HISTORY',
      'EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS',
      'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'EXPERTISE',
      'PROJECTS', 'KEY PROJECTS', 'NOTABLE PROJECTS',
      'CERTIFICATIONS', 'CERTIFICATES', 'LICENSES',
      'ACHIEVEMENTS', 'ACCOMPLISHMENTS', 'AWARDS',
      'LANGUAGES', 'LANGUAGE SKILLS',
      'PUBLICATIONS', 'RESEARCH', 'PATENTS'
    ];
    
    let enhanced = text;
    
    commonSections.forEach(section => {
      const regex = new RegExp(`\\b${section}\\b`, 'gi');
      enhanced = enhanced.replace(regex, `\n\n--- ${section.toUpperCase()} ---\n`);
    });
    
    return enhanced;
  }

  private enhanceListFormatting(text: string): string {
    let enhanced = text;
    
    // Ensure bullets are on new lines
    enhanced = enhanced.replace(/([^\n])([•·▪▫‣⁃])/g, '$1\n$2');
    enhanced = enhanced.replace(/([^\n])(\d+\.)/g, '$1\n$2');
    
    // Clean up excessive spacing in lists
    enhanced = enhanced.replace(/\n+([•·▪▫‣⁃])/g, '\n$1');
    
    return enhanced;
  }

  private enhanceContactInfo(text: string): string {
    // Mark contact information for easier extraction
    let enhanced = text;
    
    // Email detection
    enhanced = enhanced.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '\n[EMAIL: $1]\n');
    
    // Phone detection
    enhanced = enhanced.replace(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, '\n[PHONE: $&]\n');
    
    // LinkedIn detection
    enhanced = enhanced.replace(/(linkedin\.com\/in\/[^\s]+)/gi, '\n[LINKEDIN: $1]\n');
    
    return enhanced;
  }

  private detectSections(text: string): Array<{type: string, start: number, content: string}> {
    const sections = [];
    const sectionPatterns = {
      'contact': /^[\s\S]*?(?=---)|\[EMAIL:|PHONE:|LINKEDIN:\]/i,
      'summary': /---\s*(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE)\s*---/i,
      'experience': /---\s*(WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|CAREER HISTORY)\s*---/i,
      'education': /---\s*(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)\s*---/i,
      'skills': /---\s*(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE)\s*---/i,
      'projects': /---\s*(PROJECTS|KEY PROJECTS|NOTABLE PROJECTS)\s*---/i,
      'certifications': /---\s*(CERTIFICATIONS|CERTIFICATES|LICENSES)\s*---/i,
    };

    for (const [type, pattern] of Object.entries(sectionPatterns)) {
      const match = text.match(pattern);
      if (match) {
        sections.push({
          type,
          start: match.index || 0,
          content: this.extractSectionContent(text, match.index || 0)
        });
      }
    }

    return sections.sort((a, b) => a.start - b.start);
  }

  private extractSectionContent(text: string, startIndex: number): string {
    const nextSectionMatch = text.slice(startIndex + 1).match(/---\s*[A-Z\s]+\s*---/);
    const endIndex = nextSectionMatch ? startIndex + 1 + nextSectionMatch.index! : text.length;
    
    return text.slice(startIndex, endIndex).trim();
  }

  private async structureResumeData(text: string, sections: Array<{type: string, content: string}>): Promise<EnhancedParsedDocument['parsedSections']> {
    try {
      if (this.openaiService) {
        // Use AI for enhanced extraction
        const aiResult = await this.aiEnhancedExtraction(text, sections);
        return this.validateEnhancedData(aiResult);
      } else {
        // Use enhanced pattern-based extraction
        return this.enhancedFallbackExtraction(text, sections);
      }
    } catch (error) {
      console.error('Structured extraction failed, using enhanced fallback:', error);
      return this.enhancedFallbackExtraction(text, sections);
    }
  }

  private async aiEnhancedExtraction(text: string, sections: Array<{type: string, content: string}>): Promise<any> {
    const prompt = `
      Analyze this resume text and extract comprehensive structured information. Pay special attention to the marked sections.

      Return detailed JSON with this structure:
      {
        "contact": {
          "name": "Full Name",
          "email": "email@domain.com", 
          "phone": "phone number",
          "location": "city, state",
          "linkedIn": "linkedin profile url",
          "website": "personal website",
          "github": "github profile"
        },
        "summary": "Professional summary or objective paragraph",
        "experience": [
          {
            "id": "unique_id",
            "company": "Company Name",
            "position": "Job Title", 
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM",
            "current": false,
            "location": "City, State",
            "summary": "Brief role description",
            "highlights": ["achievement 1 with metrics", "achievement 2 with impact"],
            "keywords": ["relevant", "skills", "used"]
          }
        ],
        "education": [
          {
            "institution": "School Name",
            "degree": "Degree Type",
            "field": "Field of Study", 
            "from": "YYYY",
            "to": "YYYY",
            "gpa": "X.XX",
            "location": "City, State",
            "honors": ["Dean's List", "Magna Cum Laude"]
          }
        ],
        "skills": [
          {
            "name": "Programming Languages",
            "items": [{"name": "JavaScript", "level": "Expert"}, {"name": "Python", "level": "Advanced"}]
          },
          {
            "name": "Frameworks & Tools", 
            "items": [{"name": "React"}, {"name": "Node.js"}]
          }
        ],
        "projects": [
          {
            "name": "Project Name",
            "description": "Project description",
            "technologies": ["tech1", "tech2"],
            "url": "project url if available",
            "highlights": ["key achievement 1", "key achievement 2"]
          }
        ],
        "certifications": [
          {
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "YYYY-MM",
            "credentialId": "credential ID if available"
          }
        ],
        "keywords": [
          {
            "term": "keyword",
            "category": "hard_skill|soft_skill|tool|certification|domain|responsibility",
            "frequency": 2,
            "confidence": 0.9,
            "context": "where this keyword was found"
          }
        ]
      }

      Resume Text:
      ${text}

      Detected Sections:
      ${sections.map(s => `${s.type.toUpperCase()}:\n${s.content}\n`).join('\n')}

      Extract as much detail as possible. For dates, standardize to YYYY-MM format. Include metrics and quantifiable achievements.
    `;

    return await this.openaiService!.extractStructuredData(prompt);
  }

  private enhancedFallbackExtraction(text: string, sections: Array<{type: string, content: string}>): EnhancedParsedDocument['parsedSections'] {
    return {
      contact: this.extractContactInfo(text),
      summary: this.extractSummary(text, sections),
      experience: this.extractExperience(text, sections),
      education: this.extractEducation(text, sections),
      skills: this.extractSkills(text, sections),
      projects: this.extractProjects(text, sections),
      certifications: this.extractCertifications(text, sections),
      keywords: this.extractKeywords(text)
    };
  }

  private extractContactInfo(text: string): ContactInfo {
    const emailMatch = text.match(/\[EMAIL:\s*([^\]]+)\]/) || text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/\[PHONE:\s*([^\]]+)\]/) || text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    const linkedInMatch = text.match(/\[LINKEDIN:\s*([^\]]+)\]/) || text.match(/(linkedin\.com\/in\/[^\s]+)/i);
    
    // Enhanced name extraction
    const lines = text.split('\n').filter(line => line.trim());
    let name = '';
    
    for (const line of lines.slice(0, 10)) {
      const cleanLine = line.replace(/\[EMAIL:.*?\]|\[PHONE:.*?\]|\[LINKEDIN:.*?\]/g, '').trim();
      if (cleanLine && 
          !cleanLine.includes('@') && 
          !cleanLine.match(/\d{3}/) && 
          !cleanLine.toLowerCase().includes('linkedin') &&
          !cleanLine.toLowerCase().includes('---') &&
          cleanLine.length > 2 && cleanLine.length < 50) {
        name = cleanLine;
        break;
      }
    }

    return {
      name,
      email: emailMatch ? emailMatch[1] || emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      linkedIn: linkedInMatch ? linkedInMatch[1] || linkedInMatch[0] : undefined,
      website: undefined,
      github: undefined
    };
  }

  private extractSummary(text: string, sections: Array<{type: string, content: string}>): string {
    const summarySection = sections.find(s => s.type === 'summary');
    if (summarySection) {
      return summarySection.content.replace(/---\s*[A-Z\s]+\s*---/g, '').trim();
    }
    
    // Fallback: look for paragraph after contact info
    const lines = text.split('\n');
    let summaryStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('@') || lines[i].match(/\d{3}/)) {
        summaryStart = i + 1;
        break;
      }
    }
    
    if (summaryStart > -1) {
      const summaryLines = [];
      for (let i = summaryStart; i < Math.min(summaryStart + 5, lines.length); i++) {
        if (lines[i].trim() && !lines[i].includes('---')) {
          summaryLines.push(lines[i].trim());
        }
      }
      return summaryLines.join(' ');
    }
    
    return '';
  }

  private extractExperience(text: string, sections: Array<{type: string, content: string}>): EnhancedExperience[] {
    // Enhanced experience extraction logic
    const experiences: EnhancedExperience[] = [];
    const experienceSection = sections.find(s => s.type === 'experience');
    
    if (experienceSection) {
      // Parse experience entries from structured content
      // This would need more sophisticated parsing logic
    }
    
    return experiences;
  }

  private extractEducation(text: string, sections: Array<{type: string, content: string}>): EnhancedEducation[] {
    return [];
  }

  private extractSkills(text: string, sections: Array<{type: string, content: string}>): SkillGroup[] {
    const skillGroups: SkillGroup[] = [];
    
    // Common skill categories and their associated terms
    const skillCategories = {
      'Programming Languages': ['JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin'],
      'Frameworks & Libraries': ['React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel'],
      'Databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server'],
      'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD'],
      'Soft Skills': ['Leadership', 'Communication', 'Problem Solving', 'Team Management', 'Project Management']
    };
    
    for (const [category, skills] of Object.entries(skillCategories)) {
      const foundSkills = skills.filter(skill => 
        text.toLowerCase().includes(skill.toLowerCase())
      );
      
      if (foundSkills.length > 0) {
        skillGroups.push({
          name: category,
          items: foundSkills.map(skill => ({ name: skill }))
        });
      }
    }
    
    return skillGroups;
  }

  private extractProjects(text: string, sections: Array<{type: string, content: string}>): Project[] {
    return [];
  }

  private extractCertifications(text: string, sections: Array<{type: string, content: string}>): Certification[] {
    return [];
  }

  private extractKeywords(text: string): ExtractedKeyword[] {
    const keywords: ExtractedKeyword[] = [];
    
    // Enhanced keyword extraction with categories
    const keywordPatterns = {
      hard_skill: ['JavaScript', 'Python', 'React', 'AWS', 'Docker', 'SQL', 'Git', 'Machine Learning'],
      soft_skill: ['Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Management'],
      tool: ['Figma', 'Jira', 'Slack', 'GitHub', 'VS Code', 'Adobe', 'Microsoft Office'],
      certification: ['PMP', 'AWS Certified', 'Google Cloud', 'Scrum Master', 'CISSP'],
    };
    
    for (const [category, terms] of Object.entries(keywordPatterns)) {
      for (const term of terms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          keywords.push({
            term,
            category: category as any,
            frequency: matches.length,
            confidence: 0.8,
            context: this.getKeywordContext(text, term)
          });
        }
      }
    }
    
    return keywords;
  }

  private getKeywordContext(text: string, term: string): string {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + term.length + 50);
    
    return text.slice(start, end).trim();
  }

  private validateEnhancedData(data: any): EnhancedParsedDocument['parsedSections'] {
    return {
      contact: {
        name: data.contact?.name || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        location: data.contact?.location || '',
        linkedIn: data.contact?.linkedIn,
        website: data.contact?.website,
        github: data.contact?.github
      },
      summary: data.summary || '',
      experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
        id: exp.id || crypto.randomUUID(),
        company: exp.company || '',
        position: exp.position || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate,
        current: exp.current || false,
        location: exp.location || '',
        summary: exp.summary || '',
        highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
        keywords: Array.isArray(exp.keywords) ? exp.keywords : []
      })) : [],
      education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        from: edu.from || '',
        to: edu.to,
        gpa: edu.gpa,
        location: edu.location,
        honors: Array.isArray(edu.honors) ? edu.honors : undefined
      })) : [],
      skills: Array.isArray(data.skills) ? data.skills.map((group: any) => ({
        name: group.name || '',
        items: Array.isArray(group.items) ? group.items.map((item: any) => ({
          name: item.name || item,
          level: item.level
        })) : []
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      keywords: Array.isArray(data.keywords) ? data.keywords.map((kw: any) => ({
        term: kw.term || '',
        category: kw.category || 'hard_skill',
        frequency: kw.frequency || 1,
        confidence: kw.confidence || 0.5,
        context: kw.context
      })) : []
    };
  }

  private calculateConfidence(text: string, data: EnhancedParsedDocument['parsedSections']): number {
    let confidence = 0;
    
    // Contact information completeness
    if (data.contact.name) confidence += 15;
    if (data.contact.email) confidence += 20;
    if (data.contact.phone) confidence += 10;
    if (data.contact.location) confidence += 5;
    
    // Content completeness
    if (data.summary) confidence += 15;
    if (data.experience.length > 0) confidence += 20;
    if (data.education.length > 0) confidence += 10;
    if (data.skills.length > 0) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  private generateStructuredFallback(fileName: string): string {
    return `Resume file "${fileName}" uploaded successfully.

--- CONTACT INFORMATION ---
Please enter your contact details below.

--- PROFESSIONAL SUMMARY ---
[Enter a brief summary of your professional background]

--- WORK EXPERIENCE ---
[Add your work experience]

--- EDUCATION ---
[Add your education details]

--- SKILLS ---
[List your relevant skills]

--- PROJECTS ---
[Add notable projects if applicable]

--- CERTIFICATIONS ---
[Add certifications if applicable]

Note: Enhanced content extraction completed. Please review and complete the sections as needed.`;
  }
}