'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  FileText, 
  Download, 
  Share2, 
  Eye,
  Edit3,
  Copy,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';
import { UnifiedResume } from '@/types/resume';
import { UnifiedSidebar } from '@/components/unified/UnifiedSidebar';
import { useToast } from '@/components/ui/toast-provider';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UnifiedDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'optimized' | 'shared'>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  
  const { success, error: showError } = useToast();
  
  const {
    resumes,
    createResume,
    duplicateResume,
    deleteResume,
    loadTemplates,
    loadResumes
  } = useUnifiedResumeStore();

  useEffect(() => {
    loadTemplates();
    loadResumes();
  }, [loadTemplates, loadResumes]);

  const handleCreateResume = async () => {
    const newResumeId = await createResume();
    router.push(`/resume/${newResumeId}`);
  };

  const handleDuplicateResume = async (resumeId: string) => {
    const duplicatedId = await duplicateResume(resumeId);
    router.push(`/resume/${duplicatedId}`);
  };

  const handleDeleteResume = (resumeId: string) => {
    setResumeToDelete(resumeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;
    
    try {
      await deleteResume(resumeToDelete);
      success('Resume deleted successfully');
    } catch (error) {
      console.error('Failed to delete resume:', error);
      showError('Failed to delete resume. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const getResumeStatus = (resume: UnifiedResume) => {
    if (resume.sharing.public) return 'shared';
    if (resume.optimization.analysis.atsScore > 0) return 'optimized';
    return 'draft';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'bg-green-100 text-green-800';
      case 'optimized': return 'bg-reslo-blue/10 text-reslo-blue';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.builder.metadata.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || getResumeStatus(resume) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalResumes: resumes.length,
    optimizedResumes: resumes.filter(r => r.optimization.analysis.atsScore > 0).length,
    sharedResumes: resumes.filter(r => r.sharing.public).length,
    avgScore: resumes.length > 0 
      ? Math.round(resumes.reduce((sum, r) => sum + r.optimization.analysis.atsScore, 0) / resumes.length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <UnifiedSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Dashboard</h1>
              <p className="text-gray-600">
                Build, optimize, and track your resumes with our unified platform
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleCreateResume} size="lg" className="bg-gradient-to-r from-reslo-blue to-reslo-turquoise hover:from-reslo-blue/90 hover:to-reslo-turquoise/90">
                <Plus className="w-4 h-4 mr-2" />
                New Resume
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalResumes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.optimizedResumes} optimized
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. ATS Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgScore}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all resumes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shared Resumes</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.sharedResumes}</div>
                <p className="text-xs text-muted-foreground">
                  Public portfolios
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Applications sent
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'draft', 'optimized', 'shared'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status as any)}
                  className={`capitalize ${filterStatus === status ? 'bg-reslo-blue hover:bg-reslo-blue/90' : ''}`}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        {filteredResumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">
              {resumes.length === 0 ? 'No resumes yet' : 'No resumes match your search'}
            </h3>
            <p className="text-gray-600 mb-6">
              {resumes.length === 0 
                ? 'Create your first resume to get started with our unified platform'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {resumes.length === 0 && (
              <Button onClick={handleCreateResume} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Resume
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResumes.map((resume) => {
              const status = getResumeStatus(resume);
              const completeness = Math.min(100, Math.max(0, 
                (resume.builder.sections.basics.firstName ? 20 : 0) +
                (resume.builder.sections.summary.content ? 20 : 0) +
                (resume.builder.sections.experience.length > 0 ? 30 : 0) +
                (resume.builder.sections.education.length > 0 ? 15 : 0) +
                (resume.builder.sections.skills.length > 0 ? 15 : 0)
              ));

              return (
                <Card key={resume.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {resume.builder.metadata.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Updated {new Date(resume.timestamps.modified).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/resume/${resume.id}`)}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateResume(resume.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteResume(resume.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Resume Preview */}
                    <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-4 p-4 cursor-pointer"
                         onClick={() => router.push(`/resume/${resume.id}`)}>
                      <div 
                        className="w-full h-6 rounded mb-2"
                        style={{ backgroundColor: resume.builder.metadata.color.primary }}
                      />
                      <div className="space-y-1">
                        {[...Array(6)].map((_, i) => (
                          <div 
                            key={i}
                            className="h-2 bg-gray-300 rounded"
                            style={{ width: `${Math.random() * 40 + 60}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      {/* Completeness */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completeness</span>
                          <span>{completeness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              completeness === 100 ? 'bg-green-500' :
                              completeness > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>

                      {/* ATS Score */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ATS Score</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {resume.optimization.analysis.atsScore}%
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            resume.optimization.analysis.atsScore >= 80 ? 'bg-green-500' :
                            resume.optimization.analysis.atsScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {resume.sharing.analytics.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resume.sharing.analytics.downloads}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {resume.sharing.analytics.shares.length}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1"
                        onClick={() => router.push(`/resume/${resume.id}`)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature Highlight */}
        <Card className="mt-8 bg-gradient-to-r from-reslo-blue/5 to-reslo-turquoise/5 border-reslo-blue/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">🚀 New Unified Platform</h3>
                <p className="text-gray-600 mb-3">
                  Experience our new resume builder with integrated ATS optimization, 
                  real-time feedback, and professional templates.
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Visual resume builder with drag-and-drop sections</li>
                  <li>• Real-time ATS optimization and scoring</li>
                  <li>• AI-powered content suggestions</li>
                  <li>• Professional templates and customization</li>
                  <li>• Analytics and application tracking</li>
                </ul>
              </div>
              <div className="ml-6">
                <Button onClick={handleCreateResume} size="lg" className="bg-gradient-to-r from-reslo-blue to-reslo-turquoise hover:from-reslo-blue/90 hover:to-reslo-turquoise/90">
                  Try New Builder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteResume}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}