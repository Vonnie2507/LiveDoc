import dotenv from 'dotenv';

export function loadEnvironment(): void {
  dotenv.config();
  
  const required = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT'
  ];
  
  const missingVars: string[] = [];
  
  for (const variable of required) {
    if (process.env[variable] === undefined || process.env[variable] === '') {
      missingVars.push(variable);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error('Missing required environment variables: ' + missingVars.join(', '));
  }
}

export function getEnvironment(): { nodeEnv: string; port: number; databaseUrl: string; claudeApiKey: string | undefined; openaiApiKey: string | undefined; emailProvider: string | undefined } {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  const parsedPort = parseInt(process.env.PORT || '', 10);
  const port = isNaN(parsedPort) ? 3000 : parsedPort;
  
  const databaseUrl = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
  
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const emailProvider = process.env.EMAIL_PROVIDER;
  
  return {
    nodeEnv,
    port,
    databaseUrl,
    claudeApiKey,
    openaiApiKey,
    emailProvider
  };
}