import React from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'virto-connect': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        id?: string
        server?: string
        'provider-url'?: string
      }
      'virto-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        id?: string
        label?: string
        variant?: string
        disabled?: boolean
        loading?: boolean
        onClick?: (event: React.MouseEvent<HTMLElement>) => void
      }
      'virto-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        id?: string
        type?: string
        placeholder?: string
        value?: string
        disabled?: boolean
        label?: string
        onInput?: (event: React.FormEvent<HTMLElement>) => void
        onChange?: (event: React.FormEvent<HTMLElement>) => void
      }
    }
  }
} 