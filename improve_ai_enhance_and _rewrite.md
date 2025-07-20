Looking at your Reslo resume builder, I can see the AI Rewrite and AI Enhance buttons. Here's a comprehensive strategy to make these features produce high-quality, natural-sounding content instead of keyword-stuffed text:

# AI Rewrite & Enhance Strategy for Reslo

## 1. **Differentiate the Two Features**

### AI Rewrite (Complete Transformation)
```
Purpose: Full restructure while preserving core information
When to use: Content is accurate but poorly written
Goal: Professional polish with improved impact
```

### AI Enhance (Subtle Improvement)
```
Purpose: Optimize existing good content
When to use: Content is good but needs refinement
Goal: Add metrics, keywords naturally, improve clarity
```

## 2. **Smart Context Collection**

Before any AI call, gather this context:

```javascript
const contextData = {
  // User Profile
  careerLevel: "mid-senior", // from experience years
  currentRole: "National Account Executive",
  targetRole: "Enterprise Sales Director", // if provided
  industry: "Technology/SaaS",
  
  // Document Context
  otherSections: {
    skills: ["No-Code Development", "Workflow Automation"],
    achievements: ["Q2 2023 Channel MVP", "$35M revenue"],
    companies: ["T-Mobile", "MarketSpark", "Sensilek"]
  },
  
  // Smart Keywords
  relevantKeywords: extractSmartKeywords(), // see below
  
  // Writing Style
  currentTone: analyzeWritingStyle(existingContent),
  desiredTone: "executive" // based on career level
}
```

## 3. **Smart Keyword Strategy**

Instead of jamming keywords, use contextual placement:

```javascript
function extractSmartKeywords() {
  return {
    primary: ["strategic leadership", "revenue growth", "enterprise sales"],
    secondary: ["cross-functional", "stakeholder management", "SaaS"],
    technical: ["Salesforce", "HubSpot", "analytics"],
    avoid: ["synergy", "leverage", "utilize"] // overused terms
  }
}
```

## 4. **Prompting Templates**

### For AI Rewrite:
```xml
<rewrite_request>
  <role>Expert resume writer specializing in {industry} executive roles</role>
  
  <task>Completely rewrite this content to be more impactful and professional</task>
  
  <original_content>{content}</original_content>
  
  <context>
    <career_level>{level}</career_level>
    <target_audience>Hiring managers for {targetRole}</target_audience>
    <company_context>{recentCompanies}</company_context>
  </context>
  
  <instructions>
    1. Preserve ALL factual information
    2. Start with strong action verbs
    3. Add quantifiable impact where logical
    4. Use industry-appropriate language
    5. Keep concise - max 3 lines per bullet
  </instructions>
  
  <keyword_guidance>
    Include these naturally where relevant: {keywords}
    DO NOT force keywords - readability is priority
  </keyword_guidance>
  
  <quality_check>
    ✓ Sounds natural when read aloud
    ✓ No keyword stuffing
    ✓ Maintains professional tone
    ✓ Highlights achievements over duties
  </quality_check>
</rewrite_request>
```

### For AI Enhance:
```xml
<enhance_request>
  <role>Resume optimization specialist</role>
  
  <task>Subtly improve this already good content</task>
  
  <original_content>{content}</original_content>
  
  <enhancement_focus>
    - Add metrics/numbers where reasonable
    - Strengthen action verbs if weak
    - Improve clarity without changing meaning
    - Add 1-2 relevant keywords maximum
  </enhancement_focus>
  
  <constraints>
    - Maintain original style/voice
    - Don't add fake metrics
    - Keep changes minimal
    - Preserve authenticity
  </constraints>
</enhance_request>
```

## 5. **Implementation Strategy**

### Pre-Processing Logic:
```javascript
class ResumeAIService {
  async rewriteContent(content, section, context) {
    // 1. Analyze content quality
    const contentAnalysis = this.analyzeContent(content);
    
    // 2. Determine approach
    if (contentAnalysis.hasMetrics && contentAnalysis.strongVerbs) {
      return this.enhance(content, context);
    } else {
      return this.rewrite(content, context);
    }
  }
  
  analyzeContent(content) {
    return {
      hasMetrics: /\d+[%$KM]|\d{2,}/.test(content),
      strongVerbs: this.checkActionVerbs(content),
      length: content.split(' ').length,
      keywordDensity: this.calculateKeywordDensity(content)
    };
  }
  
  preventKeywordStuffing(suggestedContent, keywords) {
    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      return count + (suggestedContent.match(regex) || []).length;
    }, 0);
    
    const wordCount = suggestedContent.split(' ').length;
    const density = keywordCount / wordCount;
    
    // If keyword density > 5%, flag for regeneration
    return density <= 0.05;
  }
}
```

### Post-Processing Validation:
```javascript
function validateAIOutput(original, rewritten) {
  const checks = {
    factualAccuracy: checkFactsPreserved(original, rewritten),
    readability: calculateReadabilityScore(rewritten) > 60,
    keywordStuffing: !detectKeywordStuffing(rewritten),
    length: rewritten.length < original.length * 1.5,
    professionalTone: checkProfessionalLanguage(rewritten)
  };
  
  return Object.values(checks).every(check => check === true);
}
```

## 6. **Section-Specific Strategies**

### Professional Summary:
- Max 4 lines
- Include years of experience
- 2-3 key achievements
- Forward-looking statement

### Experience Bullets:
- Start with varied action verbs
- Include metrics in 50% of bullets
- Show progression/growth
- Connect to business impact

### Key Achievements:
- Quantify everything possible
- Use CAR format (Challenge-Action-Result)
- Highlight unique accomplishments

## 7. **User Control Features**

Add these options to give users control:

```javascript
const enhancementOptions = {
  tone: ['Professional', 'Executive', 'Technical', 'Creative'],
  focus: ['Achievements', 'Leadership', 'Technical Skills', 'Growth'],
  keywords: {
    auto: true, // Auto-detect from job description
    manual: [], // User can add specific keywords
    limit: 5 // Maximum keywords to include
  }
};
```

## 8. **A/B Testing Framework**

Track which rewrites perform better:

```javascript
const rewriteMetrics = {
  userAcceptance: 0.85, // % of rewrites kept
  editRate: 0.15, // % requiring manual edits
  conversionRate: null, // Track if shared/downloaded
  feedbackScore: 4.5 // User rating
};
```

## 9. **Error Prevention**

Common issues to check for:
- Duplicate action verbs in consecutive bullets
- Unrealistic metrics (1000% growth)
- Generic corporate jargon
- Lost technical specifics
- Changed facts or dates

## 10. **Example Transformations**

### Before (Keyword Stuffed):
"Served as strategic leader responsible for cultivated strategic partner relationships to, driving organizational excellence through innovative solutions and collaborative leadership."

### After (Natural):
"Led partner relationship strategy for 15+ enterprise accounts, securing $12M in new business through collaborative solution design and consistent quarterly business reviews."

By implementing this strategy, your AI features will produce natural, impactful content that helps users rather than creating awkward, keyword-heavy text. The key is context awareness, smart constraints, and post-processing validation.