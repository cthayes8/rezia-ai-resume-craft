import OpenAI from 'openai';

export interface ExtractedKeywords {
  keywords: Array<{
    term: string;
    category: 'hard_skill' | 'soft_skill' | 'tool' | 'certification' | 'domain' | 'responsibility';
    importance: number; // 1-10 scale
    frequency: number;
    confidence: number;
    variations: string[];
  }>;
  requirements: string[];
  preferences: string[];
}

export interface JobKeywords {
  hard_skills: string[];
  soft_skills: string[];
  qualifications: string[];
  industry_terms: string[];
  tools_technologies: string[];
  certifications: string[];
}

export interface AIImprovement {
  section: string;
  type: 'add' | 'modify' | 'remove';
  original?: string;
  suggestion: string;
  reasoning: string;
  impact: number; // Expected ATS score improvement
  keywords: string[];
}

export class OpenAIService {
  private openai: OpenAI;
  private cache: Map<string, any> = new Map();

  constructor() {
    // Use environment variable for API key
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    this.openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Only for development
    });
  }

  async extractJobKeywords(jobDescription: string): Promise<ExtractedKeywords> {
    const cacheKey = `job_keywords_${this.hashString(jobDescription)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = `
      Analyze this job description and extract comprehensive keyword information:

      Job Description:
      "${jobDescription}"

      Return a JSON object with this exact structure:
      {
        "keywords": [
          {
            "term": "keyword",
            "category": "hard_skill|soft_skill|tool|certification|domain|responsibility",
            "importance": 8,
            "frequency": 1,
            "confidence": 0.9,
            "variations": ["keyword", "alternative term"]
          }
        ],
        "requirements": ["Must have requirement 1", "Must have requirement 2"],
        "preferences": ["Nice to have 1", "Preferred qualification 2"]
      }

      Guidelines:
      - Extract ALL technical skills, tools, programming languages, frameworks
      - Include soft skills, leadership qualities, and interpersonal skills
      - Identify certifications, degrees, and qualifications
      - Rate importance 1-10 (10 = absolutely critical)
      - Include common variations and synonyms for each term
      - Separate hard requirements from nice-to-have preferences
      - Be comprehensive - extract 20-50 keywords minimum
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error extracting job keywords:', error);
      return { keywords: [], requirements: [], preferences: [] };
    }
  }

  async extractStructuredData(prompt: string): Promise<any> {
    const cacheKey = `structured_${this.hashString(prompt)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error extracting structured data:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding_${this.hashString(text)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000), // Limit input size
      });

      const embedding = response.data[0].embedding;
      this.cache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  async suggestImprovements(
    resumeText: string,
    jobDescription: string,
    missingKeywords: string[]
  ): Promise<AIImprovement[]> {
    const prompt = `
      Analyze this resume against the job description and provide specific improvement suggestions.

      Resume:
      "${resumeText}"

      Job Description:
      "${jobDescription}"

      Missing Keywords: ${missingKeywords.join(', ')}

      Provide improvement suggestions in this JSON format:
      {
        "improvements": [
          {
            "section": "experience|skills|summary|education",
            "type": "add|modify|remove",
            "original": "original text if modifying",
            "suggestion": "specific improvement text",
            "reasoning": "why this improves ATS compatibility",
            "impact": 5,
            "keywords": ["keyword1", "keyword2"]
          }
        ]
      }

      Focus on:
      1. Naturally incorporating missing keywords
      2. Quantifying achievements with metrics
      3. Using action verbs and impact statements
      4. Improving ATS readability and parsing
      5. Matching job requirements more closely

      Provide 5-10 specific, actionable suggestions.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.improvements || [];
    } catch (error) {
      console.error('Error generating improvements:', error);
      return [];
    }
  }

  async enhanceContent(
    content: string,
    contentType: 'summary' | 'experience' | 'skills',
    targetKeywords: string[] = []
  ): Promise<string> {
    const prompt = `
      Enhance this ${contentType} content to be more ATS-friendly and impactful.
      
      Original Content:
      "${content}"
      
      Target Keywords to include (naturally): ${targetKeywords.join(', ')}
      
      Requirements:
      - Keep the same voice and style
      - Make it more quantifiable and specific
      - Naturally incorporate relevant keywords
      - Use strong action verbs
      - Make it ATS-scannable
      - ${contentType === 'experience' ? 'Focus on achievements and impact' : ''}
      - ${contentType === 'summary' ? 'Keep it concise (2-3 sentences)' : ''}
      - ${contentType === 'skills' ? 'Organize by categories and include variations' : ''}
      
      Return only the enhanced content, no explanations.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 500
      });

      return response.choices[0].message.content?.trim() || content;
    } catch (error) {
      console.error('Error enhancing content:', error);
      return content;
    }
  }

  async generateBulletPoints(
    role: string,
    company: string,
    responsibilities: string,
    targetKeywords: string[] = []
  ): Promise<string[]> {
    const prompt = `
      Generate 3-5 impactful bullet points for this role:
      
      Position: ${role}
      Company: ${company}
      Responsibilities: ${responsibilities}
      Keywords to include: ${targetKeywords.join(', ')}
      
      Each bullet point should:
      - Start with a strong action verb
      - Include quantified results where possible
      - Be ATS-friendly and keyword-rich
      - Be specific and impactful
      - Be 1-2 lines maximum
      
      Return as JSON: {"bullets": ["bullet 1", "bullet 2", ...]}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.bullets || [];
    } catch (error) {
      console.error('Error generating bullet points:', error);
      return [];
    }
  }

  async analyzeATSCompatibility(resumeText: string): Promise<{
    score: number;
    issues: Array<{
      type: 'formatting' | 'parsing' | 'content' | 'structure';
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
      impact: number;
    }>;
  }> {
    const prompt = `
      Analyze this resume for ATS (Applicant Tracking System) compatibility:

      Resume Text:
      "${resumeText}"

      Evaluate these aspects:
      1. Text parsing and readability
      2. Standard section headers
      3. Date formatting consistency
      4. Contact information clarity
      5. Keyword density and placement
      6. File structure and organization

      Return JSON:
      {
        "score": 85,
        "issues": [
          {
            "type": "formatting|parsing|content|structure",
            "severity": "high|medium|low",
            "description": "Issue description",
            "suggestion": "How to fix it",
            "impact": 15
          }
        ]
      }

      Score should be 0-100 based on ATS best practices.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        score: result.score || 0,
        issues: result.issues || []
      };
    } catch (error) {
      console.error('Error analyzing ATS compatibility:', error);
      return { score: 0, issues: [] };
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  clearCache(): void {
    this.cache.clear();
  }
}