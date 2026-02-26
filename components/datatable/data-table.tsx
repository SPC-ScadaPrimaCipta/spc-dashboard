"use client";

import * as React from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	ExpandedState,
	getExpandedRowModel,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterKey?: string;
	enableRowSelection?: boolean;
	disableSearch?: boolean;
	disableViewOptions?: boolean;
	customFilter?: React.ReactNode;
	onRowClick?: (row: TData) => void;
}

interface RemoteDataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterKey?: string;
	enableRowSelection?: boolean;
	disableSearch?: boolean;
	disableViewOptions?: boolean;
	customFilter?: React.ReactNode;
	onRowClick?: (row: TData) => void;
	pageCount: number;
	pagination: {
		pageIndex: number;
		pageSize: number;
	};
	onPaginationChange: (pagination: {
		pageIndex: number;
		pageSize: number;
	}) => void;
	isLoading?: boolean;
}

function DataTableContent<TData, TValue>({
	table,
	columns,
	filterKey,
	disableSearch,
	disableViewOptions,
	customFilter,
	onRowClick,
	enableRowSelection,
	globalFilter,
	setGlobalFilter,
	isLoading,
}: {
	table: any;
	columns: ColumnDef<TData, TValue>[];
	filterKey?: string;
	disableSearch?: boolean;
	disableViewOptions?: boolean;
	customFilter?: React.ReactNode;
	onRowClick?: (row: TData) => void;
	enableRowSelection?: boolean;
	globalFilter: string;
	setGlobalFilter: (value: string) => void;
	isLoading?: boolean;
}) {
	return (
		<div
			className={`space-y-${!disableSearch || !disableViewOptions ? "4" : "2"}`}
		>
			<div className={`flex items-center justify-between`}>
				<div className="flex items-center gap-2">
					{!disableSearch && (
						<div className="flex items-center">
							<Input
								placeholder={`Search...`}
								value={globalFilter ?? ""}
								onChange={(event) =>
									setGlobalFilter(event.target.value)
								}
								className="max-w-sm"
							/>
						</div>
					)}
					{customFilter}
				</div>
				{!disableViewOptions && <DataTableViewOptions table={table} />}
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup: any) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header: any) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<div
																className={
																	header.column.getCanSort()
																		? "cursor-pointer select-none flex items-center gap-1"
																		: ""
																}
																onClick={header.column.getToggleSortingHandler()}
															>
																{flexRender(
																	header
																		.column
																		.columnDef
																		.header,
																	header.getContext(),
																)}
																{{
																	asc: (
																		<ArrowUp className="h-4 w-4" />
																	),
																	desc: (
																		<ArrowDown className="h-4 w-4" />
																	),
																}[
																	header.column.getIsSorted() as string
																] ?? null}
															</div>
														</TooltipTrigger>
														<TooltipContent>
															{header.column.getNextSortingOrder() ===
															"asc"
																? "Sort ascending"
																: header.column.getNextSortingOrder() ===
																	  "desc"
																	? "Sort descending"
																	: "Clear sort"}
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									<Loader2 className="animate-spin h-6 w-6 mx-auto" />
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row: any) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
									onClick={() => {
										if (row.getCanExpand()) {
											row.toggleExpanded();
										} else {
											onRowClick?.(row.original);
										}
									}}
									className={
										onRowClick || row.getCanExpand()
											? "cursor-pointer hover:bg-muted/50"
											: ""
									}
								>
									{row.getVisibleCells().map((cell: any) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination
				table={table}
				enableRowSelection={enableRowSelection}
			/>
		</div>
	);
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filterKey,
	enableRowSelection = false,
	disableSearch = false,
	disableViewOptions = false,
	customFilter,
	onRowClick,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [expanded, setExpanded] = React.useState<ExpandedState>({});

	// Manual global filtering logic
	const filteredData = React.useMemo(() => {
		if (!globalFilter) return data;
		return data.filter((row) => {
			return Object.values(row as any).some((value) =>
				String(value)
					.toLowerCase()
					.includes(globalFilter.toLowerCase()),
			);
		});
	}, [data, globalFilter]);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getExpandedRowModel: getExpandedRowModel(),
		onExpandedChange: setExpanded,
		getSubRows: (row) => (row as any).subRows,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			expanded,
		},
	});

	return (
		<DataTableContent
			table={table}
			columns={columns}
			filterKey={filterKey}
			disableSearch={disableSearch}
			disableViewOptions={disableViewOptions}
			customFilter={customFilter}
			onRowClick={onRowClick}
			enableRowSelection={enableRowSelection}
			globalFilter={globalFilter}
			setGlobalFilter={setGlobalFilter}
		/>
	);
}

export function RemoteDataTable<TData, TValue>({
	columns,
	data,
	filterKey,
	enableRowSelection = false,
	disableSearch = false,
	disableViewOptions = false,
	customFilter,
	onRowClick,
	pageCount,
	pagination,
	onPaginationChange,
	isLoading,
}: RemoteDataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [expanded, setExpanded] = React.useState<ExpandedState>({});

	const table = useReactTable({
		data: data,
		columns,
		pageCount,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getExpandedRowModel: getExpandedRowModel(),
		onExpandedChange: setExpanded,
		getSubRows: (row) => (row as any).subRows,
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				const newPagination = updater(
					pagination || {
						pageIndex: 0,
						pageSize: 10,
					},
				);
				onPaginationChange?.(newPagination);
			} else {
				onPaginationChange?.(updater);
			}
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
			expanded,
		},
	});

	return (
		<DataTableContent
			table={table}
			columns={columns}
			filterKey={filterKey}
			disableSearch={disableSearch}
			disableViewOptions={disableViewOptions}
			customFilter={customFilter}
			onRowClick={onRowClick}
			enableRowSelection={enableRowSelection}
			globalFilter={globalFilter}
			setGlobalFilter={setGlobalFilter}
			isLoading={isLoading}
		/>
	);
}
