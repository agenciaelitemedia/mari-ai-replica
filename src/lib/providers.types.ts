import { z } from 'zod'

export const PROVIDER_TYPES = ['uazapi', 'waba', 'instagram', 'webchat'] as const
export type ProviderType = (typeof PROVIDER_TYPES)[number]

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  uazapi: 'UaZapi (WhatsApp)',
  waba: 'API Oficial Meta (WABA)',
  instagram: 'Instagram',
  webchat: 'WebChat',
}

export const PROVIDER_DESCRIPTIONS: Record<ProviderType, string> = {
  uazapi: 'WhatsApp via UaZapi (URL + admin token)',
  waba: 'WhatsApp Business API oficial via Meta Cloud',
  instagram: 'Direct Messages do Instagram via Meta',
  webchat: 'Widget de chat para o seu site',
}

export const providerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome obrigatório').max(120),
  provider_type: z.enum(PROVIDER_TYPES),
  is_active: z.boolean().default(true),
  // uazapi
  evo_url: z.string().nullable().optional(),
  evo_apikey: z.string().nullable().optional(),
  // waba
  meta_app_id: z.string().nullable().optional(),
  meta_app_secret: z.string().nullable().optional(),
  waba_business_id: z.string().nullable().optional(),
  waba_token: z.string().nullable().optional(),
  // instagram
  instagram_page_id: z.string().nullable().optional(),
  instagram_user_id: z.string().nullable().optional(),
  page_access_token: z.string().nullable().optional(),
  page_name: z.string().nullable().optional(),
  // webchat
  webchat_config_id: z.string().uuid().nullable().optional(),
  widget_key: z.string().nullable().optional(),
})

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
