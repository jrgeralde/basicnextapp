import * as XLSX from 'xlsx';
import { Role } from "./actions";

export const downloadRolesExcel = (roles: Role[]) => {
    const data = roles.map((role, index) => ({
        "Row Number": index + 1,
        "Role Name": role.id,
        "Description": role.description
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Calculate column widths
    const wscols = [
        { wch: Math.max(12, ...data.map(row => row["Row Number"].toString().length)) }, // Row Number
        { wch: Math.max(15, ...data.map(row => (row["Role Name"] || "").length)) },     // Role Name
        { wch: Math.max(20, ...data.map(row => (row["Description"] || "").length)) }    // Description
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");
    XLSX.writeFile(workbook, "Roles.xlsx");
};
