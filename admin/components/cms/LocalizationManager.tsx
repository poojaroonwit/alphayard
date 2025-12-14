'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Input } from '../ui/Input'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export function LocalizationManager() {
  const [terms, setTerms] = useState<{ key: string; value: string }[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setTerms([
      { key: 'dashboard.title', value: 'Dashboard' },
      { key: 'users.title', value: 'Users' },
    ])
  }, [])

  const filtered = terms.filter(t => t.key.includes(search) || t.value.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <Card variant="frosted">
        <CardBody>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Localization</h1>
          <p className="text-sm text-gray-500">Manage translations.</p>
        </CardBody>
      </Card>
      <Card variant="frosted">
        <CardBody>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Search terms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>
      <Card variant="frosted">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Key</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filtered.map(t => (
                  <tr key={t.key} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900">{t.key}</td>
                    <td className="px-6 py-3 text-sm">
                      <Input
                        value={t.value}
                        onChange={(e) => setTerms(prev => prev.map(x => x.key === t.key ? { ...x, value: e.target.value } : x))}
                        className="w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}


