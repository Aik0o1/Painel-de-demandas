import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DemandWithProfiles } from '@/hooks/useDemands';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportButtonProps {
  demands: DemandWithProfiles[];
}

export function ExportButton({ demands }: ExportButtonProps) {
  const exportToCSV = () => {
    if (demands.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Prioridade',
      'Status',
      'Responsável',
      'Prazo',
      'Criado em',
      'Concluído em',
    ];

    const rows = demands.map((demand) => [
      demand.id,
      demand.title,
      demand.description || '',
      demand.priority,
      demand.status,
      demand.assignee?.full_name || demand.assignee?.email || 'Não atribuído',
      demand.due_date ? format(new Date(demand.due_date), 'yyyy-MM-dd HH:mm') : '',
      format(new Date(demand.created_at), 'yyyy-MM-dd HH:mm'),
      demand.completed_at ? format(new Date(demand.completed_at), 'yyyy-MM-dd HH:mm') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demands_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('Exportação concluída com sucesso');
  };

  const exportToExcel = () => {
    if (demands.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    // Create a simple Excel-compatible XML format
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Prioridade',
      'Status',
      'Responsável',
      'Prazo',
      'Criado em',
      'Concluído em',
    ];

    const rows = demands.map((demand) => [
      demand.id,
      demand.title,
      demand.description || '',
      demand.priority,
      demand.status,
      demand.assignee?.full_name || demand.assignee?.email || 'Não atribuído',
      demand.due_date ? format(new Date(demand.due_date), 'yyyy-MM-dd HH:mm') : '',
      format(new Date(demand.created_at), 'yyyy-MM-dd HH:mm'),
      demand.completed_at ? format(new Date(demand.completed_at), 'yyyy-MM-dd HH:mm') : '',
    ]);

    let xmlContent = '<?xml version="1.0"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '<Worksheet ss:Name="Demands">\n<Table>\n';

    // Headers
    xmlContent += '<Row>\n';
    headers.forEach((header) => {
      xmlContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    xmlContent += '</Row>\n';

    // Data rows
    rows.forEach((row) => {
      xmlContent += '<Row>\n';
      row.forEach((cell) => {
        const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xmlContent += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>\n`;
      });
      xmlContent += '</Row>\n';
    });

    xmlContent += '</Table>\n</Worksheet>\n</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demands_export_${format(new Date(), 'yyyy-MM-dd')}.xls`;
    link.click();

    toast.success('Exportação concluída com sucesso');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          Exportar como Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
