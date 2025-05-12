
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Trash2 } from "lucide-react";

type ResumeHistoryItem = {
  id: string;
  date: string;
  jobTitle: string;
  company: string;
};

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HistoryPage = () => {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<ResumeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch user's history on mount
  useEffect(() => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json();
      })
      .then((data: any[]) => {
        const items = data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        }));
        setHistoryItems(items);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Error loading history');
      })
      .finally(() => setLoading(false));
  }, []);

  // View a past resume: load into localStorage and navigate to results
  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) throw new Error('Failed to fetch history item');
      const data = await res.json();
      // Seed localStorage for ResumeViewer
      localStorage.setItem(
        'optimizationResults',
        JSON.stringify({
          runId: data.runId,
          originalResume: data.originalResume,
          optimizedResume: data.optimizedResume,
          keywords: data.keywords,
          requirements: data.requirements,
          targetTitle: data.targetTitle,
          targetCompany: data.targetCompany
        })
      );
      router.push('/dashboard/optimize/results');
    } catch (err) {
      console.error(err);
      alert('Unable to load resume');
    }
  };

  // Delete a history item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this history item?')) return;
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete history item');
      setHistoryItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('Unable to delete history item');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your history...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  // Filter history items by job title or company
  const filteredItems = historyItems.filter(item =>
    item.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Resume History</h1>
        <p className="text-gray-600 mt-1">
          View all your previously optimized resumes
        </p>
      </div>
      
      {historyItems.length > 0 ? (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by title or company"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rezia-blue"
            />
          </div>
          {filteredItems.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {filteredItems.map(item => (
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
                        onClick={() => handleView(item.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-xs h-8 text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
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
            <div className="text-center py-8 text-gray-500">
              No resumes match "{searchTerm}"
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="bg-gray-100 p-3 rounded-full inline-flex mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-700">No resumes yet</h3>
          <p className="text-gray-500 mt-1 mb-6">
            You haven't optimized any resumes yet
          </p>
          <Button
            className="bg-rezia-blue hover:bg-rezia-blue/90"
            onClick={() => router.push('/dashboard')}
          >
            Optimize Your First Resume
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
