import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page animate-fade-in">
      <div className="home-header">
        <div className="home-logo">🏠</div>
        <h1 className="home-title">Hisaab</h1>
        <p className="home-subtitle">Apna hisaab rakho, aasaani se</p>
      </div>

      <div className="home-cards">
        {/* Milk Card */}
        <button
          className="service-card service-card--milk"
          onClick={() => navigate('/milk')}
        >
          <div className="service-card__icon-wrap service-card__icon-wrap--milk">
            <span className="service-card__emoji">🥛</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Doodh</h2>
            <p className="service-card__desc">Roz ka hisaab, monthly bill, providers</p>
          </div>
          <div className="service-card__arrow">›</div>
        </button>

        {/* Cook Card */}
        <button
          className="service-card service-card--cook"
          onClick={() => navigate('/cook')}
        >
          <div className="service-card__icon-wrap service-card__icon-wrap--cook">
            <span className="service-card__emoji">👨‍🍳</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Cook</h2>
            <p className="service-card__desc">Mahine ka hisaab, paid ya unpaid</p>
          </div>
          <div className="service-card__arrow">›</div>
        </button>
      </div>
    </div>
  );
}
