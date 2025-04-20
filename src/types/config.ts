type OpenAlexConfig = {
  email?: string;
  apiKey?: string;
  userAgent: string;
  openalexUrl: string;
  maxRetries: number;
  retryBackoffFactor: number;
  retryHttpCodes: number[];
}

export { OpenAlexConfig };