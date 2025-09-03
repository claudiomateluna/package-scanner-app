'use client'

import { CSSProperties } from 'react';

// --- Paleta de Colores ---
const colors = {
  background: '#233d4d',
  foreground: '#cccccc',
  accent: '#fe7f2d',
  scannedGreen: '#a1c181',
  contrastText: '#ffffff',
  darkContrastText: '#233d4d'
};

interface Props {
  dn: string;
  totalPackages: number;
  scannedPackages: number;
  isStoreUser: boolean;
}

export default function DNProgressCard({ dn, totalPackages, scannedPackages, isStoreUser }: Props) {
  const percentage = totalPackages > 0 ? (scannedPackages / totalPackages) * 100 : 0;

  const styles: { [key: string]: CSSProperties } = {
    card: {
      position: 'relative',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
      overflow: 'hidden', // Para que la barra de progreso no se salga de los bordes redondeados
      marginBottom: '5px', // Margen de 5px entre elementos
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: colors.foreground,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: colors.foreground,
      borderLeftWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftColor: colors.foreground,
      borderRightWidth: '1px',
      borderRightStyle: 'solid',
      borderRightColor: colors.foreground
    },
    progressBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      backgroundColor: colors.scannedGreen,
      width: `${percentage}%`,
      transition: 'width 0.5s ease-in-out', // Animación suave
      opacity: 0.8
    },
    contentOverlay: {
      position: 'relative',
      padding: '8px', // Cambiado de 10px 15px a 8px
      zIndex: 2, // Asegura que el contenido esté sobre la barra de progreso
      color: percentage > 40 ? colors.darkContrastText : colors.contrastText, // Cambia el color del texto para legibilidad
      transition: 'color 0.5s ease-in-out'
    },
    topRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
      // Eliminado margin-bottom
    },
    dnLabel: {
      fontWeight: 'bold',
      fontSize: '1.1em',
      margin: '0',
      textAlign: 'left' // Cambiado de right a left
    },
    progressText: {
      fontSize: '1em',
      margin: '0',
      textAlign: 'right' // Cambiado de left a right
    },
    percentageText: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      margin: '0',
      padding: '0',
      textAlign: 'center' // Centrar el porcentaje
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.progressBar}></div>
      <div style={styles.contentOverlay}>
        <div style={styles.topRow}>
          <div style={styles.dnLabel}>{isStoreUser ? 'Factura' : 'DN'}: {dn}</div>
          <div style={styles.progressText}>{scannedPackages} / {totalPackages}</div>
        </div>
        <div style={styles.percentageText}>{percentage.toFixed(0)}%</div>
      </div>
    </div>
  );
}
