
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, Trash2 } from "lucide-react";

type ResumeHistoryItem = {
  id: string;
  date: string;
  jobTitle: string;
  company: string;
};

const HistoryPage = () => {
  // Mock history data
  const historyItems: ResumeHistoryItem[] = [
    {
      id: "1",
      date: "May 6, 2025",
      jobTitle: "Senior Frontend Developer",
      company: "Tech Company Inc."
    },
    {
      id: "2",
      date: "May 4, 2025",
      jobTitle: "Full Stack Engineer",
      company: "Startup XYZ"
    },
    {
      id: "3",
      date: "May 1, 2025",
      jobTitle: "React Developer",
      company: "Enterprise Solutions"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Resume History</h1>
        <p className="text-gray-600 mt-1">
          View all your previously optimized resumes
        </p>
      </div>
      
      {historyItems.length > 0 ? (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-6 w-6 text-rezia-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{item.company}</p>
                    <p className="text-xs text-gray-500 mt-1">Optimized on {item.date}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs h-8"
                    title="View resume"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs h-8"
                    title="Download resume"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs h-8 text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    title="Delete resume"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="bg-gray-100 p-3 rounded-full inline-flex mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-700">No resumes yet</h3>
          <p className="text-gray-500 mt-1 mb-6">
            You haven't optimized any resumes yet
          </p>
          <Button className="bg-rezia-blue hover:bg-rezia-blue/90">
            Optimize Your First Resume
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
