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
          <div className="service-card__top">
            <div className="service-card__icon-wrap service-card__icon-wrap--milk">
              <span className="service-card__emoji">🥛</span>
            </div>
            <span className="service-card__arrow">›</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Doodh</h2>
            <p className="service-card__desc">Roz ka hisaab & bill</p>
          </div>
        </button>

        {/* Cook Card */}
        <button
          className="service-card service-card--cook"
          onClick={() => navigate('/cook')}
        >
          <div className="service-card__top">
            <div className="service-card__icon-wrap service-card__icon-wrap--cook">
              <span className="service-card__emoji">👨‍🍳</span>
            </div>
            <span className="service-card__arrow">›</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Cook</h2>
            <p className="service-card__desc">Haazri aur hisaab</p>
          </div>
        </button>

        {/* Maid Card */}
        <button
          className="service-card service-card--maid"
          onClick={() => navigate('/maid')}
        >
          <div className="service-card__top">
            <div className="service-card__icon-wrap service-card__icon-wrap--maid">
              <span className="service-card__emoji">🧹</span>
            </div>
            <span className="service-card__arrow">›</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Maid</h2>
            <p className="service-card__desc">Haazri aur hisaab</p>
          </div>
        </button>

        {/* Service Contacts Card */}
        <button
          className="service-card service-card--contacts"
          onClick={() => navigate('/contacts')}
        >
          <div className="service-card__top">
            <div className="service-card__icon-wrap service-card__icon-wrap--contacts">
              <span className="service-card__emoji">📇</span>
            </div>
            <span className="service-card__arrow">›</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">Contacts</h2>
            <p className="service-card__desc">Plumber, electrician</p>
          </div>
        </button>

        {/* PNR Checker Card (Wide card spanning both columns) */}
        <button
          className="service-card service-card--pnr service-card--wide"
          onClick={() => navigate('/pnr')}
        >
          <div className="service-card__icon-wrap service-card__icon-wrap--pnr">
            <span className="service-card__emoji">🚆</span>
          </div>
          <div className="service-card__body">
            <h2 className="service-card__title">PNR Status</h2>
            <p className="service-card__desc">Train status aur seat info live dekho</p>
          </div>
          <div className="service-card__arrow">›</div>
        </button>
      </div>
    </div>
  );
}
