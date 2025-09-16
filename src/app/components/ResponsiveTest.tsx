// Test page for responsive design verification
'use client'

import { useState, useEffect } from 'react'
import { isMobilePhone, isTabletOrDesktop } from '@/lib/deviceUtils'

export default function ResponsiveTestPage() {
  const [deviceInfo, setDeviceInfo] = useState({
    isPhone: false,
    isTabletOrDesktop: false,
    screenWidth: 0,
    screenHeight: 0
  })

  useEffect(() => {
    setDeviceInfo({
      isPhone: isMobilePhone(),
      isTabletOrDesktop: isTabletOrDesktop(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    })
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Responsive Design Test</h1>
      
      <div style={{ 
        backgroundColor: '#233D4D', 
        color: '#CCCCCC', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Device Information</h2>
        <p><strong>Is Phone:</strong> {deviceInfo.isPhone ? 'Yes' : 'No'}</p>
        <p><strong>Is Tablet/Desktop:</strong> {deviceInfo.isTabletOrDesktop ? 'Yes' : 'No'}</p>
        <p><strong>Screen Width:</strong> {deviceInfo.screenWidth}px</p>
        <p><strong>Screen Height:</strong> {deviceInfo.screenHeight}px</p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        flexDirection: deviceInfo.isPhone ? 'column' : 'row',
        marginBottom: '20px'
      }}>
        <div style={{ 
          width: deviceInfo.isPhone ? '100%' : '65%', 
          backgroundColor: '#FE7F2D', 
          color: '#233D4D', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h2>Left Column (Izquierda)</h2>
          <p>This column takes 65% width on tablets/desktops and 100% on phones.</p>
          
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            padding: '15px', 
            borderRadius: '5px',
            marginTop: '15px'
          }}>
            <h3>Sample Content</h3>
            <p>This represents the main scanning interface and package list.</p>
          </div>
        </div>
        
        {!deviceInfo.isPhone && (
          <div style={{ 
            width: '35%', 
            backgroundColor: '#A1C181', 
            color: '#233D4D', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <h2>Right Column (Derecha)</h2>
            <p>This column is only visible on tablets and desktops.</p>
            
            <div style={{ 
              backgroundColor: 'rgba(0,0,0,0.1)', 
              padding: '15px', 
              borderRadius: '5px',
              marginTop: '15px'
            }}>
              <h3>Progress Information</h3>
              <p>This would show DN progress cards on larger screens.</p>
            </div>
          </div>
        )}
      </div>
      
      {deviceInfo.isPhone && (
        <div style={{ 
          backgroundColor: '#A1C181', 
          color: '#233D4D', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h2>Progress Section (Mobile)</h2>
          <p>On mobile devices, the progress information appears below the main content.</p>
          
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            padding: '15px', 
            borderRadius: '5px',
            marginTop: '15px'
          }}>
            <h3>Progress Cards</h3>
            <p>These would be the DN progress cards on mobile devices.</p>
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#233D4D', 
        color: '#CCCCCC', 
        borderRadius: '8px'
      }}>
        <h3>Responsive Behavior</h3>
        <p>
          {deviceInfo.isPhone 
            ? "You're viewing this on a phone. The layout is stacked vertically with the progress section below the main content."
            : "You're viewing this on a tablet or desktop. The layout has two columns with the progress section in the right column."}
        </p>
      </div>
    </div>
  )
}