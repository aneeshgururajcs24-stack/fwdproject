import React from 'react';

const SearchFilter = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || filterType !== 'all' || dateFilter !== 'all';

  return (
    <div className="search-filter">
      <div className="date-filter-buttons">
        <button
          className={`date-filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
          onClick={() => onDateFilterChange('all')}
        >
          All Time
        </button>
        <button
          className={`date-filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
          onClick={() => onDateFilterChange('month')}
        >
          This Month
        </button>
        <button
          className={`date-filter-btn ${dateFilter === 'last-month' ? 'active' : ''}`}
          onClick={() => onDateFilterChange('last-month')}
        >
          Last Month
        </button>
        <button
          className={`date-filter-btn ${dateFilter === '30days' ? 'active' : ''}`}
          onClick={() => onDateFilterChange('30days')}
        >
          Last 30 Days
        </button>
      </div>

      <div className="search-filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-type">Filter by Type:</label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={onClearFilters} className="btn-clear-filters">
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
