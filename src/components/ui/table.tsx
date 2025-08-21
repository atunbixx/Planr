import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#F1F5F9] bg-white">
      <div className="overflow-x-auto">
        <table className={`w-full ${className}`}>
          {children}
        </table>
      </div>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-[#F8FAFC] ${className}`}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-[#F1F5F9] ${className}`}>
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr 
      className={`transition-colors hover:bg-[#F8FAFC] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-[#1E293B] ${className}`}>
      {children}
    </td>
  )
}