import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  File,
  Image as ImageIcon,
  FileSpreadsheet
} from 'lucide-react';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface DocumentUploadProps {
  bucketName: 'kyc-documents' | 'asset-documents';
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  existingDocuments?: UploadedDocument[];
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  required?: boolean;
}

export const DocumentUpload = ({
  bucketName,
  onDocumentsChange,
  existingDocuments = [],
  maxFiles = 10,
  maxSizeMB = 10,
  allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  required = false
}: DocumentUploadProps) => {
  const { user, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>(existingDocuments);
  const [uploading, setUploading] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return ImageIcon;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedDocument | null> => {
    try {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (documents.length + files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed. Currently have ${documents.length} files.`
      });
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        variant: "destructive", 
        title: "File Validation Failed",
        description: errors.join(', ')
      });
    }

    if (validFiles.length === 0) return;

    setUploading(prev => [...prev, ...validFiles.map(f => f.name)]);

    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 200);

        const uploadedDoc = await uploadFile(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        return uploadedDoc;
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error.message}`
        });
        return null;
      } finally {
        setUploading(prev => prev.filter(name => name !== file.name));
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });
        }, 2000);
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result !== null) as UploadedDocument[];
    
    if (successfulUploads.length > 0) {
      const updatedDocs = [...documents, ...successfulUploads];
      setDocuments(updatedDocs);
      onDocumentsChange(updatedDocs);
      
      toast({
        title: "Upload Successful",
        description: `${successfulUploads.length} document(s) uploaded successfully`
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = async (docId: string) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([docId]);

      if (error) {
        console.error('Delete error:', error);
        // Continue anyway as the file might not exist
      }

      const updatedDocs = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocs);
      onDocumentsChange(updatedDocs);

      toast({
        title: "Document Removed",
        description: "Document has been successfully deleted"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed", 
        description: `Failed to delete document: ${error.message}`
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Upload supporting documents {required && <span className="text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          PDF, Images, Word docs, Excel sheets up to {maxSizeMB}MB each
        </p>
        <Button type="button" variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Choose Files ({documents.length}/{maxFiles})
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(fileName => (
            <div key={fileName} className="flex items-center space-x-2 text-sm">
              <Upload className="w-4 h-4 animate-pulse" />
              <span className="flex-1 truncate">{fileName}</span>
              <div className="w-24">
                <Progress value={uploadProgress[fileName] || 0} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground">
                {uploadProgress[fileName] || 0}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Documents ({documents.length})</p>
          <div className="space-y-2">
            {documents.map((doc) => {
              const IconComponent = getFileIcon(doc.type);
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • Uploaded {doc.uploadedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requirements Notice */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Required documents may include:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Proof of ownership (title deeds, certificates)</li>
          <li>Property appraisal or valuation reports</li>
          <li>Identity verification documents</li>
          <li>Insurance documentation</li>
          <li>Recent photographs of the asset</li>
        </ul>
      </div>
    </div>
  );
};