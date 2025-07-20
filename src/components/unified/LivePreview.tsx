'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedResume, KeywordMatch } from '@/types/resume';

interface LivePreviewProps {
  resume: UnifiedResume;
  scale?: number;
  highlights?: KeywordMatch[];
  showATSScore?: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  resume,
  scale = 1,
  highlights = [],
  showATSScore = false
}) => {
  const { builder } = resume;
  const { metadata, sections } = builder;

  return (
    <div 
      className="bg-white shadow-lg mx-auto transition-all duration-200"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: scale < 1 ? `${100 / scale}%` : '100%'
      }}
    >
      {/* ATS Score Overlay */}
      {showATSScore && (
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            variant={resume.optimization.analysis.atsScore >= 80 ? "default" : "destructive"}
            className="text-sm"
          >
            ATS Score: {resume.optimization.analysis.atsScore}%
          </Badge>
        </div>
      )}

      <div 
        className="p-8 text-gray-900"
        style={{ 
          fontFamily: metadata.fontFamily,
          fontSize: `${metadata.fontSize}px`,
          color: metadata.color.text
        }}
      >
        {/* Header Section */}
        <header className="text-center mb-6">
          <h1 
            className="font-bold mb-2"
            style={{ 
              fontSize: '2rem',
              color: metadata.color.primary 
            }}
          >
            {sections.basics.firstName} {sections.basics.lastName}
          </h1>
          
          {sections.basics.headline && (
            <p 
              className="text-lg mb-3"
              style={{ color: metadata.color.accent }}
            >
              {sections.basics.headline}
            </p>
          )}
          
          <div className="flex justify-center flex-wrap gap-4 text-sm">
            {sections.basics.email && (
              <span>{sections.basics.email}</span>
            )}
            {sections.basics.phone && (
              <span>{sections.basics.phone}</span>
            )}
            {sections.basics.location.city && (
              <span>
                {sections.basics.location.city}, {sections.basics.location.region}
              </span>
            )}
            {sections.basics.website && (
              <span>{sections.basics.website}</span>
            )}
          </div>
        </header>

        {/* Summary Section */}
        {builder.visibility.summary && sections.summary.content && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-3 border-b-2 pb-1"
              style={{ 
                color: metadata.color.primary,
                borderColor: metadata.color.primary 
              }}
            >
              Professional Summary
            </h2>
            <p className="text-justify leading-relaxed">
              {sections.summary.content}
            </p>
          </section>
        )}

        {/* Experience Section */}
        {builder.visibility.experience && sections.experience.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 border-b-2 pb-1"
              style={{ 
                color: metadata.color.primary,
                borderColor: metadata.color.primary 
              }}
            >
              Professional Experience
            </h2>
            <div className="space-y-4">
              {sections.experience.map((exp, index) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-lg">{exp.position}</h3>
                    <span className="text-sm text-gray-600">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700 mb-2">{exp.company}</p>
                  {exp.summary && (
                    <p className="mb-2 text-gray-800">{exp.summary}</p>
                  )}
                  {exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-gray-800">
                      {exp.highlights.filter(h => h.trim()).map((highlight, hIndex) => (
                        <li key={hIndex}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        {builder.visibility.education && sections.education.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 border-b-2 pb-1"
              style={{ 
                color: metadata.color.primary,
                borderColor: metadata.color.primary 
              }}
            >
              Education
            </h2>
            <div className="space-y-3">
              {sections.education.map((edu, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <span className="text-sm text-gray-600">
                      {edu.from} - {edu.to}
                    </span>
                  </div>
                  <p className="text-gray-700">{edu.institution}</p>
                  {edu.field && (
                    <p className="text-gray-600 text-sm">{edu.field}</p>
                  )}
                  {edu.gpa && (
                    <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {builder.visibility.skills && sections.skills.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 border-b-2 pb-1"
              style={{ 
                color: metadata.color.primary,
                borderColor: metadata.color.primary 
              }}
            >
              Skills
            </h2>
            <div className="space-y-3">
              {sections.skills.map((skillGroup, index) => (
                <div key={index}>
                  <h3 className="font-medium text-gray-800 mb-1">{skillGroup.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.items.filter(skill => skill.name.trim()).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: `${metadata.color.primary}20`,
                          color: metadata.color.primary
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

        {/* Projects Section */}
        {builder.visibility.projects && sections.projects.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 border-b-2 pb-1"
              style={{ 
                color: metadata.color.primary,
                borderColor: metadata.color.primary 
              }}
            >
              Projects
            </h2>
            <div className="space-y-3">
              {sections.projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-gray-700 mb-1">{project.description}</p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${metadata.color.accent}20`,
                            color: metadata.color.accent
                          }}
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

        {/* Custom Sections */}
        {sections.custom && sections.custom.map((customSection) => (
          builder.visibility[customSection.id] && (
            <section key={customSection.id} className="mb-6">
              <h2 
                className="text-xl font-semibold mb-4 border-b-2 pb-1"
                style={{ 
                  color: metadata.color.primary,
                  borderColor: metadata.color.primary 
                }}
              >
                {customSection.title}
              </h2>
              <div className="space-y-2">
                {customSection.content && (
                  <p className="text-gray-700">{customSection.content}</p>
                )}
                {customSection.items && customSection.items.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {customSection.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )
        ))}
      </div>
    </div>
  );
};