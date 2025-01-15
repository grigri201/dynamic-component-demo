import React, { FC, useState, useRef, useEffect } from 'react';
import { openai } from '../libs/openai';
import DynamicCodeRenderer from '@/components/DynamicCodeRenderer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Home: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [componentCode, setComponentCode] = useState<string>('// Your component code will appear here');
  const [editableCode, setEditableCode] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createDynamicComponent = (code: string) => {
    try {
      console.log('Original code:', code);
      
      // Remove any imports as we'll handle them differently
      const codeWithoutImports = code.replace(/import.*?;/g, '').trim();
      setComponentCode(codeWithoutImports);
    } catch (error) {
      console.error('Error creating component:', error);
    }
  };

  const handleOpenAIResponse = (response: any, inputMessage: string) => {
    console.log('[Debug] Processing OpenAI response');
    
    if (!response.success) {
      console.error('[Debug] OpenAI request failed:', response.error);
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }
      ]);
      return;
    }

    const content = response.content!;
    const codeMatch = content.match(/```(?:typescript|javascript)\n([\s\S]*?)```/);
    
    if (codeMatch) {
      console.log('[Debug] Code block detected in response');
      createDynamicComponent(codeMatch[1].trim());
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: 'Component created! Check the preview panel.' }
      ]);
    } else {
      console.log('[Debug] Regular chat response detected');
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: content }
      ]);
    }
  };

  const handleError = (error: any, inputMessage: string) => {
    console.error('[Debug] Error processing request:', error);
    setMessages(prev => [...prev, 
      { role: 'user', content: inputMessage },
      { role: 'assistant', content: 'An unexpected error occurred. Please try again.' }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await openai.generateCode(userInput);
      handleOpenAIResponse(response, userInput);
    } catch (error) {
      handleError(error, userInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDynamicComponentEvent = async (message: string) => {
    console.log('[Debug] Received dynamic component event:', message);
    
    try {
      const response = await openai.chat([
        { role: 'user', content: message }
      ]);
      handleOpenAIResponse(response, message);
    } catch (error) {
      handleError(error, message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left area - Chat with AI */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : 'bg-gray-100 max-w-[80%]'
              }`}
            >
              {message.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Right area - Dynamic content */}
      <div className="w-1/2 flex flex-col">
        <div className="border rounded p-4 bg-gray-100">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <DynamicCodeRenderer
            code={componentCode}
            globalVarName="DynamicComp"
            eventCallback={handleDynamicComponentEvent}
          />
        </div>
        <div className="border rounded p-4 bg-gray-100">
          <h3 className="text-lg font-semibold mb-2">Transformed Code:</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-800 text-white p-4 rounded">
            {componentCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Home;
