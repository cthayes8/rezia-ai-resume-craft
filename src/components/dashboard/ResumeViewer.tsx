
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ResumeTemplate = "professional" | "modern" | "creative";

const ResumeViewer = () => {
  const [template, setTemplate] = useState<ResumeTemplate>("professional");
  const [showOriginal, setShowOriginal] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Resume downloaded",
      description: "Your resume has been downloaded successfully.",
    });
  };

  const toggleResume = () => {
    setShowOriginal(!showOriginal);
  };

  // Mock resume content
  const renderResumeContent = () => {
    if (showOriginal) {
      return (
        <div className="p-8 bg-white border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Original Resume</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">John Doe</h3>
              <p className="text-gray-600">Software Engineer</p>
              <p className="text-gray-600">john.doe@example.com | (123) 456-7890</p>
            </div>
            <div>
              <h3 className="text-md font-semibold border-b pb-1">Experience</h3>
              <div className="mt-2">
                <p className="font-medium">Software Developer, Tech Company</p>
                <p className="text-sm text-gray-600">Jan 2020 - Present</p>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  <li>Developed web applications using React and Node.js</li>
                  <li>Implemented feature X resulting in 20% increase in user engagement</li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold border-b pb-1">Education</h3>
              <div className="mt-2">
                <p className="font-medium">Bachelor of Science in Computer Science</p>
                <p className="text-sm text-gray-600">University Name, 2015-2019</p>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold border-b pb-1">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">JavaScript</span>
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">React</span>
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">Node.js</span>
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">HTML/CSS</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Different templates for optimized resume
    switch (template) {
      case "modern":
        return (
          <div className="p-8 bg-white border rounded-lg">
            <div className="border-l-4 border-rezia-blue pl-4">
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-rezia-blue">Full Stack Developer</p>
              <div className="text-sm text-gray-600 mt-1">john.doe@example.com | (123) 456-7890</div>
            </div>
            
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Experience</h3>
                <div className="mt-2">
                  <div className="flex justify-between">
                    <p className="font-medium">Senior Developer, Tech Company</p>
                    <p className="text-sm text-gray-600">Jan 2020 - Present</p>
                  </div>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Led development of front-end applications using React, resulting in 35% faster load times</li>
                    <li>Architected microservices using Node.js to improve system scalability</li>
                    <li>Implemented CI/CD pipeline reducing deployment time by 40%</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Education</h3>
                <div className="mt-2">
                  <div className="flex justify-between">
                    <p className="font-medium">Bachelor of Science in Computer Science</p>
                    <p className="text-sm text-gray-600">2015-2019</p>
                  </div>
                  <p className="text-sm">University Name - GPA: 3.8/4.0</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-rezia-blue text-xs rounded-full">React</span>
                  <span className="px-3 py-1 bg-blue-50 text-rezia-blue text-xs rounded-full">Node.js</span>
                  <span className="px-3 py-1 bg-blue-50 text-rezia-blue text-xs rounded-full">TypeScript</span>
                  <span className="px-3 py-1 bg-blue-50 text-rezia-blue text-xs rounded-full">AWS</span>
                  <span className="px-3 py-1 bg-blue-50 text-rezia-blue text-xs rounded-full">CI/CD</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "creative":
        return (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white border rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold">John Doe</h2>
              <p className="text-xl text-rezia-blue mt-1">Full Stack Developer</p>
              <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
                <span>john.doe@example.com</span>
                <span>•</span>
                <span>(123) 456-7890</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-bold text-lg pb-2 border-b-2 border-rezia-blue">Experience</h3>
                <div className="mt-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                    <p className="font-bold">Senior Developer</p>
                    <p className="text-rezia-blue italic">Tech Company (Jan 2020 - Present)</p>
                  </div>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                    <li>Revamped UI architecture using React and TypeScript, leading to 35% improvement in user satisfaction metrics</li>
                    <li>Designed and implemented cloud-native microservices using Node.js and AWS</li>
                    <li>Led Agile development team of 5 developers, exceeding delivery targets by 20%</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg pb-2 border-b-2 border-rezia-blue">Skills & Tools</h3>
                <div className="mt-4 space-y-2">
                  <div>
                    <p className="font-medium">Development</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">React</span>
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">Node.js</span>
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">TypeScript</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">DevOps</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">AWS</span>
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">Docker</span>
                      <span className="px-2 py-1 bg-rezia-blue text-white text-xs rounded">CI/CD</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg pb-2 border-b-2 border-rezia-blue mt-6">Education</h3>
                <div className="mt-4">
                  <p className="font-bold">Bachelor of Science</p>
                  <p className="text-sm">Computer Science</p>
                  <p className="text-sm text-gray-600">University Name, 2019</p>
                </div>
              </div>
            </div>
          </div>
        );

      default: // professional
        return (
          <div className="p-8 bg-white border rounded-lg">
            <h2 className="text-2xl font-bold mb-1">John Doe</h2>
            <p className="text-gray-700">Full Stack Developer</p>
            <div className="text-sm text-gray-600 mt-1 mb-6">john.doe@example.com | (123) 456-7890</div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Professional Summary</h3>
                <p className="mt-2 text-sm">
                  Results-driven Full Stack Developer with 5+ years of experience in building and optimizing 
                  web applications. Proficient in React, Node.js, and AWS cloud services with a proven track
                  record of improving application performance and implementing scalable solutions.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Experience</h3>
                <div className="mt-3">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold">Senior Developer</p>
                    <p className="text-sm text-gray-600">Jan 2020 - Present</p>
                  </div>
                  <p className="text-sm italic mb-1">Tech Company, San Francisco, CA</p>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Architected and implemented front-end applications using React and TypeScript, resulting in 35% faster load times</li>
                    <li>Developed microservices using Node.js, Express, and MongoDB that process 2M+ requests daily</li>
                    <li>Implemented automated testing with Jest and Cypress, achieving 90% code coverage</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Education</h3>
                <div className="mt-3">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold">Bachelor of Science in Computer Science</p>
                    <p className="text-sm text-gray-600">2015-2019</p>
                  </div>
                  <p className="text-sm italic">University Name - GPA: 3.8/4.0</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-1">Technical Skills</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium">Languages:</p>
                    <p>JavaScript, TypeScript, HTML, CSS, SQL</p>
                  </div>
                  <div>
                    <p className="font-medium">Frameworks & Libraries:</p>
                    <p>React, Node.js, Express.js</p>
                  </div>
                  <div>
                    <p className="font-medium">Tools & Platforms:</p>
                    <p>AWS, Git, Docker, Jenkins</p>
                  </div>
                  <div>
                    <p className="font-medium">Methodologies:</p>
                    <p>Agile, Scrum, CI/CD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800 mr-6">Your Resume</h1>
          <button 
            className="flex items-center text-sm text-gray-600 hover:text-rezia-blue transition-colors"
            onClick={toggleResume}
          >
            {showOriginal ? (
              <>
                <ToggleRight className="h-5 w-5 mr-1" />
                <span>Showing Original</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 mr-1" />
                <span>Showing Optimized</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {!showOriginal && (
            <Select value={template} onValueChange={(value) => setTemplate(value as ResumeTemplate)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button 
            className="bg-rezia-blue hover:bg-rezia-blue/90 flex items-center gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        {renderResumeContent()}
      </div>
    </div>
  );
};

export default ResumeViewer;
