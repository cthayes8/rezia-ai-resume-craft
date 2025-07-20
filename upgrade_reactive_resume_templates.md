# Reslo AI - Reactive Resume Templates Implementation Guide

## Overview
This guide details how to implement all of Reactive Resume's beautiful templates into Reslo AI, ensuring users get the same high-quality, professional designs.

## Reactive Resume Templates to Implement

### 1. **Azurill** - Clean Professional
- Single column, classic layout
- Subtle color accents
- Clear section dividers
- Perfect for corporate/traditional industries

### 2. **Bronzor** - Modern Minimal
- Two-column layout
- Sidebar for skills/contact
- Clean typography
- Great for tech/creative roles

### 3. **Chikorita** - Creative Bold
- Asymmetric layout
- Bold header section
- Creative use of space
- Ideal for designers/marketers

### 4. **Ditto** - Simple & Elegant
- Minimalist design
- Focus on content
- Generous whitespace
- Universal appeal

### 5. **Kakuna** - Technical Professional
- Dense information layout
- Optimized for ATS
- Clear hierarchy
- Perfect for engineers/developers

### 6. **Nosepass** - Executive Style
- Premium feel
- Sophisticated typography
- Professional color scheme
- C-suite ready

### 7. **Onyx** - Dark Mode
- Dark background option
- High contrast
- Modern aesthetic
- Stand-out design

### 8. **Pikachu** - Vibrant & Fun
- Colorful accents
- Playful yet professional
- Eye-catching design
- Great for creative industries

### 9. **Rhyhorn** - Academic
- Traditional academic format
- Publication-friendly
- Detailed sections
- Research/education focused

## Implementation Plan

### Phase 1: Template Architecture

```typescript
// types/templates.types.ts
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'modern' | 'creative' | 'simple' | 'technical' | 'academic';
  preview: string;
  
  // Template Configuration
  config: {
    layout: 'single' | 'double' | 'asymmetric';
    colorScheme: ColorScheme;
    typography: Typography;
    spacing: SpacingConfig;
    sections: SectionConfig;
  };
  
  // Rendering
  component: React.ComponentType<TemplateProps>;
  pdfComponent?: React.ComponentType<TemplateProps>; // For PDF export
  
  // Features
  features: {
    atsOptimized: boolean;
    photoSupport: boolean;
    customColors: boolean;
    darkMode?: boolean;
  };
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  text: {
    primary: string;
    secondary: string;
    light: string;
  };
  background: {
    main: string;
    section: string;
    accent: string;
  };
}

interface Typography {
  fontPairs: {
    heading: string;
    body: string;
  };
  sizes: {
    name: string;
    title: string;
    heading: string;
    subheading: string;
    body: string;
    caption: string;
  };
  weights: {
    light: number;
    regular: number;
    medium: number;
    bold: number;
  };
}
```

### Phase 2: Template Components

#### 2.1 Azurill Template (Professional)
```tsx
// templates/azurill/AzurillTemplate.tsx
import React from 'react';
import { TemplateProps } from '@/types/templates';
import styles from './azurill.module.css';

export const AzurillTemplate: React.FC<TemplateProps> = ({ 
  resume, 
  colorOverrides,
  isPrint = false 
}) => {
  const { basics, experience, education, skills, projects } = resume.sections;
  const colors = { ...azurillColors, ...colorOverrides };
  
  return (
    <div className={`${styles.azurillContainer} ${isPrint ? styles.print : ''}`}>
      {/* Header Section */}
      <header 
        className={styles.header}
        style={{ borderBottomColor: colors.primary }}
      >
        <h1 className={styles.name}>
          {basics.firstName} {basics.lastName}
        </h1>
        <p className={styles.headline}>{basics.headline}</p>
        
        <div className={styles.contactInfo}>
          <span>{basics.email}</span>
          <span className={styles.separator}>•</span>
          <span>{basics.phone}</span>
          {basics.location.city && (
            <>
              <span className={styles.separator}>•</span>
              <span>{basics.location.city}, {basics.location.region}</span>
            </>
          )}
        </div>
        
        {basics.profiles.length > 0 && (
          <div className={styles.socialLinks}>
            {basics.profiles.map((profile, idx) => (
              <a 
                key={idx}
                href={profile.url}
                className={styles.socialLink}
                style={{ color: colors.primary }}
              >
                {profile.network}
              </a>
            ))}
          </div>
        )}
      </header>
      
      {/* Professional Summary */}
      {resume.sections.summary?.content && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: colors.primary }}>
            Professional Summary
          </h2>
          <p className={styles.summaryText}>
            {resume.sections.summary.content}
          </p>
        </section>
      )}
      
      {/* Experience Section */}
      {experience.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: colors.primary }}>
            Professional Experience
          </h2>
          
          {experience.map((exp) => (
            <div key={exp.id} className={styles.experienceItem}>
              <div className={styles.experienceHeader}>
                <div>
                  <h3 className={styles.jobTitle}>{exp.position}</h3>
                  <p className={styles.company}>{exp.company}</p>
                </div>
                <div className={styles.dateRange}>
                  {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                </div>
              </div>
              
              {exp.summary && (
                <p className={styles.jobSummary}>{exp.summary}</p>
              )}
              
              {exp.highlights.length > 0 && (
                <ul className={styles.highlights}>
                  {exp.highlights.map((highlight, idx) => (
                    <li key={idx} className={styles.highlight}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
      
      {/* Education Section */}
      {education.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: colors.primary }}>
            Education
          </h2>
          
          {education.map((edu) => (
            <div key={edu.id} className={styles.educationItem}>
              <div className={styles.educationHeader}>
                <div>
                  <h3 className={styles.degree}>{edu.degree} in {edu.field}</h3>
                  <p className={styles.institution}>{edu.institution}</p>
                </div>
                <div className={styles.dateRange}>
                  {formatDate(edu.endDate)}
                </div>
              </div>
              
              {edu.gpa && (
                <p className={styles.gpa}>GPA: {edu.gpa}</p>
              )}
            </div>
          ))}
        </section>
      )}
      
      {/* Skills Section */}
      {skills.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: colors.primary }}>
            Skills
          </h2>
          
          <div className={styles.skillsContainer}>
            {skills.map((skillGroup) => (
              <div key={skillGroup.id} className={styles.skillGroup}>
                <h4 className={styles.skillGroupTitle}>{skillGroup.name}</h4>
                <div className={styles.skillTags}>
                  {skillGroup.items.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className={styles.skillTag}
                      style={{ 
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary 
                      }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Default Azurill color scheme
const azurillColors = {
  primary: '#2563eb',
  secondary: '#3b82f6',
  accent: '#60a5fa',
  text: {
    primary: '#1f2937',
    secondary: '#4b5563',
    light: '#6b7280'
  },
  background: {
    main: '#ffffff',
    section: '#f9fafb',
    accent: '#eff6ff'
  }
};
```

#### 2.2 Pikachu Template (Modern/Vibrant)
```tsx
// templates/pikachu/PikachuTemplate.tsx
import React from 'react';
import { TemplateProps } from '@/types/templates';
import styles from './pikachu.module.css';

export const PikachuTemplate: React.FC<TemplateProps> = ({ 
  resume,
  colorOverrides,
  isPrint = false 
}) => {
  const colors = { ...pikachuColors, ...colorOverrides };
  
  return (
    <div className={`${styles.pikachuContainer} ${isPrint ? styles.print : ''}`}>
      {/* Vibrant Header with Photo Support */}
      <header 
        className={styles.header}
        style={{ backgroundColor: colors.primary }}
      >
        <div className={styles.headerContent}>
          {resume.sections.basics.photo?.url && resume.sections.basics.photo.visible && (
            <div className={styles.photoWrapper}>
              <img 
                src={resume.sections.basics.photo.url}
                alt={`${resume.sections.basics.firstName} ${resume.sections.basics.lastName}`}
                className={styles.photo}
              />
            </div>
          )}
          
          <div className={styles.headerText}>
            <h1 className={styles.name}>
              {resume.sections.basics.firstName}
              <span className={styles.lastName}>{resume.sections.basics.lastName}</span>
            </h1>
            <p className={styles.headline}>{resume.sections.basics.headline}</p>
            
            <div className={styles.contactGrid}>
              <ContactItem icon="email" value={resume.sections.basics.email} />
              <ContactItem icon="phone" value={resume.sections.basics.phone} />
              <ContactItem icon="location" value={`${resume.sections.basics.location.city}, ${resume.sections.basics.location.region}`} />
              <ContactItem icon="web" value={resume.sections.basics.website} />
            </div>
          </div>
        </div>
      </header>
      
      <div className={styles.mainContent}>
        {/* Left Column - Main Content */}
        <div className={styles.leftColumn}>
          {/* Experience with Timeline */}
          {resume.sections.experience.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.titleIcon}>💼</span>
                Experience
              </h2>
              
              <div className={styles.timeline}>
                {resume.sections.experience.map((exp, index) => (
                  <div key={exp.id} className={styles.timelineItem}>
                    <div 
                      className={styles.timelineDot}
                      style={{ backgroundColor: colors.accent }}
                    />
                    <div className={styles.timelineContent}>
                      <h3 className={styles.jobTitle}>{exp.position}</h3>
                      <p className={styles.company}>{exp.company}</p>
                      <p className={styles.duration}>
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      </p>
                      
                      {exp.highlights.map((highlight, idx) => (
                        <div key={idx} className={styles.highlight}>
                          <span className={styles.bulletPoint} style={{ color: colors.accent }}>▸</span>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Projects */}
          {resume.sections.projects?.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.titleIcon}>🚀</span>
                Projects
              </h2>
              
              <div className={styles.projectGrid}>
                {resume.sections.projects.map((project) => (
                  <div key={project.id} className={styles.projectCard}>
                    <h3 className={styles.projectName}>{project.name}</h3>
                    <p className={styles.projectDescription}>{project.description}</p>
                    {project.technologies && (
                      <div className={styles.techStack}>
                        {project.technologies.map((tech, idx) => (
                          <span 
                            key={idx}
                            className={styles.techTag}
                            style={{ backgroundColor: `${colors.accent}20` }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Right Column - Skills & Education */}
        <div className={styles.rightColumn}>
          {/* Skills with Visual Ratings */}
          {resume.sections.skills.length > 0 && (
            <section className={styles.sideSection}>
              <h2 className={styles.sideSectionTitle}>
                <span className={styles.titleIcon}>⚡</span>
                Skills
              </h2>
              
              {resume.sections.skills.map((group) => (
                <div key={group.id} className={styles.skillGroup}>
                  <h4 className={styles.skillGroupName}>{group.name}</h4>
                  {group.items.map((skill, idx) => (
                    <div key={idx} className={styles.skillItem}>
                      <span className={styles.skillName}>{skill.name}</span>
                      {skill.level && (
                        <div className={styles.skillLevel}>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={styles.skillDot}
                              style={{
                                backgroundColor: i < skill.level 
                                  ? colors.accent 
                                  : `${colors.accent}30`
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
          
          {/* Education */}
          {resume.sections.education.length > 0 && (
            <section className={styles.sideSection}>
              <h2 className={styles.sideSectionTitle}>
                <span className={styles.titleIcon}>🎓</span>
                Education
              </h2>
              
              {resume.sections.education.map((edu) => (
                <div key={edu.id} className={styles.educationItem}>
                  <h4 className={styles.degree}>{edu.degree}</h4>
                  <p className={styles.field}>{edu.field}</p>
                  <p className={styles.institution}>{edu.institution}</p>
                  <p className={styles.year}>{formatDate(edu.endDate)}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const pikachuColors = {
  primary: '#fbbf24',
  secondary: '#f59e0b',
  accent: '#dc2626',
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    light: '#ffffff'
  },
  background: {
    main: '#fffbeb',
    section: '#fef3c7',
    accent: '#fee2e2'
  }
};
```

### Phase 3: Template Styles

#### 3.1 Azurill Styles (Clean Professional)
```css
/* templates/azurill/azurill.module.css */
.azurillContainer {
  font-family: 'Inter', -apple-system, sans-serif;
  color: #1f2937;
  line-height: 1.6;
  max-width: 8.5in;
  margin: 0 auto;
  background: white;
}

.header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 2px solid;
  margin-bottom: 2rem;
}

.name {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.headline {
  font-size: 1.25rem;
  color: #4b5563;
  margin: 0 0 1rem;
}

.contactInfo {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.separator {
  color: #d1d5db;
}

.socialLinks {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.socialLink {
  text-decoration: none;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}

.socialLink:hover {
  opacity: 0.8;
}

.section {
  margin-bottom: 2rem;
}

.sectionTitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.experienceItem {
  margin-bottom: 1.5rem;
}

.experienceHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.jobTitle {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.company {
  color: #4b5563;
  margin: 0.25rem 0;
}

.dateRange {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.jobSummary {
  margin: 0.5rem 0;
  color: #374151;
}

.highlights {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  list-style: none;
}

.highlight {
  position: relative;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.highlight:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #3b82f6;
}

.skillsContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skillGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
}

.skillGroupTitle {
  font-weight: 500;
  margin: 0 1rem 0 0;
  min-width: 100px;
}

.skillTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skillTag {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

/* Print Styles */
@media print {
  .azurillContainer {
    font-size: 10pt;
  }
  
  .header {
    padding: 1rem 0;
  }
  
  .section {
    break-inside: avoid;
  }
  
  .experienceItem {
    break-inside: avoid;
  }
}
```

#### 3.2 Pikachu Styles (Modern Vibrant)
```css
/* templates/pikachu/pikachu.module.css */
.pikachuContainer {
  font-family: 'Poppins', -apple-system, sans-serif;
  background: #fffbeb;
  color: #111827;
  line-height: 1.5;
}

.header {
  padding: 3rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.headerContent {
  display: flex;
  align-items: center;
  gap: 3rem;
  position: relative;
  z-index: 1;
}

.photoWrapper {
  flex-shrink: 0;
}

.photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.name {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
}

.lastName {
  display: block;
  font-weight: 300;
}

.headline {
  font-size: 1.25rem;
  margin: 0.5rem 0 1.5rem;
  opacity: 0.95;
}

.contactGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.contactItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.mainContent {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  padding: 3rem;
}

.section {
  margin-bottom: 2.5rem;
}

.sectionTitle {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.titleIcon {
  font-size: 1.5rem;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  background: #e5e7eb;
}

.timelineItem {
  position: relative;
  margin-bottom: 2rem;
}

.timelineDot {
  position: absolute;
  left: -1.5rem;
  top: 0.5rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.projectGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.projectCard {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.projectCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.rightColumn {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.sideSection {
  margin-bottom: 2rem;
}

.sideSectionTitle {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.skillItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.skillLevel {
  display: flex;
  gap: 0.25rem;
}

.skillDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

/* Responsive Design */
@media (max-width: 768px) {
  .mainContent {
    grid-template-columns: 1fr;
  }
  
  .rightColumn {
    position: static;
  }
}

/* Print Optimization */
@media print {
  .pikachuContainer {
    background: white;
  }
  
  .header {
    background: black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .projectCard {
    break-inside: avoid;
  }
}
```

### Phase 4: Template Selection UI

```tsx
// components/resume-builder/TemplateSelector.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, FileText, Palette } from 'lucide-react';
import { templates } from '@/templates';

interface TemplateSelectorProps {
  currentTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  atsScore?: number;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  currentTemplate,
  onSelectTemplate,
  atsScore
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const filteredTemplates = Object.values(templates).filter(
    template => filterCategory === 'all' || template.category === filterCategory
  );
  
  const categories = [
    { id: 'all', label: 'All Templates', icon: FileText },
    { id: 'professional', label: 'Professional', icon: FileText },
    { id: 'modern', label: 'Modern', icon: Sparkles },
    { id: 'creative', label: 'Creative', icon: Palette },
    { id: 'simple', label: 'Simple & Clean', icon: FileText },
  ];
  
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={filterCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat.id)}
            className="gap-2"
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </Button>
        ))}
      </div>
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              currentTemplate === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="relative">
              {/* Template Preview */}
              <div className="aspect-[8.5/11] bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={template.preview}
                  alt={template.name}
                  className="w-full h-full object-cover object-top"
                />
                
                {/* Hover Overlay */}
                {hoveredTemplate === template.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      Preview Template
                    </Button>
                  </div>
                )}
                
                {/* Selected Badge */}
                {currentTemplate === template.id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-blue-500">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  {template.features.atsOptimized && (
                    <Badge variant="outline" className="text-xs">
                      ATS Optimized
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>
                
                <div className="flex gap-2 flex-wrap">
                  {template.features.darkMode && (
                    <Badge variant="secondary" className="text-xs">
                      Dark Mode
                    </Badge>
                  )}
                  {template.features.photoSupport && (
                    <Badge variant="secondary" className="text-xs">
                      Photo Support
                    </Badge>
                  )}
                  {template.features.customColors && (
                    <Badge variant="secondary" className="text-xs">
                      Custom Colors
                    </Badge>
                  )}
                </div>
                
                {/* ATS Compatibility Warning */}
                {atsScore && !template.features.atsOptimized && atsScore < 70 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    This template may reduce your ATS score
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### Phase 5: Template Customization

```tsx
// components/resume-builder/TemplateCustomizer.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Palette, Type, Layout, Spacing } from 'lucide-react';

interface TemplateCustomizerProps {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  customization,
  onChange
}) => {
  const handleColorChange = (key: string, value: string) => {
    onChange({
      ...customization,
      colors: {
        ...customization.colors,
        [key]: value
      }
    });
  };
  
  const handleFontChange = (key: string, value: string) => {
    onChange({
      ...customization,
      typography: {
        ...customization.typography,
        [key]: value
      }
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Color Customization */}
      {template.features.customColors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={customization.colors?.primary || template.config.colorScheme.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={customization.colors?.primary || template.config.colorScheme.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Accent Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={customization.colors?.accent || template.config.colorScheme.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={customization.colors?.accent || template.config.colorScheme.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
            
            {/* Quick Color Schemes */}
            <div className="pt-2">
              <Label className="text-xs mb-2 block">Quick Schemes</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.name}
                    onClick={() => onChange({ ...customization, colors: scheme.colors })}
                    className="h-8 rounded flex overflow-hidden border hover:scale-105 transition-transform"
                    title={scheme.name}
                  >
                    <div className="flex-1" style={{ backgroundColor: scheme.colors.primary }} />
                    <div className="flex-1" style={{ backgroundColor: scheme.colors.accent }} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs w-8">10pt</span>
              <Slider
                value={[customization.fontSize || 11]}
                onValueChange={([value]) => onChange({ ...customization, fontSize: value })}
                min={10}
                max={14}
                step={0.5}
                className="flex-1"
              />
              <span className="text-xs w-8">{customization.fontSize || 11}pt</span>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Font Family</Label>
            <select
              value={customization.fontFamily || template.config.typography.fontPairs.body}
              onChange={(e) => onChange({ ...customization, fontFamily: e.target.value })}
              className="w-full mt-1 text-sm border rounded px-2 py-1"
            >
              <option value="Inter">Inter (Modern)</option>
              <option value="Arial">Arial (Classic)</option>
              <option value="Times New Roman">Times New Roman (Traditional)</option>
              <option value="Georgia">Georgia (Elegant)</option>
              <option value="Roboto">Roboto (Clean)</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      {/* Layout Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Page Margins</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['Narrow', 'Normal', 'Wide'].map((margin) => (
                <Button
                  key={margin}
                  variant={customization.margins === margin.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange({ ...customization, margins: margin.toLowerCase() })}
                  className="text-xs"
                >
                  {margin}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Line Spacing</Label>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs w-8">1.0</span>
              <Slider
                value={[customization.lineHeight || 1.5]}
                onValueChange={([value]) => onChange({ ...customization, lineHeight: value })}
                min={1.0}
                max={2.0}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs w-8">{customization.lineHeight || 1.5}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Predefined color schemes
const colorSchemes = [
  {
    name: 'Professional Blue',
    colors: { primary: '#2563eb', accent: '#3b82f6' }
  },
  {
    name: 'Modern Teal',
    colors: { primary: '#0d9488', accent: '#14b8a6' }
  },
  {
    name: 'Creative Purple',
    colors: { primary: '#7c3aed', accent: '#a78bfa' }
  },
  {
    name: 'Warm Orange',
    colors: { primary: '#ea580c', accent: '#fb923c' }
  },
  {
    name: 'Corporate Gray',
    colors: { primary: '#374151', accent: '#6b7280' }
  },
  {
    name: 'Fresh Green',
    colors: { primary: '#059669', accent: '#34d399' }
  },
  {
    name: 'Bold Red',
    colors: { primary: '#dc2626', accent: '#ef4444' }
  },
  {
    name: 'Classic Black',
    colors: { primary: '#000000', accent: '#525252' }
  }
];
```

## Implementation Benefits

By implementing these templates, Reslo AI will have:

1. **Professional Design Quality**: Each template is carefully crafted with proper typography, spacing, and visual hierarchy

2. **ATS Optimization Built-in**: Templates like Azurill and Kakuna are specifically designed to parse well with ATS systems

3. **Customization Options**: Users can adjust colors, fonts, and spacing while maintaining the template's professional structure

4. **Responsive Design**: Templates work perfectly on screen and print, with proper page breaks and formatting

5. **Modern Aesthetics**: From clean professional to creative vibrant, covering all user needs

6. **Easy Template Switching**: Users can switch between templates without losing content, seeing their resume in different styles instantly

The templates are implemented as React components, making them:
- Fast to render
- Easy to customize
- Consistent with your existing tech stack
- Maintainable and extensible

Each template maintains the same high quality as Reactive Resume while being fully integrated with your ATS optimization features!