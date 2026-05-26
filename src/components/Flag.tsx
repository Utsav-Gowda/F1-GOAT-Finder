import React from 'react';

/**
 * Converts an emoji string to its Twemoji codepoint format.
 * Example: "🇬🇧" → "1f1ec-1f1e7"
 * Skips U+FE0F (variation selector) since Twemoji filenames omit it.
 */
function emojiToCodepoints(emoji: string): string {
  const codes: string[] = [];
  for (const ch of emoji) {
    const code = ch.codePointAt(0);
    if (code !== undefined && code !== 0xfe0f) {
      codes.push(code.toString(16));
    }
  }
  return codes.join('-');
}

interface FlagProps {
  emoji?: string;
  className?: string;
}

/**
 * Renders an emoji (typically a flag) as a Twemoji SVG image.
 * Works on every OS/browser — bypasses the Windows flag rendering issue.
 */
export const Flag: React.FC<FlagProps> = ({ emoji, className = '' }) => {
  if (!emoji) return null;

  const codepoints = emojiToCodepoints(emoji);
  if (!codepoints) return null;

  const src = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoints}.svg`;

  return (
    <img
      src={src}
      alt={emoji}
      className={`inline-block align-middle ${className}`}
      onError={(e) => {
        // Hide broken images rather than showing a broken-image icon.
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};
