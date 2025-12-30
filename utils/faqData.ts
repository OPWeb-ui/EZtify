
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
      { 
        q: "Is EZtify free to use?", 
        a: "Yes. The entire platform is free to use without restrictions. There are no paywalls, subscriptions, or hidden fees for any of the local tools." 
      },
      { 
        q: "Do I need an account?", 
        a: "No. EZtify operates without user accounts or logins. You can access every tool instantly. We do not track user identities or maintain user databases." 
      },
      { 
        q: "Does EZtify work offline?", 
        a: "Yes. Once the application loads in your browser, it is fully cached via a Service Worker. You can disconnect from the internet and continue using all tools." 
      },
      { 
        q: "Why does EZtify feel faster on desktop?", 
        a: "Desktop devices typically have more RAM and powerful CPUs compared to mobile devices. Since EZtify processes files locally using your hardware, performance scales with your device capabilities." 
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    items: [
      { 
        q: "Are my files uploaded to a server?", 
        a: "No. EZtify utilizes WebAssembly to process files strictly within your browser's sandboxed memory. Your documents never leave your device." 
      },
      { 
        q: "Do you store any data?", 
        a: "No. We have no backend database to store files or metadata. Once you refresh the page or close the tab, all session data is physically wiped from your browser's memory." 
      },
      { 
        q: "What happens when I close the tab?", 
        a: "The browser's garbage collector frees the allocated memory (RAM) used for file processing. All references to your documents are permanently destroyed." 
      },
      { 
        q: "Is processing encrypted?", 
        a: "The site is served via HTTPS (TLS 1.3). While files aren't transferred over the network, this ensures the application code itself is delivered securely and has not been tampered with." 
      }
    ]
  },
  {
    id: 'pdf-workspace',
    title: 'PDF Workspace (Organize)',
    items: [
      { 
        q: "Can I merge, split, rotate, and reorder pages?", 
        a: "Yes. The Workspace is a unified environment. You can perform all these actions in a single session before exporting the final document." 
      },
      { 
        q: "Is rotation permanent in the exported PDF?", 
        a: "Yes. When you rotate a page in the studio, the transformation matrix is rewritten into the exported PDF file, making the orientation change permanent." 
      },
      { 
        q: "Can I delete pages before export?", 
        a: "Yes. Select any page or group of pages and click the trash icon. Deleted pages are removed from the export stream but remain in your original file on disk." 
      },
      { 
        q: "Does undo/redo affect export results?", 
        a: "Yes. The export function always uses the current state of the visual timeline. If you undo an action, the export will reflect that previous state." 
      }
    ]
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    items: [
      { 
        q: "What image formats are supported?", 
        a: "We support standard web image formats including JPG, PNG, and WEBP. Browser support determines exact compatibility." 
      },
      { 
        q: "Can I reorder images before export?", 
        a: "Yes. Drag and drop the thumbnails in the grid view to change their sequence in the final PDF document." 
      },
      { 
        q: "Does EZtify compress images automatically?", 
        a: "Images are embedded as-is or re-encoded based on your configuration. You can adjust quality settings to balance file size against visual fidelity." 
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Performance & Troubleshooting',
    items: [
      { 
        q: "Why is processing slow on some devices?", 
        a: "Processing heavy files (like high-res PDFs) requires significant CPU and RAM. Older mobile devices may throttle performance to save battery or due to thermal limits." 
      },
      { 
        q: "What affects performance the most?", 
        a: "The number of pages and the resolution of embedded images. A 500-page PDF with high-res scans requires more memory than a 10-page text document." 
      },
      { 
        q: "What browsers are supported?", 
        a: "We support modern browsers with WebAssembly and ES6 capabilities: Chrome (80+), Firefox (75+), Safari (13.1+), and Edge (80+)." 
      },
      { 
        q: "Why did the app reset after refresh?", 
        a: "Because we do not store data on a server or persistent local storage, refreshing the page clears the browser's volatile memory, resetting the application state." 
      }
    ]
  }
];
