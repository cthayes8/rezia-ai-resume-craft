import { OpenAIService } from './openai.service';

export interface MarkdownParsedDocument {
  id: string;
  fileName: string;
  markdown: string;
  parsedSections: {
    contact: ContactInfo;
    summary: string;
    experience: ParsedExperience[];
    education: ParsedEducation[];
    skills: ParsedSkillGroup[];
    projects?: ParsedProject[];
    certifications?: ParsedCertification[];
  };
  metadata: {
    parseDate: Date;
    wordCount: number;
    format: 'pdf' | 'docx' | 'txt';
    confidence: number;
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
  headline?: string;
}

export interface ParsedExperience {
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

export interface ParsedEducation {
  institution: string;
  degree: string;
  field?: string;
  from: string;
  to?: string;
  gpa?: string;
  location?: string;
}

export interface ParsedSkillGroup {
  name: string;
  items: { name: string; level?: string }[];
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  highlights: string[];
}

export interface ParsedCertification {
  name: string;
  issuer: string;
  date?: string;
  credentialId?: string;
}

export class MarkdownParserService {
  private openaiService: OpenAIService | null = null;

  constructor() {
    try {
      this.openaiService = new OpenAIService();
    } catch (error) {
      console.warn('OpenAI service not available, using pattern-based parsing:', error);
      this.openaiService = null;
    }
  }

  async parseResume(file: File): Promise<MarkdownParsedDocument> {
    try {
      let markdown: string;
      let format: 'pdf' | 'docx' | 'txt';

      // Convert document to markdown
      if (file.type === 'application/pdf') {
        format = 'pdf';
        markdown = await this.convertPDFToMarkdown(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        format = 'docx';
        markdown = await this.convertDOCXToMarkdown(file);
      } else if (file.type === 'text/plain') {
        format = 'txt';
        const text = await file.text();
        markdown = this.convertTextToMarkdown(text);
      } else {
        throw new Error('Unsupported file format');
      }

      if (markdown.length < 50) {
        throw new Error('Insufficient content extracted from document');
      }

      // Parse the markdown into structured data
      const parsedSections = await this.parseMarkdownToSections(markdown);

      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        markdown,
        parsedSections,
        metadata: {
          parseDate: new Date(),
          wordCount: markdown.split(/\s+/).length,
          format,
          confidence: this.calculateConfidence(markdown, parsedSections)
        }
      };
    } catch (error) {
      console.error('Markdown parsing error:', error);
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertPDFToMarkdown(file: File): Promise<string> {
    try {
      // Use pdf-parse for better PDF text extraction
      const pdfParse = await import('pdf-parse');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const data = await pdfParse.default(buffer);
      const text = data.text;
      
      return this.convertTextToMarkdown(text);
    } catch (error) {
      console.error('PDF to markdown conversion failed:', error);
      throw new Error('Unable to parse PDF file');
    }
  }

  private async convertDOCXToMarkdown(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract as HTML first for better structure preservation
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      // Convert HTML to markdown
      const TurndownService = (await import('turndown')).default;
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced'
      });
      
      const markdown = turndownService.turndown(html);
      return this.cleanMarkdown(markdown);
    } catch (error) {
      console.error('DOCX to markdown conversion failed:', error);
      throw new Error('Unable to parse DOCX file');
    }
  }

  private convertTextToMarkdown(text: string): string {
    let markdown = text;
    
    // Convert common resume section headers to markdown headers
    const sectionPatterns = [
      { pattern: /^(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE)$/gim, replacement: '# $1' },
      { pattern: /^(WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|CAREER HISTORY)$/gim, replacement: '# $1' },
      { pattern: /^(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)$/gim, replacement: '# $1' },
      { pattern: /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE)$/gim, replacement: '# $1' },
      { pattern: /^(PROJECTS|KEY PROJECTS|NOTABLE PROJECTS)$/gim, replacement: '# $1' },
      { pattern: /^(CERTIFICATIONS|CERTIFICATES|LICENSES)$/gim, replacement: '# $1' },
      { pattern: /^(ACHIEVEMENTS|ACCOMPLISHMENTS|AWARDS)$/gim, replacement: '# $1' },
      { pattern: /^(LANGUAGES|LANGUAGE SKILLS)$/gim, replacement: '# $1' }
    ];

    sectionPatterns.forEach(({ pattern, replacement }) => {
      markdown = markdown.replace(pattern, replacement);
    });

    // Convert bullet points to markdown list format
    markdown = markdown.replace(/^[•·▪▫‣⁃]\s*/gm, '- ');
    markdown = markdown.replace(/^\d+\.\s*/gm, '1. ');

    // Clean up excessive whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return this.cleanMarkdown(markdown);
  }

  private cleanMarkdown(markdown: string): string {
    return markdown
      .replace(/\*\*\*+/g, '**') // Fix excessive bold formatting
      .replace(/_{3,}/g, '__') // Fix excessive italic formatting  
      .replace(/#{4,}/g, '###') // Limit header depth
      .replace(/\n{4,}/g, '\n\n\n') // Limit line breaks
      .trim();
  }

  private async parseMarkdownToSections(markdown: string): Promise<MarkdownParsedDocument['parsedSections']> {
    try {
      if (this.openaiService) {
        return await this.aiParseMarkdown(markdown);
      } else {
        return this.patternParseMarkdown(markdown);
      }
    } catch (error) {
      console.error('Section parsing failed, using pattern fallback:', error);
      return this.patternParseMarkdown(markdown);
    }
  }

  private async aiParseMarkdown(markdown: string): Promise<MarkdownParsedDocument['parsedSections']> {
    const prompt = `
Parse this resume markdown and extract structured information. Return ONLY valid JSON with this exact structure:

{
  "contact": {
    "name": "Full Name",
    "email": "email@domain.com",
    "phone": "phone number",
    "location": "city, state",
    "linkedIn": "linkedin url or null",
    "website": "website url or null",
    "github": "github url or null", 
    "headline": "professional headline or null"
  },
  "summary": "Professional summary text or empty string",
  "experience": [
    {
      "id": "unique_id",
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or null if current",
      "current": false,
      "location": "City, State or null",
      "summary": "Role description",
      "highlights": ["achievement 1", "achievement 2"],
      "keywords": ["skill1", "skill2"]
    }
  ],
  "education": [
    {
      "institution": "School Name", 
      "degree": "Degree Type",
      "field": "Field of Study or null",
      "from": "YYYY format",
      "to": "YYYY format or null",
      "gpa": "GPA or null",
      "location": "City, State or null"
    }
  ],
  "skills": [
    {
      "name": "Skill Category Name",
      "items": [
        {"name": "Skill Name", "level": "Proficiency Level or null"}
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description", 
      "technologies": ["tech1", "tech2"],
      "url": "project url or null",
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM format or null",
      "credentialId": "credential ID or null"
    }
  ]
}

Resume Markdown:
${markdown}

Extract as much accurate information as possible. For missing fields, use null or empty string/array. Ensure all JSON is valid.
    `;

    const result = await this.openaiService!.extractStructuredData(prompt);
    return this.validateParsedData(result);
  }

  private patternParseMarkdown(markdown: string): MarkdownParsedDocument['parsedSections'] {
    const sections = this.splitMarkdownIntoSections(markdown);
    
    return {
      contact: this.extractContactFromMarkdown(sections.contact || markdown),
      summary: this.extractSummaryFromMarkdown(sections.summary || ''),
      experience: this.extractExperienceFromMarkdown(sections.experience || ''),
      education: this.extractEducationFromMarkdown(sections.education || ''),
      skills: this.extractSkillsFromMarkdown(sections.skills || ''),
      projects: this.extractProjectsFromMarkdown(sections.projects || ''),
      certifications: this.extractCertificationsFromMarkdown(sections.certifications || '')
    };
  }

  private splitMarkdownIntoSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = markdown.split('\n');
    let currentSection = 'contact';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^#+\s*(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        const headerText = headerMatch[1].toLowerCase();
        if (headerText.includes('summary') || headerText.includes('objective') || headerText.includes('profile')) {
          currentSection = 'summary';
        } else if (headerText.includes('experience') || headerText.includes('employment') || headerText.includes('work')) {
          currentSection = 'experience';
        } else if (headerText.includes('education') || headerText.includes('academic')) {
          currentSection = 'education';
        } else if (headerText.includes('skill') || headerText.includes('competenc')) {
          currentSection = 'skills';
        } else if (headerText.includes('project')) {
          currentSection = 'projects';
        } else if (headerText.includes('certification') || headerText.includes('license')) {
          currentSection = 'certifications';
        } else {
          currentSection = 'other';
        }
        
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    // Save final section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  }

  private extractContactFromMarkdown(text: string): ContactInfo {
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    const linkedInMatch = text.match(/((?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s]+)/i);
    const githubMatch = text.match(/((?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+)/i);
    const websiteMatch = text.match(/((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
    
    // Extract name (usually first non-empty line that's not contact info)
    const lines = text.split('\n').filter(line => line.trim());
    let name = '';
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && 
          !cleanLine.includes('@') && 
          !cleanLine.match(/\d{3}/) && 
          !cleanLine.toLowerCase().includes('linkedin') &&
          !cleanLine.toLowerCase().includes('github') &&
          !cleanLine.startsWith('#') &&
          cleanLine.length > 2 && cleanLine.length < 50) {
        name = cleanLine.replace(/[*_#]/g, '').trim();
        break;
      }
    }

    return {
      name,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      linkedIn: linkedInMatch ? linkedInMatch[0] : undefined,
      website: websiteMatch && !linkedInMatch && !githubMatch ? websiteMatch[0] : undefined,
      github: githubMatch ? githubMatch[0] : undefined,
      headline: undefined
    };
  }

  private extractSummaryFromMarkdown(text: string): string {
    if (!text.trim()) return '';
    
    // Remove markdown formatting and return clean text
    return text
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/[*_]/g, '') // Remove bold/italic
      .replace(/\n+/g, ' ') // Collapse newlines
      .trim();
  }

  private extractExperienceFromMarkdown(text: string): ParsedExperience[] {
    const experiences: ParsedExperience[] = [];
    if (!text.trim()) return experiences;

    // Split by job entries (look for company/position patterns)
    const jobBlocks = text.split(/(?=\n.*(?:at|@|\|).+\n)|(?=\n\*\*.*\*\*\n)/);
    
    for (const block of jobBlocks) {
      if (block.trim().length < 20) continue; // Skip short blocks
      
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length < 2) continue;
      
      // Extract job info
      let position = '';
      let company = '';
      let startDate = '';
      let endDate = '';
      let current = false;
      const highlights: string[] = [];
      
      // Look for position and company in first few lines
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].replace(/[*_#]/g, '').trim();
        
        // Check for "Position at Company" pattern
        const atPattern = line.match(/^(.+?)\s+at\s+(.+)$/i);
        if (atPattern) {
          position = atPattern[1].trim();
          company = atPattern[2].trim();
          continue;
        }
        
        // Check for "Position | Company" pattern
        const pipePattern = line.match(/^(.+?)\s*\|\s*(.+)$/);
        if (pipePattern) {
          position = pipePattern[1].trim();
          company = pipePattern[2].trim();
          continue;
        }
        
        // If line contains dates, extract them
        const datePattern = line.match(/(\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{4}|\w+\s+\d{4}|present|current)/i);
        if (datePattern) {
          startDate = this.standardizeDate(datePattern[1]);
          if (datePattern[2].toLowerCase().includes('present') || datePattern[2].toLowerCase().includes('current')) {
            current = true;
          } else {
            endDate = this.standardizeDate(datePattern[2]);
          }
          continue;
        }
        
        // If no pattern matched and we don't have position yet, assume it's the position
        if (!position && line.length > 3 && line.length < 100) {
          position = line;
        }
      }
      
      // Extract bullet points as highlights
      const bulletPattern = /^[-*+]\s+(.+)$/gm;
      let match;
      while ((match = bulletPattern.exec(block)) !== null) {
        highlights.push(match[1].trim());
      }
      
      if (position || company) {
        experiences.push({
          id: crypto.randomUUID(),
          company: company || 'Unknown Company',
          position: position || 'Unknown Position',
          startDate,
          endDate: current ? undefined : endDate,
          current,
          location: undefined,
          summary: '',
          highlights,
          keywords: []
        });
      }
    }
    
    return experiences;
  }

  private extractEducationFromMarkdown(text: string): ParsedEducation[] {
    const education: ParsedEducation[] = [];
    if (!text.trim()) return education;

    const eduBlocks = text.split(/\n(?=.*(?:university|college|school|institute)\b)/i);
    
    for (const block of eduBlocks) {
      if (block.trim().length < 10) continue;
      
      const lines = block.split('\n').filter(line => line.trim());
      let institution = '';
      let degree = '';
      let field = '';
      let from = '';
      let to = '';
      
      for (const line of lines) {
        const cleanLine = line.replace(/[*_#]/g, '').trim();
        
        // Look for institution names
        if (cleanLine.match(/\b(university|college|school|institute)\b/i) && !institution) {
          institution = cleanLine;
          continue;
        }
        
        // Look for degree patterns
        if (cleanLine.match(/\b(bachelor|master|phd|doctorate|associate|diploma|certificate)\b/i) && !degree) {
          degree = cleanLine;
          continue;
        }
        
        // Look for dates
        const datePattern = cleanLine.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
        if (datePattern) {
          from = datePattern[1];
          to = datePattern[2];
        }
      }
      
      if (institution || degree) {
        education.push({
          institution: institution || 'Unknown Institution',
          degree: degree || 'Unknown Degree',
          field,
          from,
          to,
          gpa: undefined,
          location: undefined
        });
      }
    }
    
    return education;
  }

  private extractSkillsFromMarkdown(text: string): ParsedSkillGroup[] {
    const skillGroups: ParsedSkillGroup[] = [];
    if (!text.trim()) return skillGroups;

    // Look for categorized skills
    const categories = text.split(/\n(?=\*\*.*\*\*:|#+\s*)/);
    
    for (const category of categories) {
      const lines = category.split('\n').filter(line => line.trim());
      if (lines.length === 0) continue;
      
      let categoryName = 'Skills';
      const skills: string[] = [];
      
      // Extract category name from header
      const headerMatch = lines[0].match(/(?:\*\*(.+?)\*\*|#+\s*(.+))/);
      if (headerMatch) {
        categoryName = (headerMatch[1] || headerMatch[2]).replace(/[:]/g, '').trim();
        lines.shift(); // Remove header line
      }
      
      // Extract skills from remaining lines
      for (const line of lines) {
        // Handle comma-separated skills
        if (line.includes(',')) {
          const lineSkills = line.split(',').map(skill => skill.replace(/[*_-]/g, '').trim());
          skills.push(...lineSkills.filter(skill => skill.length > 0));
        } else {
          // Handle bullet point skills
          const skillMatch = line.match(/^[-*+]\s*(.+)$/);
          if (skillMatch) {
            skills.push(skillMatch[1].trim());
          } else {
            const cleanSkill = line.replace(/[*_-]/g, '').trim();
            if (cleanSkill.length > 0 && cleanSkill.length < 50) {
              skills.push(cleanSkill);
            }
          }
        }
      }
      
      if (skills.length > 0) {
        skillGroups.push({
          name: categoryName,
          items: skills.map(skill => ({ name: skill }))
        });
      }
    }
    
    // If no categorized skills found, create a single group
    if (skillGroups.length === 0) {
      const allSkills: string[] = [];
      const skillMatches = text.match(/[-*+]\s*([^-*+\n]+)/g);
      if (skillMatches) {
        for (const match of skillMatches) {
          const skill = match.replace(/^[-*+]\s*/, '').trim();
          if (skill.length > 0) allSkills.push(skill);
        }
      }
      
      if (allSkills.length > 0) {
        skillGroups.push({
          name: 'Technical Skills',
          items: allSkills.map(skill => ({ name: skill }))
        });
      }
    }
    
    return skillGroups;
  }

  private extractProjectsFromMarkdown(text: string): ParsedProject[] {
    // Basic project extraction - can be enhanced
    return [];
  }

  private extractCertificationsFromMarkdown(text: string): ParsedCertification[] {
    // Basic certification extraction - can be enhanced
    return [];
  }

  private standardizeDate(dateStr: string): string {
    // Convert various date formats to YYYY-MM
    const cleanDate = dateStr.trim();
    
    // Handle year only
    if (/^\d{4}$/.test(cleanDate)) {
      return cleanDate + '-01';
    }
    
    // Handle Month Year format
    const monthYearMatch = cleanDate.match(/(\w+)\s+(\d{4})/);
    if (monthYearMatch) {
      const monthMap: Record<string, string> = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
        'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      const month = monthMap[monthYearMatch[1].toLowerCase()];
      if (month) {
        return `${monthYearMatch[2]}-${month}`;
      }
    }
    
    return cleanDate;
  }

  private validateParsedData(data: any): MarkdownParsedDocument['parsedSections'] {
    return {
      contact: {
        name: data.contact?.name || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        location: data.contact?.location || '',
        linkedIn: data.contact?.linkedIn || undefined,
        website: data.contact?.website || undefined,
        github: data.contact?.github || undefined,
        headline: data.contact?.headline || undefined
      },
      summary: data.summary || '',
      experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
        id: exp.id || crypto.randomUUID(),
        company: exp.company || '',
        position: exp.position || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || undefined,
        current: exp.current || false,
        location: exp.location || undefined,
        summary: exp.summary || '',
        highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
        keywords: Array.isArray(exp.keywords) ? exp.keywords : []
      })) : [],
      education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || undefined,
        from: edu.from || '',
        to: edu.to || undefined,
        gpa: edu.gpa || undefined,
        location: edu.location || undefined
      })) : [],
      skills: Array.isArray(data.skills) ? data.skills.map((group: any) => ({
        name: group.name || 'Skills',
        items: Array.isArray(group.items) ? group.items.map((item: any) => ({
          name: typeof item === 'string' ? item : (item.name || ''),
          level: typeof item === 'object' ? item.level : undefined
        })) : []
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : []
    };
  }

  private calculateConfidence(markdown: string, data: MarkdownParsedDocument['parsedSections']): number {
    let confidence = 0;
    
    // Contact information completeness
    if (data.contact.name) confidence += 20;
    if (data.contact.email) confidence += 20;
    if (data.contact.phone) confidence += 10;
    
    // Content completeness
    if (data.summary) confidence += 15;
    if (data.experience.length > 0) confidence += 20;
    if (data.education.length > 0) confidence += 10;
    if (data.skills.length > 0) confidence += 5;
    
    return Math.min(confidence, 100);
  }
}