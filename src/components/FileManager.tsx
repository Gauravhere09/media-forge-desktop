
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileAudio, FileImage, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaFile {
  id: string;
  name: string;
  type: "script" | "audio" | "image" | "video";
  url: string;
  createdAt: Date;
}

interface FileManagerProps {
  files: MediaFile[];
}

const FileManager: React.FC<FileManagerProps> = ({ files = [] }) => {
  const { toast } = useToast();
  
  const getIcon = (type: string) => {
    switch (type) {
      case "script":
        return <FileText className="h-5 w-5" />;
      case "audio":
        return <FileAudio className="h-5 w-5" />;
      case "image":
        return <FileImage className="h-5 w-5" />;
      case "video":
        return <FileVideo className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleOpenFile = (file: MediaFile) => {
    // In a real electron app, we would open the file using the shell module
    // For this web demo, we'll just open the URL in a new tab
    window.open(file.url, "_blank");
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Generated Files</CardTitle>
        <CardDescription>
          Browse and open your generated media files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No files generated yet</p>
            <p className="text-sm mt-2">Generated media will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleOpenFile(file)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {getIcon(file.type)}
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManager;
