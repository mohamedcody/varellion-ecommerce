import React from 'react';

export interface JsonLdProps {
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

/**
 * Reusable JSON-LD Structured Data Script Component
 * Serializes schema objects safely, escaping '<' to prevent XSS injection.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: (JSON.stringify(data) || '{}').replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
      }}
    />
  );
}

export default JsonLd;
