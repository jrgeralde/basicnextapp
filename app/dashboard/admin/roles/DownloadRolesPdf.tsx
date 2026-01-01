"use client";

import React from 'react';
import { Role } from "./actions";
import dynamic from 'next/dynamic';
import RolesPdfDocument from './RolesPdfDocument';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Loading...</span> }
);

interface DownloadRolesPdfProps {
    roles: Role[];
    searchQuery: string;
}

const DownloadRolesPdf: React.FC<DownloadRolesPdfProps> = ({ roles, searchQuery }) => {
    // Default columns since we don't have the builder anymore
    const defaultColumns = [
        { key: 'rowNumber', label: 'Row No.' },
        { key: 'id', label: 'Role Name' },
        { key: 'description', label: 'Description' },
    ];

    return (
        <PDFDownloadLink
            document={
                <RolesPdfDocument 
                    roles={roles}
                    totalCount={roles.length}
                    searchQuery={searchQuery} 
                    selectedColumns={defaultColumns} 
                />
            }
            fileName="Roles.pdf"
            className="rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap"
        >
            {({ loading }) => 
                loading ? 'Preparing PDF...' : 'Download PDF'
            }
        </PDFDownloadLink>
    );
};

export default DownloadRolesPdf;