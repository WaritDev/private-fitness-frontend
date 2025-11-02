import React, { useEffect, useState } from 'react';
import { Trainer } from '@/types/trainer';

const TrainerSelect: React.FC<{ onSelect: (trainer: Trainer) => void }> = ({ onSelect }) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('/api/trainers');
        const data = await response.json();
        setTrainers(data.items || []);
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
      }
    };

    fetchTrainers();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const trainerId = event.target.value;
    const trainer = trainers.find(t => t.username === trainerId) || null;
    setSelectedTrainer(trainer);
    onSelect(trainer);
  };

  return (
    <div className="trainer-select">
      <label htmlFor="trainer">Select Trainer:</label>
      <select id="trainer" value={selectedTrainer?.username || ''} onChange={handleChange}>
        <option value="" disabled>Select a trainer</option>
        {trainers.map(trainer => (
          <option key={trainer.username} value={trainer.username}>
            {trainer.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TrainerSelect;