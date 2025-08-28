import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteItem {
    id: string;
    name: string;
}

interface AutocompleteProps {
    items: AutocompleteItem[];
    onSelect: (id: string) => void;
    placeholder?: string;
    initialValue?: string;
    disabled?: boolean;
}

const Autocomplete = ({ items, onSelect, placeholder, initialValue = '', disabled = false }: AutocompleteProps) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(initialValue);
    }, [initialValue]);

    const filterSuggestions = useCallback((value: string) => {
        const lowercasedValue = value.toLowerCase();
        if (!value) {
            setSuggestions([]);
            return;
        }
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(lowercasedValue)
        );
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        setActiveIndex(-1);
    }, [items]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        filterSuggestions(value);
    };

    const handleSelect = (item: AutocompleteItem) => {
        setInputValue(item.name);
        onSelect(item.id);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                break;
            case 'Enter':
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    e.preventDefault();
                    handleSelect(suggestions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };
    
    const suggestionsListRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (activeIndex >= 0 && suggestionsListRef.current) {
            const activeItem = suggestionsListRef.current.children[activeIndex] as HTMLLIElement;
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-lg border border-cnk-border-light bg-cnk-panel-light px-3 py-2 text-cnk-txt-primary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
                autoComplete="off"
            />
            {isOpen && suggestions.length > 0 && (
                <ul ref={suggestionsListRef} className="absolute z-10 w-full mt-1 bg-cnk-panel-light border border-cnk-border-light rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item, index) => (
                        <li
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`px-3 py-2 cursor-pointer hover:bg-cnk-accent-primary/20 ${index === activeIndex ? 'bg-cnk-accent-primary/20' : ''}`}
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;
