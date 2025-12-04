import React from 'react';
import { GroundingMetadata } from '../types';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface GroundingChipsProps {
  metadata?: GroundingMetadata;
}

export const GroundingChips: React.FC<GroundingChipsProps> = ({ metadata }) => {
  if (!metadata?.groundingChunks || metadata.groundingChunks.length === 0) {
    return null;
  }

  // Filter chunks that have web or maps data
  const validChunks = metadata.groundingChunks.filter(c => c.web || c.maps);

  if (validChunks.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {validChunks.map((chunk, index) => {
        if (chunk.maps) {
          return (
            <a
              key={index}
              href={chunk.maps.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200 hover:bg-green-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{chunk.maps.title} (Open Map)</span>
            </a>
          );
        }
        if (chunk.web) {
          return (
            <a
              key={index}
              href={chunk.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{chunk.web.title}</span>
            </a>
          );
        }
        return null;
      })}
    </div>
  );
};
