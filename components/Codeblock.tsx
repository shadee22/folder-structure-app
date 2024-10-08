import React, { useState } from 'react'
import { Button } from "@/components/ui/button" // Assuming you have a custom button component

interface CodeBlockProps {
  filename: string;
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ filename, content }) => {
  const [expanded, setExpanded] = useState(false)

  const toggleExpand = () => setExpanded(prev => !prev)

  return (
    <div className="relative space-y-2">
      <div className="flex items-center">
        <h3 className="font-semibold text-sm">{filename}</h3>
        <button  onClick={toggleExpand} className="text-xs border px-4 py-1 font-semibold text-blue-700 rounded-full ml-2">
          {expanded ? 'Collapse' : 'Expand +'}
        </button>
      </div>

      {/* Code container */}
      <div
        className={`relative bg-muted p-2 rounded mt-1 whitespace-pre-wrap transition-all duration-300 overflow-hidden ${
          expanded ? 'max-h-full' : 'max-h-[150px]' // Change max height based on expanded state
        }`}
        style={{ position: 'relative' }}
      >

        {/* Display the code content */}
        <pre className="text-xs">
          {content}
        </pre>

        {/* Gradient overlay when not expanded */}
        {!expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-black/50 to-transparent pointer-events-none"
            style={{ position: 'absolute' }}
          />
        )}
      </div>
    </div>
  )
}

export default CodeBlock
