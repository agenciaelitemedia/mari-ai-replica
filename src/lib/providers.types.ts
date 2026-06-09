import { z } from 'zod'

export const PROVIDER_TYPES = ['uazapi', 'evolution', 'waba', 'instagram', 'webchat'] as const
export type ProviderType = (typeof PROVIDER_TYPES)[number]

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  uazapi: 'UazAPI',
  evolution: 'Evolution API',
  waba: 'WhatsApp Oficial (WABA)',
  instagram: 'Instagram (Meta)',
  webchat: 'Webchat',
}

export const PROVIDER_DESCRIPTIONS: Record<ProviderType, string> = {
  uazapi: 'WhatsApp via UazAPI (token + instance)',
  evolution: 'WhatsApp via Evolution API (apikey + instance)',
  waba: 'WhatsApp Business API oficial via Meta Cloud',
  instagram: 'Direct Messages do Instagram via Meta',
  webchat: 'Widget de chat para o seu site',
}

const baseFields = {
  id: z.string().uuid().optional(),
  client_id: z.string().min(1, 'Cliente obrigatório'),
  name: z.string().min(1, 'Nome obrigatório').max(120),
  is_active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
}

export const uazapiSchema = z.object({
  ...baseFields,
  provider_type: z.literal('uazapi'),
  evo_url: z.string().url('URL inválida'),
  evo_apikey: z.string().min(1, 'Token obrigatório'),
  instance_name: z.string().min(1, 'Instance obrigatória'),
  phone_number: z.string().optional(),
})

export const evolutionSchema = z.object({
  ...baseFields,
  provider_type: z.literal('evolution'),
  evo_url: z.string().url('URL inválida'),
  evo_apikey: z.string().min(1, 'API key obrigatória'),
  instance_name: z.string().min(1, 'Instance obrigatória'),
  phone_number: z.string().optional(),
})

export const wabaSchema = z.object({
  ...baseFields,
  provider_type: z.literal('waba'),
  waba_id: z.string().min(1, 'WABA ID obrigatório'),
  phone_number_id: z.string().min(1, 'Phone Number ID obrigatório'),
  access_token: z.string().min(1, 'Access Token obrigatório'),
  app_secret: z.string().optional(),
  verify_token: z.string().optional(),
  phone_number: z.string().optional(),
})

export const instagramSchema = z.object({
  ...baseFields,
  provider_type: z.literal('instagram'),
  ig_business_id: z.string().min(1, 'IG Business ID obrigatório'),
  page_id: z.string().optional(),
  access_token: z.string().min(1, 'Access Token obrigatório'),
  verify_token: z.string().optional(),
})

export const webchatSchema = z.object({
  ...baseFields,
  provider_type: z.literal('webchat'),
  widget_key: z.string().optional(),
  allowed_origins: z.array(z.string()).optional(),
})

export const providerSchema = z.discriminatedUnion('provider_type', [
  uazapiSchema,
  evolutionSchema,
  wabaSchema,
  instagramSchema,
  webchatSchema,
])

export type ProviderInput = z.infer<typeof providerSchema>

export function generateRandomKey(prefix = '', len = 32) {
  const arr = new Uint8Array(len)
  if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
  return prefix ? `${prefix}_${hex}` : hex
}
