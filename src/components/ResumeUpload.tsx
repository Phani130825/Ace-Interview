import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { resumeAPI, uploadFile, interviewAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type ResumeUploadProps = {
  onUploaded?: (resumeId: string) => void;
  onStartInterview?: (interviewId: string) => void;
};

const ResumeUpload = ({ onUploaded, onStartInterview }: ResumeUploadProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    
    setUploadStatus('uploading');
    setAnalysisProgress(0);
    setUploadedFile(file);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      // Use uploadFile to get real progress updates
      const response = await uploadFile(file, (percent) => {
        setAnalysisProgress(percent);
      });

      setAnalysisProgress(100);
      setUploadStatus('success');

      // Expect resumeId in response.data.data.resumeId or data.resumeId
      const resumeId = response?.data?.data?.resumeId || response?.data?.resumeId;
      console.log('Resume uploaded successfully:', response?.data);

      if (resumeId) {
        setUploadedResumeId(resumeId);
        if (onUploaded) onUploaded(resumeId);
      }
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setAnalysisProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
          <p className="text-gray-600">Upload your resume and job description to get started with AI-powered analysis</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resume Upload */}
          <Card className="p-8">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center gap-2 justify-center">
                <FileText className="h-6 w-6 text-brand-primary" />
                Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-brand-primary bg-brand-primary/5' 
                    : uploadStatus === 'success' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-brand-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {uploadStatus === 'idle' && (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag & drop your resume here, or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX files</p>
                    <Button 
                      variant="professional" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </>
                )}
                
                {uploadStatus === 'uploading' && (
                  <>
                    <Loader className="h-12 w-12 text-brand-primary mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600 mb-4">Analyzing your resume...</p>
                    <Progress value={analysisProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">{analysisProgress}% complete</p>
                  </>
                )}
                
                {uploadStatus === 'success' && (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Resume uploaded successfully!</p>
                    <p className="text-sm text-gray-500">Analysis complete - ready for next step</p>
                  </>
                )}
                
                {uploadStatus === 'error' && (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload failed. Please try again.</p>
                    <Button variant="professional" onClick={() => setUploadStatus('idle')}>
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card className="p-8">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center gap-2 justify-center">
                <FileText className="h-6 w-6 text-brand-primary" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-xl resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-colors"
                placeholder="Paste the job description here...

Include:
• Job title and company
• Required skills and qualifications
• Responsibilities and duties
• Experience requirements"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Include all relevant details for better analysis
                </p>
                <Button 
                  variant="professional"
                  disabled={!uploadedFile || !jobDescription.trim()}
                  onClick={async () => {
                    if (!uploadedFile || !jobDescription.trim()) return;
                    
                    try {
                      // Here you would call the resume analysis API
                      // For now, we'll just show success
                      console.log('Analyzing resume match...');
                    } catch (error) {
                      console.error('Analysis failed:', error);
                    }
                  }}
                >
                  Analyze Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results Preview */}
        {uploadStatus === 'success' && (
          <Card className="mt-8 p-6 slide-in-up">
            <CardHeader>
              <CardTitle>Quick Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-2">87%</div>
                  <div className="text-sm text-gray-600">Skills Match</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-2">12</div>
                  <div className="text-sm text-gray-600">Keywords Found</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 mb-2">3</div>
                  <div className="text-sm text-gray-600">Improvements</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={async () => {
                    // If parent provided onStartInterview and a resume has been uploaded, create a quick interview
                    if (onStartInterview && uploadedResumeId) {
                      try {
                        const created = await interviewAPI.create({ resumeId: uploadedResumeId, jobDescription: jobDescription || 'Quick practice', interviewType: 'technical', settings: { questionCount: 5, timeLimit: 5 } });
                        const interviewId = created?.data?.data?.interview?.id || created?.data?.interview?.id;
                        if (interviewId) onStartInterview(interviewId);
                        return;
                      } catch (err) {
                        console.error('Create interview failed', err);
                      }
                    }

                    // Fallback: navigate to tailoring by calling onUploaded -> parent handles navigation
                    if (uploadedResumeId && onUploaded) {
                      onUploaded(uploadedResumeId);
                    }
                  }}
                >
                  Proceed to Resume Tailoring
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;