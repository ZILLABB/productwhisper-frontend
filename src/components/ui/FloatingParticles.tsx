interface FloatingParticlesProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'mixed';
  density?: 'low' | 'medium' | 'high';
  className?: string;
  mode?: 'bubbles' | 'circles' | 'connect';
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />
  );
};

export default FloatingParticles;
