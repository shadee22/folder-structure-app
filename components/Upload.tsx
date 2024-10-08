"use client";

import React, { useState, useCallback, useRef } from "react";
import { Folder, File, ChevronRight, ChevronDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you're using this
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import CodeBlock from "./Codeblock";

interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string; // Content for files
}

export default function FolderUploadPreview() {
  const [folderStructure, setFolderStructure] = useState<FileNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFolderUpload = async (dataTransfer?: DataTransfer) => {
    if (!("showDirectoryPicker" in window) && !dataTransfer) {
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support folder upload. Please use a modern browser like Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (dataTransfer) {
        const items = Array.from(dataTransfer.items);
        const folderStructure: FileNode = { name: "Root", type: "directory", children: [] };

        for (const item of items) {
          const entry = item.webkitGetAsEntry();

          if (entry) {
            if (entry.isDirectory) {
              const dirStructure = await traverseDirectory(entry as FileSystemDirectoryEntry);
              folderStructure.children?.push(dirStructure);
            } else if (entry.isFile) {
              const fileStructure = await traverseFile(entry as FileSystemFileEntry);
              folderStructure.children?.push(fileStructure);
            }
          }
        }

        setFolderStructure(folderStructure);
        toast({
          title: "Folder uploaded successfully",
          description: `Uploaded folder: ${folderStructure.name}`,
        });
      } else {
        const dirHandle = await window.showDirectoryPicker();
        const structure = await readDirectory(dirHandle);
        setFolderStructure(structure);
        toast({
          title: "Folder uploaded successfully",
          description: `Uploaded folder: ${structure.name}`,
        });
      }
    } catch (error) {
      console.error("Error reading folder:", error);
      toast({
        title: "Error uploading folder",
        description: "An error occurred while reading the folder. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  const traverseDirectory = async (dirEntry: FileSystemDirectoryEntry): Promise<FileNode> => {
    const reader = dirEntry.createReader();
    const children: FileNode[] = [];

    return new Promise((resolve, reject) => {
      reader.readEntries(async (entries) => {
        for (const entry of entries) {
          if (entry.isFile) {
            const file = await traverseFile(entry as FileSystemFileEntry);
            children.push(file);
          } else if (entry.isDirectory) {
            const dir = await traverseDirectory(entry as FileSystemDirectoryEntry);
            children.push(dir);
          }
        }
        resolve({
          name: dirEntry.name,
          type: "directory",
          children,
        });
      }, reject);
    });
  };

  const traverseFile = async (fileEntry: FileSystemFileEntry): Promise<FileNode> => {
    return new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: fileEntry.name,
            type: "file",
            content: reader.result as string,
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    });
  };

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  const toggleFolderExpansion = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const renderTree = useCallback(
    (node: FileNode, path = "") => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      const isExpanded = expandedFolders.has(currentPath);

      if (node.type === "file") {
        return (
          <div key={currentPath} className="flex items-center space-x-2 py-1">
            <Checkbox
              id={currentPath}
              checked={selectedFiles.has(currentPath)}
              onCheckedChange={() => toggleFileSelection(currentPath)}
            />
            <File className="h-4 w-4" />
            <label htmlFor={currentPath} className="text-sm cursor-pointer">
              {node.name}
            </label>
          </div>
        );
      }

      return (
        <Collapsible key={currentPath} open={isExpanded} onOpenChange={() => toggleFolderExpansion(currentPath)}>
          <CollapsibleTrigger className="flex items-center space-x-2 py-1 w-full hover:bg-accent rounded-sm">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">{node.name}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6">
            {node.children && node.children.map((child) => renderTree(child, currentPath))}
          </CollapsibleContent>
        </Collapsible>
      );
    },
    [expandedFolders, selectedFiles]
  );

  const getSelectedFileContents = useCallback(() => {
    const contents: { name: string; content: string }[] = [];
    const traverse = (node: FileNode, path = "") => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      if (node.type === "file" && selectedFiles.has(currentPath)) {
        contents.push({ name: node.name, content: node.content || "" });
      } else if (node.type === "directory" && node.children) {
        node.children.forEach((child) => traverse(child, currentPath));
      }
    };
    if (folderStructure) {
      traverse(folderStructure);
    }
    return contents;
  }, [folderStructure, selectedFiles]);

  const copyAllToClipboard = () => {
    const selectedFiles = getSelectedFileContents();

    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select some files to copy.",
        variant: "destructive",
      });
      return;
    }

    let clipboardContent = selectedFiles
      .map(({ name, content }) => `// ${name}\n\n${content}\n`)
      .join("\n");

    navigator.clipboard
      .writeText(clipboardContent)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "All selected file contents have been copied to your clipboard.",
        });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy the content to clipboard.",
          variant: "destructive",
        });
      });
  };

  const selectAllFiles = () => {
    if (!folderStructure) return;

    const filePaths = new Set<string>();

    const gatherFilePaths = (node: FileNode, path = "") => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      if (node.type === "file") {
        filePaths.add(currentPath);
      } else if (node.type === "directory" && node.children) {
        node.children.forEach((child) => gatherFilePaths(child, currentPath));
      }
    };

    gatherFilePaths(folderStructure);

    const allFilesSelected = Array.from(filePaths).every((path) => selectedFiles.has(path));

    if (allFilesSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(filePaths);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const dataTransfer = e.dataTransfer;
    if (dataTransfer && dataTransfer.items.length > 0) {
      handleFolderUpload(dataTransfer);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 mt-20 ">
      <h1 className="text-2xl font-bold">Extract codebase for prompt For GPT</h1>
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-primary bg-primary/10" : "border-gray-300"
        }`}
      >
        <Button onClick={() => handleFolderUpload()}>
          <Upload className="mr-2 h-4 w-4" /> Upload Folder
        </Button>
        <p className="mt-2 text-sm text-gray-600">or drag and drop a folder here</p>
      </div>

      {folderStructure && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Folder Structure</h2>
              <Button variant={"secondary"} onClick={selectAllFiles}>
                {Array.from(selectedFiles).length === 0 ? "Select All" : "Deselect All"}
              </Button>
            </div>
            <ScrollArea className="h-[400px] w-full border rounded-md p-4">
              {renderTree(folderStructure)}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Selected Files Preview</h2>
              <Button variant={"secondary"} onClick={copyAllToClipboard} className="text-sm ml-4">
                Copy All
              </Button>
            </div>

            <ScrollArea className="h-[400px] w-full border rounded-md p-4">
              {getSelectedFileContents().map(({ name, content }, index) => (
                <div key={name} className="mb-4">
                  <CodeBlock filename={name} content={content} />
                  {index < getSelectedFileContents().length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
