import { NextRequest, NextResponse } from 'next/server';

// Impact verbs categorized by achievement type
const IMPACT_VERBS = {
  leadership: ['Spearheaded', 'Orchestrated', 'Championed', 'Directed', 'Mobilized', 'Galvanized', 'Pioneered', 'Architected'],
  improvement: ['Optimized', 'Streamlined', 'Transformed', 'Revolutionized', 'Modernized', 'Enhanced', 'Elevated', 'Amplified'],
  achievement: ['Achieved', 'Delivered', 'Exceeded', 'Surpassed', 'Attained', 'Accomplished', 'Secured', 'Generated'],
  creation: ['Developed', 'Designed', 'Engineered', 'Established', 'Built', 'Created', 'Launched', 'Implemented'],
  analysis: ['Analyzed', 'Evaluated', 'Assessed', 'Identified', 'Diagnosed', 'Investigated', 'Synthesized', 'Interpreted'],
  collaboration: ['Collaborated', 'Partnered', 'Facilitated', 'Negotiated', 'Liaised', 'Coordinated', 'United', 'Aligned']
};

// Power descriptors for different contexts
const POWER_DESCRIPTORS = {
  scope: ['enterprise-wide', 'cross-functional', 'multi-million dollar', 'global', 'company-wide', 'strategic'],
  impact: ['high-impact', 'mission-critical', 'revenue-generating', 'cost-saving', 'efficiency-driving', 'transformative'],
  approach: ['data-driven', 'innovative', 'systematic', 'agile', 'scalable', 'sustainable']
};

export async function POST(request: NextRequest) {
  try {
    const { sectionType, currentContent, style, context, targetField } = await request.json();

    // Validate input
    if (!sectionType || !currentContent?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Section type and content are required'
      }, { status: 400 });
    }

    // Generate contextual AI rewrites based on section type and style
    const suggestions = await generateEliteAIRewrites({
      sectionType,
      currentContent,
      style: style || 'professional',
      context: context || '',
      targetField: targetField || sectionType
    });

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        sectionType,
        style,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI rewrite error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate rewrite suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateEliteAIRewrites({
  sectionType,
  currentContent,
  style,
  context,
  targetField
}: {
  sectionType: string;
  currentContent: string;
  style: string;
  context: string;
  targetField: string;
}): Promise<string[]> {
  
  const suggestions: string[] = [];
  
  try {
    // Parse context for better understanding
    const resumeContext = parseResumeContext(context);
    
    // Generate 3 different high-quality variations
    switch (sectionType) {
      case 'summary':
        suggestions.push(...generateEliteSummaryRewrites(currentContent, style, resumeContext));
        break;
      case 'experience':
        suggestions.push(...generateEliteExperienceRewrites(currentContent, style, resumeContext, targetField));
        break;
      case 'basics':
        suggestions.push(...generateEliteBasicsRewrites(currentContent, style, targetField));
        break;
      default:
        suggestions.push(...generateEliteGenericRewrites(currentContent, style, resumeContext));
    }
    
    // Ensure all suggestions are unique and high-quality
    return [...new Set(suggestions)]
      .filter(s => s.trim().length > 20) // Minimum length for quality
      .slice(0, 3); // Return top 3 suggestions
    
  } catch (error) {
    console.error('Error generating rewrites:', error);
    // Fallback to enhanced versions
    return [
      applyEliteEnhancement(currentContent, 'professional'),
      applyEliteEnhancement(currentContent, 'impact'),
      applyEliteEnhancement(currentContent, 'concise')
    ].filter(s => s !== currentContent && s.length > 0);
  }
}

interface ResumeContext {
  name: string;
  title: string;
  skills: string[];
  experience: string[];
  industry: string;
  seniorityLevel: string;
}

function parseResumeContext(context: string): ResumeContext {
  // Extract key information from context
  const nameMatch = context.match(/Name:\s*(.+)/);
  const titleMatch = context.match(/Title:\s*(.+)/);
  const skillsMatch = context.match(/Skills:\s*(.+)/);
  
  const skills = skillsMatch ? skillsMatch[1].split(',').map(s => s.trim()) : [];
  const experience = context.match(/Recent Experience:\s*\n((?:-.+\n?)+)/);
  const experienceList = experience ? 
    experience[1].split('\n').filter(line => line.trim().startsWith('-')).map(e => e.replace('-', '').trim()) : [];
  
  // Infer industry and seniority from title and experience
  const title = titleMatch ? titleMatch[1].trim() : '';
  const seniorityLevel = inferSeniorityLevel(title, experienceList);
  const industry = inferIndustry(skills, title);
  
  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    title,
    skills,
    experience: experienceList,
    industry,
    seniorityLevel
  };
}

function inferSeniorityLevel(title: string, experience: string[]): string {
  const seniorKeywords = ['senior', 'lead', 'principal', 'director', 'manager', 'head'];
  const titleLower = title.toLowerCase();
  
  if (seniorKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'senior';
  } else if (experience.length > 3) {
    return 'mid-level';
  }
  return 'entry-level';
}

function inferIndustry(skills: string[], title: string): string {
  const techKeywords = ['software', 'developer', 'engineer', 'programming', 'react', 'python', 'java'];
  const financeKeywords = ['finance', 'accounting', 'analyst', 'banking', 'investment'];
  const marketingKeywords = ['marketing', 'brand', 'digital', 'seo', 'content', 'social'];
  
  const allText = [...skills, title].join(' ').toLowerCase();
  
  if (techKeywords.some(keyword => allText.includes(keyword))) return 'technology';
  if (financeKeywords.some(keyword => allText.includes(keyword))) return 'finance';
  if (marketingKeywords.some(keyword => allText.includes(keyword))) return 'marketing';
  
  return 'general';
}

function generateEliteSummaryRewrites(content: string, style: string, context: ResumeContext): string[] {
  const suggestions: string[] = [];
  
  // Extract key skills and create skill clusters
  const primarySkills = context.skills.slice(0, 3).join(', ') || 'strategic leadership and innovation';
  const coreCompetencies = context.skills.slice(3, 6).join(', ') || 'cross-functional collaboration';
  
  switch (style) {
    case 'professional':
      // Professional: Focus on expertise and leadership
      suggestions.push(
        `${context.seniorityLevel === 'senior' ? 'Accomplished' : 'Results-driven'} ${context.title || 'professional'} with demonstrated expertise in ${primarySkills}. Proven track record of delivering high-impact solutions through ${coreCompetencies}. Recognized for ability to drive organizational transformation while fostering collaborative team environments and exceeding strategic objectives.`
      );
      
      suggestions.push(
        `Strategic ${context.title || 'professional'} combining deep technical expertise in ${primarySkills} with exceptional leadership capabilities. ${context.experience.length > 0 ? `Previously ${context.experience[0]}, bringing` : 'Brings'} proven ability to architect scalable solutions, optimize operational efficiency, and deliver measurable business value across complex initiatives.`
      );
      break;
      
    case 'impact':
      // Impact: Lead with quantifiable achievements
      suggestions.push(
        `High-performing ${context.title || 'professional'} who consistently delivers 20-40% improvements in operational efficiency through expertise in ${primarySkills}. Spearheaded transformative initiatives resulting in multi-million dollar cost savings and revenue growth. Known for translating complex technical challenges into strategic business opportunities.`
      );
      
      suggestions.push(
        `Award-winning ${context.title || 'leader'} with a proven history of exceeding performance metrics by 30%+ through innovative ${primarySkills} strategies. Architected solutions that reduced costs by $2M+ annually while improving team productivity by 45%. Expert at building high-performance teams and driving sustainable growth.`
      );
      break;
      
    case 'concise':
      // Concise: Punchy and powerful
      suggestions.push(
        `${context.title || 'Professional'} expert in ${primarySkills}. ${extractYearsFromExperience(context.experience)}+ years driving operational excellence and delivering measurable results. Proven leader in ${context.industry} innovation.`
      );
      
      suggestions.push(
        `Strategic ${context.title || 'professional'} • ${primarySkills} Expert • ${extractYearsFromExperience(context.experience)}+ Years ${context.industry} Experience • Delivered $5M+ in Business Value • Team Builder & Innovation Driver`
      );
      break;
  }
  
  return suggestions.filter(s => s.trim().length > 0);
}

function generateEliteExperienceRewrites(content: string, style: string, context: ResumeContext, targetField: string): string[] {
  const suggestions: string[] = [];
  
  if (targetField === 'summary') {
    // Role summary rewrites
    switch (style) {
      case 'professional':
        suggestions.push(transformToEliteRoleSummary(content, context, 'professional'));
        suggestions.push(enhanceRoleSummaryWithContext(content, context));
        break;
      case 'impact':
        suggestions.push(transformToEliteRoleSummary(content, context, 'impact'));
        suggestions.push(addQuantifiableImpact(content, context));
        break;
      case 'concise':
        suggestions.push(transformToEliteRoleSummary(content, context, 'concise'));
        break;
    }
  } else if (targetField === 'highlights' || content.startsWith('•') || content.startsWith('-')) {
    // Achievement bullets rewrites
    suggestions.push(...generateEliteAchievementBullets(content, style, context));
  }
  
  return suggestions.filter(s => s.trim().length > 0);
}

function transformToEliteRoleSummary(content: string, context: ResumeContext, style: string): string {
  const cleanContent = content.trim();
  
  switch (style) {
    case 'professional':
      return `Served as strategic leader responsible for ${extractKeyResponsibility(cleanContent)}, driving organizational excellence through innovative solutions and collaborative leadership. Managed cross-functional initiatives spanning ${context.skills.slice(0, 2).join(' and ')}, consistently exceeding performance targets.`;
      
    case 'impact':
      return `Delivered transformative results by ${extractKeyAction(cleanContent)}, achieving 35% improvement in operational efficiency and $1.5M in cost savings. Led high-performance team of 12+ professionals while implementing scalable solutions that continue to drive business value.`;
      
    case 'concise':
      return `Led ${extractKeyResponsibility(cleanContent)} initiatives. Delivered 40% efficiency gains. Managed $5M+ budget and 15-person team.`;
      
    default:
      return cleanContent;
  }
}

function generateEliteAchievementBullets(content: string, style: string, context: ResumeContext): string[] {
  const suggestions: string[] = [];
  const cleanContent = content.replace(/^[•\-]\s*/, '').trim();
  
  // Analyze the content to understand the achievement
  const hasNumbers = /\d+/.test(cleanContent);
  const action = extractActionFromContent(cleanContent);
  const impact = extractImpactFromContent(cleanContent);
  
  switch (style) {
    case 'professional':
      suggestions.push(createProfessionalBullet(action, impact, context, hasNumbers));
      suggestions.push(enhanceWithSystematicApproach(cleanContent, context));
      break;
      
    case 'impact':
      suggestions.push(createImpactBullet(action, impact, context));
      suggestions.push(maximizeQuantifiableResults(cleanContent, context));
      break;
      
    case 'concise':
      suggestions.push(createConciseBullet(action, impact, hasNumbers));
      break;
  }
  
  // Always add a CAR (Context-Action-Result) version
  suggestions.push(transformToCAR(cleanContent, context));
  
  return suggestions.map(s => s.startsWith('•') ? s : `• ${s}`);
}

function createProfessionalBullet(action: string, impact: string, context: ResumeContext, hasNumbers: boolean): string {
  const verb = selectImpactVerb('leadership');
  const descriptor = selectPowerDescriptor('approach');
  
  if (hasNumbers) {
    return `${verb} ${descriptor} ${action} initiative, resulting in ${impact} while establishing best practices that enhanced team productivity and operational excellence`;
  } else {
    return `${verb} ${descriptor} ${action} strategy that ${impact}, demonstrating expertise in ${context.skills[0] || 'strategic planning'} and stakeholder management`;
  }
}

function createImpactBullet(action: string, impact: string, context: ResumeContext): string {
  const verb = selectImpactVerb('achievement');
  const metric = generateRealisticMetric(action);
  
  return `${verb} ${metric.value} ${metric.type} by ${action}, ${impact || 'exceeding quarterly targets'} and generating $${Math.floor(Math.random() * 9 + 1)}M in additional revenue`;
}

function createConciseBullet(action: string, impact: string, hasNumbers: boolean): string {
  const verb = selectImpactVerb('improvement');
  
  if (hasNumbers) {
    return `${verb} ${action} → ${impact}`;
  } else {
    return `${verb} ${action} • Delivered 30% improvement • Saved $500K annually`;
  }
}

function transformToCAR(content: string, context: ResumeContext): string {
  // Context-Action-Result format
  const verb = selectImpactVerb('creation');
  const challenge = `Faced with ${inferChallenge(content)}`;
  const action = `${verb} comprehensive solution leveraging ${context.skills[0] || 'innovative approaches'}`;
  const result = `resulting in ${generateRealisticResult(content)}`;
  
  return `${challenge}, ${action}, ${result}`;
}

function generateEliteBasicsRewrites(content: string, style: string, targetField: string): string[] {
  const suggestions: string[] = [];
  
  if (targetField === 'headline') {
    const baseTitle = content.trim();
    
    suggestions.push(
      `${baseTitle} | Driving Innovation & Operational Excellence`,
      `Strategic ${baseTitle} | Transforming Vision into Measurable Results`,
      `${baseTitle} | ${generateRealisticMetric(baseTitle).value} Track Record of Success`
    );
    
    // Add industry-specific versions
    if (baseTitle.toLowerCase().includes('engineer') || baseTitle.toLowerCase().includes('developer')) {
      suggestions.push(
        `${baseTitle} | Building Scalable Solutions & Leading Technical Teams`,
        `Full-Stack ${baseTitle} | Cloud Architecture & DevOps Excellence`
      );
    } else if (baseTitle.toLowerCase().includes('manager')) {
      suggestions.push(
        `${baseTitle} | P&L Management & Strategic Growth`,
        `${baseTitle} | Team Builder & Change Agent`
      );
    }
  }
  
  return suggestions.filter(s => s.trim().length > 0).slice(0, 3);
}

function generateEliteGenericRewrites(content: string, style: string, context: ResumeContext): string[] {
  return [
    applyEliteEnhancement(content, 'professional'),
    applyEliteEnhancement(content, 'impact'),
    applyEliteEnhancement(content, 'concise')
  ].filter(s => s.trim().length > 0);
}

// Helper functions for elite transformations
function applyEliteEnhancement(content: string, style: string): string {
  const cleanContent = content.trim();
  
  // Check if content already starts with an impact verb
  const startsWithVerb = IMPACT_VERBS.leadership.concat(
    IMPACT_VERBS.improvement,
    IMPACT_VERBS.achievement,
    IMPACT_VERBS.creation
  ).some(verb => cleanContent.startsWith(verb));
  
  if (!startsWithVerb) {
    const verb = selectImpactVerb(style === 'impact' ? 'achievement' : 'leadership');
    return `${verb} ${cleanContent.charAt(0).toLowerCase() + cleanContent.slice(1)}`;
  }
  
  // Enhance existing content with power descriptors
  const descriptor = selectPowerDescriptor('impact');
  const words = cleanContent.split(' ');
  words.splice(1, 0, descriptor);
  
  return words.join(' ');
}

function selectImpactVerb(category: keyof typeof IMPACT_VERBS): string {
  const verbs = IMPACT_VERBS[category] || IMPACT_VERBS.achievement;
  return verbs[Math.floor(Math.random() * verbs.length)];
}

function selectPowerDescriptor(category: keyof typeof POWER_DESCRIPTORS): string {
  const descriptors = POWER_DESCRIPTORS[category] || POWER_DESCRIPTORS.impact;
  return descriptors[Math.floor(Math.random() * descriptors.length)];
}

function generateRealisticMetric(context: string): { value: string, type: string } {
  const metrics = [
    { value: '95%+', type: 'client satisfaction' },
    { value: '40%', type: 'efficiency improvement' },
    { value: '$2.5M', type: 'cost reduction' },
    { value: '3x', type: 'ROI increase' },
    { value: '25%', type: 'revenue growth' },
    { value: '50%', type: 'time-to-market reduction' }
  ];
  
  // Try to match context-appropriate metrics
  if (context.toLowerCase().includes('customer') || context.toLowerCase().includes('client')) {
    return metrics[0];
  } else if (context.toLowerCase().includes('efficien') || context.toLowerCase().includes('process')) {
    return metrics[1];
  } else if (context.toLowerCase().includes('cost') || context.toLowerCase().includes('budget')) {
    return metrics[2];
  }
  
  return metrics[Math.floor(Math.random() * metrics.length)];
}

function generateRealisticResult(content: string): string {
  const results = [
    '30% increase in operational efficiency',
    '$1.2M in annual cost savings',
    '45% reduction in processing time',
    '98% customer satisfaction rating',
    '25% improvement in team productivity',
    'award-winning performance recognized company-wide'
  ];
  
  return results[Math.floor(Math.random() * results.length)];
}

// Content parsing helpers
function extractKeyResponsibility(content: string): string {
  // Extract the main responsibility from content
  const cleanContent = content.toLowerCase().replace(/[.,]/g, '');
  const keywords = ['managing', 'leading', 'developing', 'overseeing', 'directing'];
  
  for (const keyword of keywords) {
    if (cleanContent.includes(keyword)) {
      const index = cleanContent.indexOf(keyword);
      const words = cleanContent.slice(index).split(' ').slice(0, 5).join(' ');
      return words;
    }
  }
  
  return cleanContent.split(' ').slice(0, 5).join(' ');
}

function extractKeyAction(content: string): string {
  const verbs = content.match(/\b(led|managed|developed|created|implemented|designed|built)\b/i);
  if (verbs) {
    const verbIndex = content.toLowerCase().indexOf(verbs[0].toLowerCase());
    return content.slice(verbIndex).split('.')[0];
  }
  return 'driving strategic initiatives';
}

function extractActionFromContent(content: string): string {
  const words = content.split(' ');
  const verbIndex = words.findIndex(word => 
    /ed$|ing$/.test(word) || ['led', 'built', 'drove', 'ran'].includes(word.toLowerCase())
  );
  
  if (verbIndex >= 0) {
    return words.slice(verbIndex, verbIndex + 4).join(' ');
  }
  
  return words.slice(0, 4).join(' ');
}

function extractImpactFromContent(content: string): string {
  // Look for result indicators
  const resultIndicators = ['resulting', 'achieving', 'generating', 'delivering', 'producing'];
  const lowerContent = content.toLowerCase();
  
  for (const indicator of resultIndicators) {
    if (lowerContent.includes(indicator)) {
      const index = lowerContent.indexOf(indicator);
      return content.slice(index);
    }
  }
  
  // Look for metrics
  if (/\d+/.test(content)) {
    const metricMatch = content.match(/(\d+%?.*?)(?:\.|$)/);
    return metricMatch ? metricMatch[1] : 'measurable improvements';
  }
  
  return 'significant business impact';
}

function enhanceWithSystematicApproach(content: string, context: ResumeContext): string {
  const verb = selectImpactVerb('analysis');
  return `${verb} comprehensive data to identify optimization opportunities in ${content}, implementing systematic improvements that enhanced ${context.skills[0] || 'operational'} capabilities by 35%`;
}

function maximizeQuantifiableResults(content: string, context: ResumeContext): string {
  const verb = selectImpactVerb('achievement');
  const metric = generateRealisticMetric(content);
  return `${verb} ${metric.value} improvement in ${extractKeyArea(content)} through strategic ${context.skills[0] || 'process'} optimization, surpassing targets by 40% and earning executive recognition`;
}

function inferChallenge(content: string): string {
  const challenges = [
    'declining performance metrics',
    'complex technical requirements',
    'resource constraints',
    'market disruption',
    'scalability limitations',
    'cross-functional misalignment'
  ];
  
  return challenges[Math.floor(Math.random() * challenges.length)];
}

function extractKeyArea(content: string): string {
  const areas = ['operational efficiency', 'customer satisfaction', 'revenue generation', 'team performance', 'product quality'];
  
  // Try to infer from content
  if (content.toLowerCase().includes('customer')) return 'customer satisfaction';
  if (content.toLowerCase().includes('team')) return 'team performance';
  if (content.toLowerCase().includes('revenue') || content.toLowerCase().includes('sales')) return 'revenue generation';
  
  return areas[Math.floor(Math.random() * areas.length)];
}

function extractYearsFromExperience(experience: string[]): string {
  // Estimate based on number of roles
  const years = Math.max(5, experience.length * 3);
  return years.toString();
}

function enhanceRoleSummaryWithContext(content: string, context: ResumeContext): string {
  const verb = selectImpactVerb('leadership');
  const primarySkill = context.skills[0] || 'strategic';
  const secondarySkill = context.skills[1] || 'operational';
  
  return `${verb} transformative initiatives in ${extractKeyArea(content)}, leveraging expertise in ${primarySkill} and ${secondarySkill} capabilities to deliver sustainable improvements. Recognized for ability to translate strategic vision into actionable results while building collaborative, high-performing teams.`;
}

function addQuantifiableImpact(content: string, context: ResumeContext): string {
  const verb = selectImpactVerb('achievement');
  const metric = generateRealisticMetric(content);
  
  return `${verb} exceptional results through strategic leadership and ${context.skills[0] || 'innovative'} solutions. Delivered ${metric.value} ${metric.type}, while reducing operational costs by 25% and improving team efficiency by 40%. Established scalable processes that continue to drive organizational success.`;
}