"use client";
import React, { useState } from "react";
import SelectedFilesDisplay from "./SelectFileDisplay";

declare module 'react' {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      // extends React's HTMLAttributes
      directory?: string;
      webkitdirectory?: string;
    }
  }
const Upload = () => {
  const [filesList, setFilesList] = useState<any>([]);
  const [selectedFiles, setSelectedFiles] = useState<any>({});

  const handleDirectoryUpload = (event: any) => {
    const files = event.target.files;
    const fileList: any = [];
    for (let i = 0; i < files.length; i++) {
      fileList.push({ path: files[i].webkitRelativePath, file: files[i] });
    }
    setFilesList(fileList);
  };

  const toggleFileSelection = (path: string) => {
    setSelectedFiles((prev: any) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div className="grid-cols-2 grid space-x-4 w-full">
      <div>
        <div className="text-3xl font-bold py-8">File Structure Extractor</div>
        <input
          className="bg-gray-900 p-4 "
          type="file"
          directory=""
          webkitdirectory=""
          onChange={handleDirectoryUpload}
        />
        <ul className="py-4">
          {filesList.map((item: any, index: number) => (
            <li
              key={index}
              className={`cursor-pointer ${
                selectedFiles[item.path] ? "bg-gray-800 p-2 rounded-lg" : ""
              }`}
              onClick={() => toggleFileSelection(item.path)}
            >
              {item.path}
            </li>
          ))}
        </ul>
      </div>
      <SelectedFilesDisplay
        filesList={filesList}
        selectedFiles={selectedFiles}
      />
    </div>
  );
};

export default Upload;
