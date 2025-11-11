/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationData {
  data: any[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PaginationProps {
  /**
   * Current pagination data from backend response
   */
  paginationData: PaginationData;
  
  /**
   * Callback when page changes - receives the new page number (0-based)
   */
  onPageChange: (page: number) => void;
  
  /**
   * Whether the component is in loading state
   */
  loading?: boolean;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Show page size selector
   */
  showPageSizeSelector?: boolean;
  
  /**
   * Available page size options
   */
  pageSizeOptions?: number[];
  
  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (size: number) => void;
  
  /**
   * Maximum number of page buttons to show (default: 5)
   */
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  paginationData,
  onPageChange,
  loading = false,
  className = '',
  showPageSizeSelector = false,
  pageSizeOptions = [5,10, 25, 50, 100],
  onPageSizeChange,
  maxVisiblePages = 5,
}) => {
  const {
    page: currentPage,
    size: pageSize,
    totalElements,
    totalPages,
    hasNext,
    hasPrevious,
  } = paginationData;

  // Don't render if there's only one page or no data
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    // Adjust start page if we don't have enough pages at the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (loading || page < 0 || page >= totalPages) return;
    onPageChange(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  const startRecord = Math.min(currentPage * pageSize + 1, totalElements);
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className={`px-6 py-3 bg-background border-t border-border ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Records info and page size selector */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{startRecord}</span>{" "}
            to{" "}
            <span className="font-medium text-foreground">{endRecord}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalElements}</span>{" "}
            results
          </div>
          
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-input rounded text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          {/* First page */}
          <button
            onClick={() => handlePageChange(0)}
            disabled={!hasPrevious || loading}
            className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || loading}
            className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className={`px-3 py-1 rounded-md border transition-colors min-w-[2.5rem] ${
                currentPage === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              }`}
            >
              {page + 1}
            </button>
          ))}

          {/* Next page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || loading}
            className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={!hasNext || loading}
            className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current page info */}
        <div className="text-sm text-muted-foreground">
          Page{" "}
          <span className="font-medium text-foreground">{currentPage + 1}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;