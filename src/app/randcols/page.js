import React from 'react';
import { Search, Menu } from 'lucide-react';
import { models } from '../../../data/models';

// Size pattern that repeats - creates variety without hardcoding
const sizePatterns = [
  'col-span-2 row-span-2', // large square
  'col-span-1 row-span-1', // small
  'col-span-1 row-span-2', // tall portrait
  'col-span-2 row-span-1', // wide landscape
  'col-span-1 row-span-1', // small
  'col-span-1 row-span-2', // tall portrait
  'col-span-2 row-span-1', // wide landscape
  'col-span-1 row-span-1', // smallt
];

const ModelCard = ({ model, sizeClass }) => (
  <div className={`${sizeClass} relative group overflow-hidden bg-gray-100`}>
    <img
      src={model.coverImage}
      alt={model.alt || model.name}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
      <h3 className="font-bold text-lg">{model.name}</h3>
      <p className="text-xs uppercase tracking-wider">{model.talent}</p>
      {model.height && <p className="text-xs mt-1 opacity-90">{model.height}</p>}
    </div>
  </div>
);

export default function SilentNewsLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight">SILENT /NEWS</h1>
            <div className="flex items-center gap-6">
              <button className="text-sm uppercase tracking-wider hover:opacity-70 transition-opacity">
                Contact
              </button>
              <button className="hover:opacity-70 transition-opacity">
                <Search size={20} />
              </button>
              <button className="hover:opacity-70 transition-opacity">
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 auto-rows-[200px] gap-[5px]">
          {models.map((model, index) => (
            <ModelCard 
              key={model.id} 
              model={model} 
              sizeClass={sizePatterns[index % sizePatterns.length]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}