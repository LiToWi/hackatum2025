import React from 'react';

interface InfoBoxProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    backgroundColor?: string;
    textColor?: string;
}

const InfoSection: React.FC<InfoBoxProps> = ({
    title,
    description,
    icon,
    backgroundColor = 'bg-gray-800',
    textColor = 'text-white',
}) => {
    return (
        <div className={`${backgroundColor} rounded-lg p-6 shadow-lg border-2 border-transparent bg-clip-padding hover:border-pink-500 transition-colors duration-300`} style={{
            backgroundImage: 'linear-gradient(rgb(31, 41, 55), rgb(31, 41, 55)), linear-gradient(90deg, #ff5fa2, #9b6bff)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
        }}>
            {icon && <div className="mb-4 text-3xl text-gradient-pink-purple">{icon}</div>}
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">{title}</h3>
            <p className={`${textColor} text-sm leading-relaxed opacity-90`}>{description}</p>
        </div>
    );
};

export default InfoSection;