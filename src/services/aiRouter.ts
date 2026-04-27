import type { Provider, AssistantSettings, RouteRequest, TaskComplexity } from '../types.ts';

export const routeRequest = async (request: RouteRequest): Promise<Provider> => {
  const { complexity, settings } = request;
  const { providers, autoRouting } = settings;

  if (!autoRouting) {
      // Manual routing: find first enabled provider
      return (Object.values(providers).find(p => p.enabled)?.id) || 'gemini';
  }

  // Smart Routing Logic
  
  // 1. Coding/Reasoning -> OpenAI/Deepseek (if enabled)
  if (['coding', 'reasoning'].includes(complexity) && (providers.openai?.enabled || providers.deepseek?.enabled)) {
      return providers.openai?.enabled ? 'openai' : 'deepseek';
  }

  // 2. Simple -> Gemini (preferred for speed)
  if (providers.gemini?.enabled) {
      return 'gemini';
  }

  // 3. Fallback to any enabled
  const enabledProviders = Object.values(providers).filter(p => p.enabled);
  return enabledProviders.length > 0 ? enabledProviders[0].id : 'local';
};
