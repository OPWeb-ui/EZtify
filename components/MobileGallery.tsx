
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings, Plus, Share, Trash2, 
  CheckCircle2, Circle, X, Maximize2, MoreHorizontal,
  Download, Loader2, ArrowUpRight, Grid3X3
} from 'lucide-react';
import { UploadedImage } from '../types';
import { buttonTap } from '../utils/animations';
import { MobileFloatingToolbar } from './MobileFloatingToolbar';

interface MobileGalleryProps {
  items: UploadedImage[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onSelectionChange: (ids: Set<string>) => void; // Direct set update
  onDelete: (ids: string[]) => void;
  onAdd: () => void;
  onExport: () => void;
  isGenerating: boolean;
  title: string;
  settingsContent: React.ReactNode;
  exportLabel?: string;
  canReorder?: boolean; // Reserved for future specific reorder mode if needed
  primaryActionColor?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 1
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const MobileGallery: React.FC<MobileGalleryProps> = ({
  