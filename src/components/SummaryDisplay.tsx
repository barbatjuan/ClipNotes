import React from 'react';

interface SummaryProps {
  summary: string;
  todoList?: string[];
  notes?: string;
}

export const SummaryDisplay: React.FC<SummaryProps> = ({ summary, todoList, notes }) => (
  <div className="mt-6 p-4 border rounded bg-white shadow">
    <h2 className="text-lg font-bold mb-2">Resumen</h2>
    <p className="mb-4 whitespace-pre-line">{summary}</p>
    {todoList && todoList.length > 0 && (
      <div className="mb-4">
        <h3 className="font-semibold">To-Do List</h3>
        <ul className="list-disc ml-6">
          {todoList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    )}
    {notes && (
      <div>
        <h3 className="font-semibold">Notas</h3>
        <p className="whitespace-pre-line">{notes}</p>
      </div>
    )}
  </div>
);
