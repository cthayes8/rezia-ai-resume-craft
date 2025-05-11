import { ResumeData } from '@/types/resume';

/**
 * Serialize a ResumeData object into semantic HTML for WYSIWYG editing.
 * Renders headings, paragraphs, lists, and links to mirror the final resume layout.
 */
export function resumeDataToHTML(resume: ResumeData): string {
  // Escape HTML special characters; safe for undefined or empty strings
  const escapeHTML = (str?: string): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  let html = '';
  // Name and contact
  html += `<h1 style="margin:0;">${escapeHTML(resume.name)}</h1>`;
  const contacts: string[] = [];
  if (resume.contact.email) {
    contacts.push(escapeHTML(resume.contact.email));
  }
  // Multiple links (LinkedIn, personal site, etc.)
  if (resume.contact.links && Array.isArray(resume.contact.links)) {
    resume.contact.links.forEach((url) => {
      const safe = escapeHTML(url);
      contacts.push(`<a href=\"${safe}\" target=\"_blank\">${safe}</a>`);
    });
  }
  if (resume.contact.phone) {
    contacts.push(escapeHTML(resume.contact.phone));
  }
  if (contacts.length) html += `<p>${contacts.join(' | ')}</p>`;

  // Summary
  html += `<h2>PROFESSIONAL SUMMARY</h2><p>${escapeHTML(resume.summary)}</p>`;

  // Work Experience
  if (resume.work?.length) {
    html += '<h2>WORK EXPERIENCE</h2>';
    resume.work.forEach((job) => {
      const dates = [job.from, job.to].filter(Boolean).map(escapeHTML).join(' – ');
      html += `<h3>${escapeHTML(job.title)} | ${escapeHTML(job.company)}${
        dates ? ' | ' + dates : ''
      }</h3>`;
      html += '<ul>';
      job.bullets.forEach((b) => {
        html += `<li>${escapeHTML(b)}</li>`;
      });
      html += '</ul>';
    });
  }

  // Education
  if (resume.education?.length) {
    html += '<h2>EDUCATION</h2>';
    resume.education.forEach((edu) => {
      const dates = [edu.from, edu.to].filter(Boolean).map(escapeHTML).join(' – ');
      html += `<h3>${escapeHTML(edu.degree)} | ${escapeHTML(
        edu.institution
      )}${dates ? ' | ' + dates : ''}</h3>`;
    });
  }

  // Skills: comma-separated list
  if (resume.skills?.length) {
    html += '<h2>SKILLS & ABILITIES</h2>';
    const skillsLine = resume.skills.map(escapeHTML).join(', ');
    html += `<p>${skillsLine}</p>`;
  }

  // Certifications
  if (resume.certifications?.length) {
    html += '<h2>CERTIFICATIONS</h2><ul>';
    resume.certifications.forEach((cert) => {
      if (typeof cert === 'string') {
        html += '<li>' + escapeHTML(cert) + '</li>';
      } else {
        const issuer = cert.issuer ? ' | ' + escapeHTML(cert.issuer) : '';
        html += '<li>' + escapeHTML(cert.name) + issuer + '</li>';
      }
    });
    html += '</ul>';
  }

  // Awards
  if (resume.awards?.length) {
    html += '<h2>AWARDS & HONORS</h2><ul>';
    resume.awards.forEach((award) => {
      if (typeof award === 'string') {
        html += '<li>' + escapeHTML(award) + '</li>';
      } else {
        const date = award.date ? ' | ' + escapeHTML(award.date) : '';
        html += '<li>' + escapeHTML(award.title) + date + '</li>';
      }
    });
    html += '</ul>';
  }

  // Projects
  if (resume.projects?.length) {
    html += '<h2>PROJECTS</h2>';
    resume.projects.forEach((proj) => {
      html += `<h3>${escapeHTML(proj.name)}</h3><p>${escapeHTML(
        proj.description
      )}</p>`;
      if (proj.technologies?.length) {
        html += `<p><strong>Technologies:</strong> ${proj.technologies
          .map(escapeHTML)
          .join(', ')}</p>`;
      }
      if (proj.link) {
        html += `<p><a href=\"${escapeHTML(proj.link)}\" target=\"_blank\">${escapeHTML(
          proj.link
        )}</a></p>`;
      }
    });
  }

  // Languages
  if (resume.languages?.length) {
    html += '<h2>LANGUAGES</h2><ul>';
    resume.languages.forEach((lang) => {
      html += `<li>${escapeHTML(lang)}</li>`;
    });
    html += '</ul>';
  }

  // Wrap in container for editor styling
  return `<div class=\"resume-content\">${html}</div>`;
}