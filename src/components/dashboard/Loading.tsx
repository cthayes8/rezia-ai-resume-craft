import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Get the optimization results from localStorage
    const optimizationResults = localStorage.getItem('optimizationResults');
    
    if (!optimizationResults) {
      // If no results, go back to upload
      router.push("/dashboard");
      return;
    }

    // Simulate progress while optimization is happening
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          // Navigate to results when complete
          router.push("/dashboard/optimize/results");
          return 100;
        }
        return prevProgress + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [router]);

  const steps = [
    { label: "Analyzing resume", completed: progress > 25 },
    { label: "Matching job requirements", completed: progress > 50 },
    { label: "Optimizing content", completed: progress > 75 },
    { label: "Finalizing templates", completed: progress > 90 },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Optimizing Your Resume</h1>
          <p className="text-gray-600 mt-2">
            Our AI is tailoring your resume to the job description
          </p>
        </div>

        <div className="p-8 bg-white rounded-lg shadow-lg">
          <Progress value={progress} className="h-2 mb-8" />

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex-shrink-0 h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                  step.completed ? "bg-rezia-blue" : "bg-gray-200"
                }`}>
                  {step.completed && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${step.completed ? "text-gray-800" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            This typically takes less than a minute
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
