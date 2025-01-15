import OpenAI from 'openai';

// For debugging purposes
const DEBUG = process.env.NODE_ENV !== 'production';

class OpenAIClient {
  private client: OpenAI;
  private debug: boolean;
  private codeGenerationPrompt: string = '';
  private settingsPrompt: string = '';
  private promptLoaded: boolean = false;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      // Adding debug logs in development
      httpAgent: DEBUG ? undefined : undefined, // Enable for HTTP debugging if needed
      dangerouslyAllowBrowser: true,
    });

    this.debug = DEBUG;
    this.loadPrompt();
  }

  private logDebug(...args: any[]) {
    if (this.debug) {
      console.log('[OpenAI Client Debug]:', ...args);
    }
  }

  private async loadPrompt() {
    try {
      const generateCodePrompt = await fetch('/prompt/generate_code.md');
      if (!generateCodePrompt.ok) {
        throw new Error(`Failed to load prompt: ${generateCodePrompt.statusText}`);
      }
      this.codeGenerationPrompt = await generateCodePrompt.text();
      const settingsPrompt = await fetch('/prompt/settings.md');
      if (!settingsPrompt.ok) {
        throw new Error(`Failed to load prompt: ${settingsPrompt.statusText}`);
      }
      this.settingsPrompt = await settingsPrompt.text();
      this.promptLoaded = true;
      this.logDebug('Loaded code generation prompt');
    } catch (error) {
      this.logDebug('Error loading code generation prompt:', error);
      // Keep using the default prompt set in the constructor
    }
  }

  async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
    try {
      this.logDebug('Sending chat request with messages:', messages);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
      });

      this.logDebug('Received response:', response);

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      this.logDebug('Error in chat request:', error);
      
      if (error instanceof OpenAI.APIError) {
        return {
          success: false,
          error: {
            message: error.message,
            type: error.type,
            code: error.code,
          },
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'unknown_error',
        },
      };
    }
  }

  async generateCode(prompt: string) {
    try {
      // Wait for prompt to load if it hasn't already
      if (!this.promptLoaded) {
        await this.loadPrompt();
      }

      this.logDebug('Sending code generation request with prompt:', prompt);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.codeGenerationPrompt,
          },
          {
            role: 'system',
            content: this.settingsPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Lower temperature for more focused code generation
      });

      this.logDebug('Received code generation response:', response);

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      this.logDebug('Error in code generation:', error);
      
      if (error instanceof OpenAI.APIError) {
        return {
          success: false,
          error: {
            message: error.message,
            type: error.type,
            code: error.code,
          },
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'unknown_error',
        },
      };
    }
  }
}

// Export a singleton instance
export const openai = new OpenAIClient();

// Export types for better TypeScript support
export type ChatResponse = Awaited<ReturnType<typeof openai.chat>>;
export type CodeGenResponse = Awaited<ReturnType<typeof openai.generateCode>>;
