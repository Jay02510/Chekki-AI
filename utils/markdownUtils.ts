/**
 * Converts basic markdown (**bold**, *italic*, ==highlight==, numbered/bullet lists) to safe HTML.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";
  
  return text
    // Numbered list items: "1. text" → paragraph with bold number
    .replace(/^(\d+\.\s+)(.+)$/gm, '<p class="mb-2"><strong>$1</strong>$2</p>')
    // Bullet list items: "  * text" or "* text"
    .replace(/^\s*[*•-]\s+(.+)$/gm, '<p class="ml-4 mb-1 before:content-[\'·\'] before:mr-2 before:text-orange-400">$1</p>')
    // Bold+italic: ***text***
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Highlight: ==text==
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    // Italic: *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Remaining plain lines (not already wrapped)
    .replace(/^(?!<)(.+)$/gm, '<p class="mb-2">$1</p>')
    // Collapse multiple blank lines
    .replace(/(<\/p>\s*){2,}/g, '</p>');
}
