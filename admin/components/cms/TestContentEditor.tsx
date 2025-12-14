'use client'

import React from 'react'

export const TestContentEditor: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      border: '2px solid red',
      minHeight: '400px'
    }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>TEST CONTENT EDITOR</h1>
      <p>If you can see this, the component is rendering correctly.</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: 'blue', 
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  )
}
