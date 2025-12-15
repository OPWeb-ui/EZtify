
export interface FAQSection {
  id: string;
  title: string;
  items: { q: string; a: string }[];
}

export const faqData: FAQSection[] = [
  {
    id: 'general',
    title: 'General',
    items: [
      { q: "Is EZtify free to use?", a: "Yes. EZtify is completely free. There are no paywalls, hidden fees, or subscriptions." },
      { q: "Do I need to create an account?", a: "No. All tools are accessible immediately without sign-up or login." },
      { q: "Does it work offline?", a: "Yes. Once the app is loaded, it works entirely offline. You can install it as a PWA (Progressive Web App) for easy access." }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    items: [
      { q: "Are my files uploaded to a server?", a: "No. All processing happens locally within your browser using WebAssembly. Your files never leave your device." },
      { q: "Do you store any of my data?", a: "No. We do not store, copy, or view your files. Once you close the tab, all session data is cleared from your browser's memory." }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      { q: "Why is processing slow?", a: "Since processing happens on your device, speed depends on your computer's CPU and memory. Large files (>500MB) may take longer." },
      { q: "Why did the app crash?", a: "Browser tabs have memory limits (usually around 4GB). If you try to process very large batches of high-res images, the browser may run out of memory." },
      { q: "Supported browsers?", a: "We recommend the latest versions of Chrome, Edge, Firefox, or Safari for the best performance and WebAssembly support." }
    ]
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    items: [
      { q: "What image formats are supported?", a: "JPG, PNG, WEBP, GIF, and BMP." },
      { q: "Can I reorder pages?", a: "Yes. Drag and drop the thumbnails in the filmstrip view to change the page order before exporting." },
      { q: "Does it compress images?", a: "By default, yes. You can adjust the quality slider in the settings panel to control file size vs. quality." }
    ]
  },
  {
    id: 'pdf-tools',
    title: 'PDF Management',
    items: [
      { q: "Can I merge encrypted PDFs?", a: "No. You must unlock the PDF first using the Unlock tool, then merge the unlocked files." },
      { q: "How do I delete pages?", a: "Use the 'Delete Pages' tool or the 'Split PDF' tool to select only the pages you want to keep." },
      { q: "Is text editable?", a: "No. These tools manipulate the PDF structure (pages, metadata) but do not edit the content text directly." }
    ]
  },
  {
    id: 'conversion',
    title: 'Converters',
    items: [
      { q: "How accurate is PDF to Word?", a: "It extracts text and basic layout. Complex formatting, tables, and images may not be perfectly preserved." },
      { q: "Can I convert scanned PDFs?", a: "No. EZtify does not currently include OCR (Optical Character Recognition). Scanned images will be placed as images in the document." }
    ]
  }
];
