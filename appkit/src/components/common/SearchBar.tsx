'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex-1">
      <input
        type="text"
        placeholder="Search content..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  )
}
