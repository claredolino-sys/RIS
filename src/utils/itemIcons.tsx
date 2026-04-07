import React from 'react';
import { 
  FileText, Pen, Droplet, Laptop, Mouse, Folder, Paperclip, Book, 
  Monitor, Printer, Scissors, Archive, Package, Keyboard, Highlighter, 
  Mail, Link, BookOpen, Notebook, Scan, Box, StickyNote, 
  Calculator, Briefcase, Trash, Battery, Usb, Cable, Presentation, 
  Eraser, Ruler, Stamp, PenTool, Files, Armchair, Coffee
} from 'lucide-react';

export const getItemIcon = (description: string, size: number = 18) => {
  const desc = description.toLowerCase();
  
  // Paper & Documents
  if (desc.includes('paper') || desc.includes('bond')) return <FileText size={size} className="text-blue-500" />;
  if (desc.includes('certificate') || desc.includes('diploma')) return <Files size={size} className="text-blue-600" />;
  
  // Writing Instruments
  if (desc.includes('pen') || desc.includes('marker') || desc.includes('pencil')) return <Pen size={size} className="text-purple-500" />;
  if (desc.includes('highlighter')) return <Highlighter size={size} className="text-yellow-400" />;
  if (desc.includes('chalk') || desc.includes('crayon')) return <PenTool size={size} className="text-pink-500" />;
  
  // Inks & Toners
  if (desc.includes('ink') || desc.includes('toner') || desc.includes('cartridge') || desc.includes('ribbon')) return <Droplet size={size} className="text-cyan-500" />;
  
  // Computers & Laptops
  if (desc.includes('laptop') || desc.includes('computer') || desc.includes('desktop') || desc.includes('pc')) return <Laptop size={size} className="text-gray-700" />;
  if (desc.includes('monitor') || desc.includes('screen') || desc.includes('display')) return <Monitor size={size} className="text-indigo-500" />;
  
  // Peripherals & Accessories
  if (desc.includes('mouse')) return <Mouse size={size} className="text-gray-600" />;
  if (desc.includes('keyboard')) return <Keyboard size={size} className="text-gray-600" />;
  if (desc.includes('flash drive') || desc.includes('usb') || desc.includes('hard drive')) return <Usb size={size} className="text-slate-500" />;
  if (desc.includes('cable') || desc.includes('wire') || desc.includes('cord') || desc.includes('adapter')) return <Cable size={size} className="text-zinc-500" />;
  
  // Folders & Envelopes
  if (desc.includes('folder') || desc.includes('clearbook') || desc.includes('binder')) return <Folder size={size} className="text-yellow-500" />;
  if (desc.includes('envelope') || desc.includes('mail')) return <Mail size={size} className="text-amber-600" />;
  
  // Fasteners & Clips
  if (desc.includes('clip') || desc.includes('fastener')) return <Paperclip size={size} className="text-gray-500" />;
  if (desc.includes('stapler') || desc.includes('staple')) return <Link size={size} className="text-slate-600" />;
  
  // Books & Notebooks
  if (desc.includes('book') && !desc.includes('notebook')) return <Book size={size} className="text-green-600" />;
  if (desc.includes('notebook') || desc.includes('notepad') || desc.includes('pad')) return <Notebook size={size} className="text-emerald-500" />;
  if (desc.includes('record') || desc.includes('logbook') || desc.includes('journal')) return <BookOpen size={size} className="text-teal-600" />;
  
  // Office Machines
  if (desc.includes('printer')) return <Printer size={size} className="text-teal-600" />;
  if (desc.includes('scanner') || desc.includes('scan')) return <Scan size={size} className="text-emerald-600" />;
  if (desc.includes('calculator')) return <Calculator size={size} className="text-slate-700" />;
  
  // Cutting Tools
  if (desc.includes('scissor') || desc.includes('cutter') || desc.includes('blade')) return <Scissors size={size} className="text-red-500" />;
  
  // Storage & Boxes
  if (desc.includes('box') || desc.includes('carton')) return <Box size={size} className="text-orange-500" />;
  if (desc.includes('archive') || desc.includes('storage')) return <Archive size={size} className="text-amber-700" />;
  
  // Adhesives
  if (desc.includes('tape') || desc.includes('masking') || desc.includes('adhesive')) return <Paperclip size={size} className="text-stone-400" />;
  if (desc.includes('glue') || desc.includes('paste') || desc.includes('sticky')) return <StickyNote size={size} className="text-yellow-400" />;
  
  // Furniture & Fixtures
  if (desc.includes('chair') || desc.includes('seat')) return <Armchair size={size} className="text-amber-800" />;
  if (desc.includes('table') || desc.includes('desk') || desc.includes('cabinet')) return <Briefcase size={size} className="text-amber-900" />;
  
  // Cleaning & Waste
  if (desc.includes('trash') || desc.includes('garbage') || desc.includes('bin') || desc.includes('waste')) return <Trash size={size} className="text-stone-500" />;
  
  // Power & Batteries
  if (desc.includes('battery') || desc.includes('power')) return <Battery size={size} className="text-green-500" />;
  
  // Presentation
  if (desc.includes('board') || desc.includes('whiteboard') || desc.includes('projector')) return <Presentation size={size} className="text-blue-400" />;
  
  // Drafting & Measuring
  if (desc.includes('eraser') || desc.includes('correction')) return <Eraser size={size} className="text-pink-300" />;
  if (desc.includes('ruler') || desc.includes('measure')) return <Ruler size={size} className="text-yellow-600" />;
  
  // Stamps & Seals
  if (desc.includes('stamp') || desc.includes('pad') || desc.includes('seal')) return <Stamp size={size} className="text-red-600" />;
  
  // Pantry / Misc
  if (desc.includes('coffee') || desc.includes('cup') || desc.includes('mug') || desc.includes('water')) return <Coffee size={size} className="text-amber-700" />;

  // Default
  return <Package size={size} className="text-gray-400" />;
};
