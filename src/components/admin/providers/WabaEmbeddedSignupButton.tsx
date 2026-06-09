import { Button } from '@/components/ui/button'
import { Facebook } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onSuccess: (data: { accessToken: string; wabaBusinessId: string }) => void
}

/**
 * Stub para Embedded Signup da Meta.
 * Requer META_APP_ID configurado e SDK do Facebook carregado em produção.
 * Por enquanto, exibe um aviso pedindo configuração manual via "Configuração avançada".
 */
export function WabaEmbeddedSignupButton({ onSuccess: _onSuccess }: Props) {
  const handleClick = () => {
    toast.info('Embedded Signup indisponível — use a "Configuração avançada (app próprio)" abaixo para inserir as credenciais manualmente.')
  }
  return (
    <Button type="button" variant="default" onClick={handleClick} className="w-full">
      <Facebook className="mr-2 h-4 w-4" />
      Conectar com Facebook
    </Button>
  )
}
