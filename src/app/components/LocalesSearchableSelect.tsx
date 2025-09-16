// src/app/components/LocalesSearchableSelect.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './LocalesSearchableSelect.module.css';

// Definir la interfaz Local localmente
interface Local {
  id: number;
  tipo_local: 'FRA' | 'RTL' | 'SKA' | 'WHS';
  nombre_local: string;
}

interface LocalesSearchableSelectProps {
  locals: Local[];
  selectedLocal: string;
  onLocalSelect: (localName: string) => void;
  placeholder?: string;
}

export default function LocalesSearchableSelect({ 
  locals, 
  selectedLocal, 
  onLocalSelect,
  placeholder = "Buscar y seleccionar local..."
}: LocalesSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocals, setFilteredLocals] = useState<Local[]>(locals);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar locales según el término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLocals(locals);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = locals.filter(local => 
        local.nombre_local.toLowerCase().includes(term) || 
        local.tipo_local.toLowerCase().includes(term)
      );
      setFilteredLocals(filtered);
    }
  }, [searchTerm, locals]);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Encontrar el local seleccionado
  const selectedLocalObj = locals.find(local => local.nombre_local === selectedLocal);

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Input de búsqueda */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.selector}
      >
        <span className={selectedLocal ? styles.selectorText : styles.selectorPlaceholder}>
          {selectedLocal ? 
            `[${selectedLocalObj?.tipo_local}] ${selectedLocal}` : 
            placeholder}
        </span>
        <span className={styles.arrow}>
          ▼
        </span>
      </div>

      {/* Dropdown con búsqueda y lista de locales */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Input de búsqueda dentro del dropdown */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar local..."
            className={styles.searchInput}
            autoFocus
          />

          {/* Lista de locales filtrados */}
          <div className={styles.listContainer}>
            {filteredLocals.length > 0 ? (
              filteredLocals.map(local => (
                <div
                  key={local.id}
                  onClick={() => {
                    onLocalSelect(local.nombre_local);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`${styles.listItem} ${local.nombre_local === selectedLocal ? styles.selected : ''}`}
                >
                  [{local.tipo_local}] {local.nombre_local}
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                No se encontraron locales
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}