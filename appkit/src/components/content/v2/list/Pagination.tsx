'use client'

import React from 'react'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export const Pagination: React.FC<Props> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null

  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {typeof totalItems === 'number' && typeof itemsPerPage === 'number' && (
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className={`px-3 py-1 rounded-md border ${canPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => canNext && onPageChange(currentPage + 1)}
          disabled={!canNext}
          className={`px-3 py-1 rounded-md border ${canNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Pagination


