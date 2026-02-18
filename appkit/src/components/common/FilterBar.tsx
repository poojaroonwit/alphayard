'use client'

interface FilterBarProps {
  type: string
  status: string
  onTypeChange: (type: string) => void
  onStatusChange: (status: string) => void
}

export function FilterBar({ type, status, onTypeChange, onStatusChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="input w-auto"
      >
        <option value="all">All Types</option>
        <option value="event">Events</option>
        <option value="recipe">Recipes</option>
        <option value="alert">Alerts</option>
        <option value="memory">Memories</option>
        <option value="tip">Tips</option>
        <option value="news">News</option>
      </select>
      
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="input w-auto"
      >
        <option value="all">All Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
    </div>
  )
}
