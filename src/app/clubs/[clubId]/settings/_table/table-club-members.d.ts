import type { SelectClubMember } from "~/server/db/schema"
import type { RowData } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		currentMember: SelectClubMember
	}

	interface ColumnMeta<TData extends RowData, TValue> {
		tableHeadClassName?: string
	}
}
