import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const TOTAL_PAGES_TO_DISPLAY = 5;

    // If total pages is less than or equal to max display, show all pages
    if (totalPages <= TOTAL_PAGES_TO_DISPLAY) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(TOTAL_PAGES_TO_DISPLAY / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    // Adjust if near the start
    if (start < 1) {
      start = 1;
      end = TOTAL_PAGES_TO_DISPLAY;
    }

    // Adjust if near the end
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - TOTAL_PAGES_TO_DISPLAY + 1;
    }

    // Show left ellipsis if we're not starting at page 1
    const showLeftEllipsis = start > 1;
    // Show right ellipsis if we're not ending at last page
    const showRightEllipsis = end < totalPages;

    // Add first page + ellipsis if needed
    if (showLeftEllipsis) {
      pages.push(1);
      if (start > 2) {
        pages.push("ellipsis");
      }
    }

    // Add visible page range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis + last page if needed
    if (showRightEllipsis) {
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                aria-label={`Page ${page}`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
};
