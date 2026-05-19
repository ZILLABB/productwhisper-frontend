interface ParticleBackgroundProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'mixed';
  density?: 'low' | 'medium' | 'high';
  className?: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />
  );
};

export default ParticleBackground;
