import Swal from 'sweetalert2'

const baseClasses = {
  popup: 'rounded-2xl border border-border bg-card text-card-foreground shadow-2xl',
  title: 'text-lg font-semibold',
  htmlContainer: 'text-sm text-muted-foreground',
  confirmButton:
    'rounded-full px-5 py-2 bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20 hover:opacity-90 active:scale-95',
  cancelButton:
    'rounded-full px-5 py-2 bg-secondary text-secondary-foreground font-medium border border-border hover:bg-secondary/80 active:scale-95 ml-2',
  actions: 'gap-2 mt-2',
}

export async function confirmDelete(opts: {
  title?: string
  text?: string
  confirmText?: string
  cancelText?: string
}) {
  const res = await Swal.fire({
    title: opts.title ?? 'Tem certeza?',
    text: opts.text ?? 'Esta ação não pode ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Sim, excluir',
    cancelButtonText: opts.cancelText ?? 'Cancelar',
    buttonsStyling: false,
    reverseButtons: true,
    customClass: baseClasses,
    background: 'hsl(var(--card))',
  })
  return res.isConfirmed
}

export async function confirmAction(opts: {
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
  icon?: 'warning' | 'question' | 'info'
}) {
  const res = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: opts.icon ?? 'question',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Confirmar',
    cancelButtonText: opts.cancelText ?? 'Cancelar',
    buttonsStyling: false,
    reverseButtons: true,
    customClass: baseClasses,
    background: 'hsl(var(--card))',
  })
  return res.isConfirmed
}

export { Swal }
