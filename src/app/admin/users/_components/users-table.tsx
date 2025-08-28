'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, UserProfile, Role } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditDialog } from './credit-dialog';
import { SanctionDialog } from './sanction-dialog';

type UserWithProfile = User & { profile: UserProfile | null };

// --- Dialog State ---
type DialogState = {
  type: 'credit' | 'sanction' | null;
  user: UserWithProfile | null;
};

export function UsersTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- State Management ---
  const [data, setData] = React.useState<UserWithProfile[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, user: null });

  // Read state from URL
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';
  const q = searchParams.get('q') ?? '';
  const role = searchParams.get('role') ?? '';
  const plan = searchParams.get('plan') ?? '';

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(limit),
  });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  // --- Columns Definition ---
  const columns: ColumnDef<UserWithProfile>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'profile.role',
      header: 'Role',
      cell: ({ row }) => row.original.profile?.role || 'N/A',
    },
    {
      accessorKey: 'profile.plan',
      header: 'Plan',
      cell: ({ row }) => row.original.profile?.plan || 'N/A',
    },
    {
      accessorKey: 'profile.country',
      header: 'Location',
      cell: ({ row }) => {
        const p = row.original.profile;
        if (!p || !p.city || !p.country) return 'N/A';
        return `${p.city}, ${p.country}`;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined At',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDialogState({ type: 'credit', user })}>
                Add/Remove Credits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialogState({ type: 'sanction', user })}>
                Apply Sanction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- Data Fetching ---
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(pageIndex + 1));
      params.set('limit', String(pageSize));

      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        const json = await res.json();
        setData(json.users || []);
        setPageCount(Math.ceil(json.total / pageSize));
      } catch (e: any) {
        setError(e.message);
        setData([]);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pageIndex, pageSize, searchParams]);

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  // --- Event Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page on new filter
    router.push(`${pathname}?${params.toString()}`);
  };

  // --- Rendering ---
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by email..."
          defaultValue={q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="max-w-sm"
        />
        <Select value={role} onValueChange={(value) => handleFilterChange('role', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {Object.values(Role).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={(value) => handleFilterChange('plan', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                  {`Error: ${error}`}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {/* --- Dialogs --- */}
      <CreditDialog
        isOpen={dialogState.type === 'credit'}
        onClose={() => setDialogState({ type: null, user: null })}
        user={dialogState.user}
        onSuccess={() => {
          // Refetch data after success
          const params = new URLSearchParams(searchParams.toString());
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
      <SanctionDialog
        isOpen={dialogState.type === 'sanction'}
        onClose={() => setDialogState({ type: null, user: null })}
        user={dialogState.user}
        onSuccess={() => {
          const params = new URLSearchParams(searchParams.toString());
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
    </div>
  );
}
