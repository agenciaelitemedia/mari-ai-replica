import { Plan } from '@/hooks/usePlansAdmin';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PlansListProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function PlansList({ plans, onEdit, onDelete, isDeleting }: PlansListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Mensal</TableHead>
            <TableHead>Trimestral</TableHead>
            <TableHead>Semestral</TableHead>
            <TableHead>Anual</TableHead>
            <TableHead>Módulos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">
                Nenhum plano cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="font-medium">{plan.name}</div>
                  {plan.description && (
                    <div className="text-xs text-muted-foreground">{plan.description}</div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(plan.price)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(plan.price_quarterly || 0)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(plan.price_semiannual || 0)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(plan.price_annual || 0)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    {plan.module_ids?.length || 0} módulos
                  </Badge>
                </TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(plan)}
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting}
                      onClick={() => setDeleteId(plan.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Plano"
        description="Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        confirmText="Sim, Excluir"
        cancelText="Não, Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
