import React from 'react';

const Filters: React.FC = () => {
  const [duration, setDuration] = React.useState<number | null>(null);
  const [trainer, setTrainer] = React.useState<string | null>(null);

  const handleDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(Number(event.target.value));
  };

  const handleTrainerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTrainer(event.target.value);
  };

  return (
    <div className="filters">
      <div className="filter-item">
        <label htmlFor="duration">Duration:</label>
        <select id="duration" value={duration ?? ''} onChange={handleDurationChange}>
          <option value="">Select Duration</option>
          <option value="30">30 minutes</option>
          <option value="60">60 minutes</option>
          <option value="90">90 minutes</option>
        </select>
      </div>
      <div className="filter-item">
        <label htmlFor="trainer">Trainer:</label>
        <select id="trainer" value={trainer ?? ''} onChange={handleTrainerChange}>
          <option value="">Select Trainer</option>
          {/* Trainers will be populated here */}
        </select>
      </div>
    </div>
  );
};

export default Filters;