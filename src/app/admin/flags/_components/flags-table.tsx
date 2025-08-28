'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FeatureFlag } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { FlagFormDialog } from './flag-form-dialog';
import { DeleteFlagDialog } from './delete-flag-dialog';

// --- Dialog State ---
type DialogState = {
  type: 'edit' | 'delete' | null;
  flag: FeatureFlag | null;
}

export function FlagsTable() {
  // --- State Management ---
  const [data, setData] = React.useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, flag: null });

  // --- Data Fetching ---
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/flags');
      if (!res.ok) throw new Error('Failed to fetch flags');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Columns Definition ---
  const columns: ColumnDef<FeatureFlag>[] = [
    { accessorKey: 'key', header: 'Key' },
    {
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ row }) => {
        const flag = row.original;
        const isEnabled = flag.type === 'BOOLEAN' ? flag.enabled : (flag.percent ?? 0) > 0;
        const text = isEnabled ? 'Enabled' : 'Disabled';
        const variant = isEnabled ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{text}</Badge>
      }
    },
    { accessorKey: 'type', header: 'Type' },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const flag = row.original;
        return flag.type === 'BOOLEAN' ? String(flag.enabled) : `${flag.percent}%`;
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const flag = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDialogState({ type: 'edit', flag })}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDialogState({ type: 'delete', flag })}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // --- Rendering ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogState({ type: 'edit', flag: null })}>Create Flag</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FlagFormDialog
        isOpen={dialogState.type === 'edit'}
        onClose={() => setDialogState({ type: null, flag: null })}
        flag={dialogState.flag}
        onSuccess={fetchData}
      />
      <DeleteFlagDialog
        isOpen={dialogState.type === 'delete'}
        onClose={() => setDialogState({ type: null, flag: null })}
        flag={dialogState.flag}
        onSuccess={fetchData}
      />
    </div>
  );
}
