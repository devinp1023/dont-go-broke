import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com' })
}
