import React, { useState, Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'
import { HERO_ICONS_LIST } from '../appearance/IconList'
import clsx from 'clsx'
import * as HeroIcons from '@heroicons/react/24/outline'

interface IconPickerPopoverProps {
    value?: string | null
    onChange: (iconName: string) => void
    label?: string
    placeholder?: string
}

export function IconPickerPopover({ 
    value, 
    onChange, 
    label = 'Icon',
    placeholder = 'Select an icon'
}: IconPickerPopoverProps) {
    const [query, setQuery] = useState('')

    const filteredIcons = query === ''
        ? HERO_ICONS_LIST
        : HERO_ICONS_LIST.filter((icon) => {
            return icon.toLowerCase().includes(query.toLowerCase())
        })

    const SelectedIcon = value && (HeroIcons as any)[value] ? (HeroIcons as any)[value] : null

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <PopoverButton className={clsx(
                            "flex items-center justify-between w-full px-3 py-2 text-left bg-white border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
                            open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
                        )}>
                            <div className="flex items-center gap-2 truncate">
                                {SelectedIcon ? (
                                    <SelectedIcon className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200" />
                                )}
                                <span className={clsx("text-xs truncate", !value && "text-gray-400")}>
                                    {value || placeholder}
                                </span>
                            </div>
                            <ChevronUpDownIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        </PopoverButton>

                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <PopoverPanel className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden" anchor="bottom start">
                                <Combobox value={value} onChange={(val) => val && onChange(val)}>
                                    <div className="relative border-b border-gray-100">
                                        <MagnifyingGlassIcon
                                            className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-gray-400"
                                            aria-hidden="true"
                                        />
                                        <ComboboxInput
                                            className="w-full border-none py-2.5 pl-9 pr-3 text-xs leading-5 text-gray-900 focus:ring-0"
                                            placeholder="Search icons..."
                                            onChange={(event) => setQuery(event.target.value)}
                                            displayValue={(val: string) => val}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <ComboboxOptions className="max-h-60 overflow-y-auto p-1 space-y-0.5 scroll-py-1">
                                        {filteredIcons.length === 0 && query !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 text-xs text-center">
                                                Nothing found.
                                            </div>
                                        ) : (
                                            filteredIcons.map((iconName) => {
                                                const IconComponent = (HeroIcons as any)[iconName]
                                                return (
                                                    <ComboboxOption
                                                        key={iconName}
                                                        className={({ active }) =>
                                                            clsx(
                                                                'relative cursor-pointer select-none rounded-md py-2 pl-3 pr-9 flex items-center gap-2',
                                                                active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                                            )
                                                        }
                                                        value={iconName}
                                                    >
                                                        {({ selected, active }) => (
                                                            <>
                                                                {IconComponent && <IconComponent className={clsx("w-4 h-4", active ? "text-blue-500" : "text-gray-400")} />}
                                                                <span className={clsx('block truncate text-xs', selected ? 'font-semibold' : 'font-normal')}>
                                                                    {iconName}
                                                                </span>

                                                                {selected ? (
                                                                    <span
                                                                        className={clsx(
                                                                            'absolute inset-y-0 right-0 flex items-center pr-3',
                                                                            active ? 'text-blue-600' : 'text-blue-600'
                                                                        )}
                                                                    >
                                                                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </ComboboxOption>
                                                )
                                            })
                                        )}
                                    </ComboboxOptions>
                                </Combobox>
                            </PopoverPanel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    )
}
