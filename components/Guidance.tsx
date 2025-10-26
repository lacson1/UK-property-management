import React, { useState } from 'react';
import { getGuidance } from '../services/geminiService';
import { GUIDANCE_PROMPTS } from '../constants';
import { SparkleIcon, LoadingSpinner, GuidanceIcon } from './Icons';

const Guidance: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError('');
    
    try {
      const result = await getGuidance(prompt);
      setResponse(result);
    } catch (e) {
      setError('Failed to get guidance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(query);
  };
  
  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    handleQuery(prompt);
  };
  
  // A simple markdown-to-HTML converter
  const formatResponse = (text: string) => {
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded-sm font-mono text-sm">$1</code>')
      .replace(/\n\s*-\s/g, '\n<li class="ml-2">') // Start of list items
      .replace(/(<\/li>)?\n(?!<li)/g, '</li>\n') // End list items
      .replace(/(\n<li.*>.*<\/li>\n)+/g, (match) => `<ul class="list-disc list-inside space-y-2 my-3">${match.replace(/\n/g, '')}</ul>`)
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <SparkleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-sky-500 dark:text-sky-400 mr-3" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">AI Guidance</h2>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex-grow flex flex-col">
        <div className="flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about UK landlord regulations..."
              className="flex-grow p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-sky-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-sky-700 transition-colors disabled:bg-slate-400 flex items-center justify-center"
              disabled={isLoading}
            >
                {isLoading ? <LoadingSpinner className="h-5 w-5"/> : 'Ask'}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
              {GUIDANCE_PROMPTS.map(prompt => (
                  <button 
                    key={prompt} 
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isLoading}
                    className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
                    >
                      {prompt.substring(0, 50)}...
                  </button>
              ))}
          </div>
        </div>

        <div className="mt-6 flex-grow overflow-y-auto pr-2">
            {!isLoading && !response && (
                 <div className="text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center h-full">
                    <GuidanceIcon className="h-16 w-16 mb-4"/>
                    <p className="font-medium">Ask a question to get started.</p>
                    <p className="text-sm">Your AI assistant for UK property management.</p>
                </div>
            )}
            {isLoading && (
                 <div className="text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
                    <LoadingSpinner className="h-12 w-12 mb-4 text-sky-600"/>
                    <p className="font-medium">Consulting the regulations...</p>
                    <p className="text-sm">This may take a moment.</p>
                </div>
            )}
            {error && <p className="text-red-500">{error}</p>}
            {response && (
                <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={formatResponse(response)} />
            )}
        </div>
      </div>
    </main>
  );
};

export default Guidance;