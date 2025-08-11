import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadProps {
  sessionId?: string | null;
  onFilesUploaded?: (files: any[]) => void;
}

export default function FileUpload({ sessionId, onFilesUploaded }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/', 'text/', 'application/pdf', 'application/json'];
      return validTypes.some(type => file.type.startsWith(type)) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were rejected",
        description: "Only images, text files, PDFs, and JSON files under 10MB are supported.",
        variant: "destructive",
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get uploaded files from server
  const { data: uploadedFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['/api/files'],
    enabled: isAuthenticated,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.files.length} file(s) uploaded successfully.`,
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      if (onFilesUploaded) {
        onFilesUploaded(data.files);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload files.",
        variant: "destructive",
      });
    },
  });

  // File deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,text/*,.pdf,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
            <i className="fas fa-cloud-upload text-slate-500 text-xl"></i>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">Drop files here or click to upload</p>
            <p className="text-sm text-slate-500 mt-1">
              Images, text files, PDFs, and JSON files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Selected files (ready to upload) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Selected Files:</h4>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {uploadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload mr-2"></i>
                  Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <i className={`fas ${
                  file.type.startsWith('image/') ? 'fa-image' :
                  file.type === 'application/pdf' ? 'fa-file-pdf' :
                  'fa-file-text'
                } text-blue-600`}></i>
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
                disabled={uploadMutation.isPending}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files (saved to server) */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mt-6">
          <h4 className="font-medium text-slate-700">Your Uploaded Files:</h4>
          {filesLoading ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin text-slate-400"></i>
              <p className="text-sm text-slate-500 mt-2">Loading files...</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {uploadedFiles.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className={`fas ${
                      file.mimeType.startsWith('image/') ? 'fa-image' :
                      file.mimeType === 'application/pdf' ? 'fa-file-pdf' :
                      'fa-file-text'
                    } text-slate-500`}></i>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{file.originalName}</p>
                      <p className="text-xs text-slate-500">
                        {(file.fileSize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                      {file.processedContent && (
                        <p className="text-xs text-green-600 mt-1">
                          <i className="fas fa-check-circle mr-1"></i>
                          Ready for AI analysis
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}