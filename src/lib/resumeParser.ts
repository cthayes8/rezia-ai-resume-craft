import { ResumeData, WorkExperience, Education, Certification, Award, Project } from '@/types/resume';

/**
 * Recursively extract text from a ProseMirror node.
 */
function getText(node: any): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map((child: any) => getText(child)).join('');
}

/**
 * Parses TipTap (ProseMirror) JSON into a ResumeData object.
 * Maintains the same shape as AI-generated JSON, so edits sync with download.
 */
export function parseEditorJSON(pmJSON: any): ResumeData {
  const resume: ResumeData = {
    name: '',
    contact: { email: '', phone: undefined, link: undefined },
    summary: '',
    skills: [],
    work: [],
    education: [],
    awards: [],
    certifications: [],
    projects: [],
    languages: [],
  };
  let currentSection: string | null = null;
  const nodes = pmJSON.content || [];
  for (const node of nodes) {
    // H1 as Name
    if (node.type === 'heading' && node.attrs?.level === 1) {
      resume.name = getText(node);
      continue;
    }
    // First paragraph as contact line
    if (node.type === 'paragraph' && resume.name && !resume.contact.email) {
      const text = getText(node);
      const parts = text.split(' | ');
      parts.forEach(part => {
        if (part.includes('@')) resume.contact.email = part;
        else if (/^https?:\/\//.test(part)) resume.contact.link = part;
        else if (/\d/.test(part)) resume.contact.phone = part;
      });
      continue;
    }
    // H2 defines section
    if (node.type === 'heading' && node.attrs?.level === 2) {
      const heading = getText(node).toLowerCase();
      if (heading.includes('summary')) currentSection = 'summary';
      else if (heading.includes('skills')) currentSection = 'skills';
      else if (heading.includes('work')) currentSection = 'work';
      else if (heading.includes('education')) currentSection = 'education';
      else if (heading.includes('certification')) currentSection = 'certifications';
      else if (heading.includes('award')) currentSection = 'awards';
      else if (heading.includes('project')) currentSection = 'projects';
      else if (heading.includes('language')) currentSection = 'languages';
      else currentSection = null;
      continue;
    }
    // Content based on section
    if (currentSection === 'summary' && node.type === 'paragraph') {
      resume.summary = getText(node);
      continue;
    }
    // Skills: parse comma-separated paragraph
    if (currentSection === 'skills') {
      if (node.type === 'paragraph') {
        const text = getText(node);
        resume.skills = text
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        continue;
      }
    }
    if (currentSection === 'work') {
      if (node.type === 'heading' && node.attrs?.level === 3) {
        const parts = getText(node).split(' | ');
        const [title, company, dates] = parts;
        let from: string | undefined;
        let to: string | undefined;
        if (dates) {
          const range = dates.split(' – ');
          from = range[0]; to = range[1];
        }
        resume.work.push({ title, company, from, to, bullets: [] });
        continue;
      }
      if (node.type === 'bulletList' && resume.work.length) {
        const last = resume.work[resume.work.length - 1];
        node.content.forEach((li: any) => {
          last.bullets.push(getText(li.content[0]));
        });
        continue;
      }
    }
    if (currentSection === 'education' && node.type === 'heading' && node.attrs?.level === 3) {
      const parts = getText(node).split(' | ');
      const [degree, institution, dates] = parts;
      let from: string | undefined;
      let to: string | undefined;
      if (dates) { const range = dates.split(' – '); from = range[0]; to = range[1]; }
      resume.education.push({ institution, degree, from, to });
      continue;
    }
    if (currentSection === 'certifications' && node.type === 'bulletList') {
      resume.certifications = node.content.map((li: any) => {
        const parts = getText(li.content[0]).split(' | ');
        return { name: parts[0], issuer: parts[1] } as Certification;
      });
      continue;
    }
    if (currentSection === 'awards' && node.type === 'bulletList') {
      resume.awards = node.content.map((li: any) => {
        const parts = getText(li.content[0]).split(' | ');
        return { title: parts[0], date: parts[1] } as Award;
      });
      continue;
    }
    if (currentSection === 'projects') {
      if (node.type === 'heading' && node.attrs?.level === 3) {
        resume.projects.push({ name: getText(node), description: '', technologies: [], link: undefined });
        continue;
      }
      if (node.type === 'paragraph' && resume.projects.length) {
        const last = resume.projects[resume.projects.length - 1];
        const text = getText(node);
        if (text.startsWith('Technologies:')) {
          last.technologies = text.replace(/^Technologies:\s*/i, '').split(',').map(s => s.trim());
        } else if (/^https?:\/\//.test(text)) {
          last.link = text;
        } else if (!last.description) {
          last.description = text;
        }
        continue;
      }
    }
    if (currentSection === 'languages' && node.type === 'bulletList') {
      resume.languages = node.content.map((li: any) => getText(li.content[0]));
      continue;
    }
  }
  return resume;
}