"use client";
import React, { useState, useEffect } from "react";

const SelectedFilesDisplay = ({ filesList, selectedFiles }: any) => {
  const [fileContents, setFileContents] = useState<any>({});

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result as string;
      setFileContents((prev: any) => ({
        ...prev,
        [file.name]: text,
      }));
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    filesList.forEach((item: any) => {
      if (selectedFiles[item.path] && !fileContents[item.file.name]) {
        readFileContent(item.file);
      }
    });
  }, [selectedFiles, filesList]);

  const copySingleFileContent = (path: string) => {
    const file = filesList.find((item: any) => item.path === path);
    const content = file ? `# ${path}\n${fileContents[file.file.name]}\n` : "";
    navigator.clipboard
      .writeText(content)
      .then(() => alert("Copied to clipboard!"));
  };

  const copyAllFileContents = () => {
    const content = filesList
      .filter((item: any) => selectedFiles[item.path])
      .map((item: any) => `# ${item.path}\n${fileContents[item.file.name]}\n`)
      .join("\n");
    navigator.clipboard
      .writeText(content)
      .then(() => alert("All selected files copied to clipboard!"));
  };

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <button
        onClick={copyAllFileContents}
        className="bg-white text-purple-900 hover:bg-blue-700 my-2  font-bold py-2 px-4 rounded-full transition-all"
      >
        Copy All Files
      </button>
      {filesList
        .filter((item: any) => selectedFiles[item.path])
        .map((item: any) => (
          <div
            key={item.path}
            className="bg-gray-800 shadow-lg rounded-lg p-4 mb-4"
          >
            <div className="flex justify-between bg-gray-900  rounded-full">
              <h3 className="font-bold text-lg px-4 py-2">{item.path}</h3>
              <button
                onClick={() => copySingleFileContent(item.path)}
                className="bg-purple-600 hover:bg-purple-500 text-white
                 font-bold py-1 px-4 rounded-full text-sm transition-all"
              >
                Copy This File
              </button>
            </div>
            <div
              className="mt-2 overflow-auto text-sm"
              style={{ maxHeight: "200px" }}
            >
              <pre className="whitespace-pre-wrap">
                {fileContents[item.file.name]}
              </pre>
            </div>
          </div>
        ))}
    </div>
  );
};

export default SelectedFilesDisplay;
