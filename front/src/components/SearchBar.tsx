import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Buscar..." 
}: SearchBarProps) => {
  return (
    <div className="search-container">
      <Search size={18} className="search-icon" />
      <input 
        type="text" 
        placeholder={placeholder}
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
