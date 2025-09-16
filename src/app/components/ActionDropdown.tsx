// src/app/components/ActionDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface ActionDropdownProps {
  faltantesTicket?: string;
  rechazosTicket?: string;
  onFaltantesClick: () => void;
  onRechazosClick: () => void;
}

export default function ActionDropdown({ 
  faltantesTicket, 
  rechazosTicket, 
  onFaltantesClick, 
  onRechazosClick 
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      {/* Three dots icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 5px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          backgroundColor: 'var(--color-button-background)',
          margin: '-2px 0px'
        }}
        aria-label="Acciones"
      >
        <div style={{ 
          width: '4px', 
          height: '4px', 
          backgroundColor: 'var(--color-button-text)', 
          borderRadius: '50%', 
          margin: '1px 0' 
        }}></div>
        <div style={{ 
          width: '4px', 
          height: '4px', 
          backgroundColor: 'var(--color-button-text)', 
          borderRadius: '50%', 
          margin: '1px 0' 
        }}></div>
        <div style={{ 
          width: '4px', 
          height: '4px', 
          backgroundColor: 'var(--color-button-text)', 
          borderRadius: '50%', 
          margin: '1px 0' 
        }}></div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            backgroundColor: 'var(--color-button-background)',
            border: '1px solid var(--color-button-text)',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '180px',
            marginTop: '5px',
          }}
        >
          {/* Faltantes option */}
          <button
            onClick={() => {
              onFaltantesClick();
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-button-text)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {faltantesTicket && (
              <span style={{ 
                backgroundColor: '#233D4D', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                marginRight: '8px',
                fontSize: '12px'
              }}>
                {faltantesTicket}
              </span>
            )}
            <span>Faltantes/Sobrantes</span>
          </button>

          {/* Rechazos option */}
          <button
            onClick={() => {
              onRechazosClick();
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-button-text)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {rechazosTicket && (
              <span style={{ 
                backgroundColor: '#233D4D', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                marginRight: '8px',
                fontSize: '12px'
              }}>
                {rechazosTicket}
              </span>
            )}
            <span>Rechazo</span>
          </button>
        </div>
      )}
    </div>
  );
}