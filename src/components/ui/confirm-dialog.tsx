import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: 'text-destructive',
          bg: 'bg-destructive/10',
          button: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
        };
      case 'warning':
        return {
          icon: 'text-amber-500',
          bg: 'bg-amber-500/10',
          button: 'bg-amber-500 hover:bg-amber-600 text-white',
        };
      default:
        return {
          icon: 'text-primary',
          bg: 'bg-primary/10',
          button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px] rounded-3xl p-8 border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader className="items-center text-center space-y-4">
          <div className={cn("h-20 w-20 rounded-full flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300", styles.bg)}>
            <AlertTriangle className={cn("h-10 w-10", styles.icon)} />
          </div>
          <div className="space-y-2">
            <AlertDialogTitle className="text-2xl font-bold tracking-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8 sm:space-x-0">
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "h-12 w-full rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
              styles.button
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
          <AlertDialogCancel
            disabled={isLoading}
            className="h-12 w-full rounded-2xl font-semibold text-base border-muted-foreground/20 hover:bg-muted/50 transition-all active:scale-[0.98] mt-0"
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
