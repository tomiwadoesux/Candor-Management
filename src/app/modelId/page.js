// app/models/page.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { models } from '../../../data/models' // Adjust path if needed

const genders = ['all', 'male', 'female']

export default function ModelId() {
  const [selectedGender, setSelectedGender] = useState('all')

  const filteredModels = selectedGender === 'all'
    ? models
    : models.filter(m => m.gender === selectedGender)

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Models</h1>
      <div className="flex justify-center mb-8 gap-4">
        {genders.map(gender => (
          <button
            key={gender}
            onClick={() => setSelectedGender(gender)}
            className={`px-4 py-2 rounded-full border ${
              selectedGender === gender
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-blue-600'
            } transition`}
          >
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredModels.map(model => (
          <Link
            key={model.id}
            href={`/models/${model.id}`}
            className="block bg-white rounded-lg shadow hover:shadow-lg transition p-4 text-center"
          >
            <img
              src={model.coverImage || model.images[0]}
              alt={model.name}
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold">{model.name}</h2>
            <p className="text-gray-500 capitalize">{model.gender}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
