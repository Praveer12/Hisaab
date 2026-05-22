import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, Plus, Minus, Trash2, Copy, ShoppingBag, X, Check } from 'lucide-react';

const UNITS = [
  { key: 'kg',  label: 'KG',    suffix: '/ kg', rateUnit: 'kg', factor: 1 },
  { key: 'gm',  label: 'gm',    suffix: '/ kg', rateUnit: 'kg', factor: 1 / 1000 },
  { key: 'L',   label: 'Litre', suffix: '/ L',  rateUnit: 'L',  factor: 1 },
  { key: 'ml',  label: 'ml',    suffix: '/ L',  rateUnit: 'L',  factor: 1 / 1000 },
  { key: 'pcs', label: 'Pcs',   suffix: '/ pc', rateUnit: 'pc', factor: 1 },
];

const QUICK_AMOUNTS_DEFAULT = [0.25, 0.5, 1, 5];
const QUICK_AMOUNTS_SMALL = [50, 100, 250, 500];

export default function CalculatorPage() {
  // Calculator form state
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');

  // Basket state
  const [basket, setBasket] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Derived
  const rateNum = parseFloat(rate) || 0;
  const qtyNum = parseFloat(quantity) || 0;
  const unitObj = UNITS.find((u) => u.key === unit);
  const currentTotal = parseFloat((rateNum * qtyNum * (unitObj?.factor || 1)).toFixed(2));

  // Quick amounts adapt: gm/ml get larger increments (50, 100, 250, 500)
  const isSmallUnit = unit === 'gm' || unit === 'ml';
  const quickAmounts = isSmallUnit ? QUICK_AMOUNTS_SMALL : QUICK_AMOUNTS_DEFAULT;

  const grandTotal = useMemo(
    () => basket.reduce((sum, item) => sum + item.total, 0),
    [basket]
  );

  // Handlers
  const adjustQuantity = useCallback((delta) => {
    setQuantity((prev) => {
      const val = Math.max(0, (parseFloat(prev) || 0) + delta);
      // For gm/ml, always show integers; for kg/L/pcs, show up to 2 decimals
      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
    });
  }, []);

  const handleAddToBasket = useCallback(() => {
    if (qtyNum <= 0 || rateNum <= 0) return;
    const newItem = {
      id: Date.now() + Math.random(),
      name: itemName.trim() || 'Item',
      rate: rateNum,
      quantity: qtyNum,
      unit,
      displayUnit: unitObj?.label || unit,
      rateUnit: unitObj?.rateUnit || unit,
      total: currentTotal,
    };
    setBasket((prev) => [newItem, ...prev]);
    // Reset form
    setItemName('');
    setRate('');
    setQuantity('');
  }, [itemName, rateNum, qtyNum, unit, currentTotal]);

  const handleRemoveItem = useCallback((id) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearBasket = useCallback(() => {
    setBasket([]);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    if (basket.length === 0) return;
    const lines = basket.map(
      (item) =>
        `${item.name} — ${item.quantity} ${item.displayUnit} × ₹${item.rate}/${item.rateUnit} = ₹${item.total.toFixed(2)}`
    );
    const text = `🧮 Hisaab Calculator\n${'─'.repeat(28)}\n${lines.join('\n')}\n${'─'.repeat(28)}\n💰 Grand Total: ₹${grandTotal.toFixed(2)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [basket, grandTotal]);

  return (
    <div className="calculator-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Calculator</h2>
          <p className="page-subtitle">Quick price calculator for any item</p>
        </div>
      </div>

      <div className="calc-grid">
        {/* ═══ LEFT: Calculator Input Pane ═══ */}
        <div className="calc-input-pane">
          <div className="calc-card">
            <div className="calc-card-header">
              <Calculator size={22} />
              <h3>Item Calculator</h3>
            </div>

            {/* Item Name */}
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                id="calc-item-name"
                type="text"
                className="form-input"
                placeholder="e.g. Potato, Tomato, Curd..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            {/* Unit Selector */}
            <div className="form-group">
              <label className="form-label">Unit</label>
              <div className="calc-unit-selector">
                {UNITS.map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    className={`calc-unit-btn ${unit === u.key ? 'active' : ''}`}
                    onClick={() => setUnit(u.key)}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate per unit */}
            <div className="form-group">
              <label className="form-label">
                Rate <span className="calc-unit-hint">{unitObj?.suffix}</span>
              </label>
              <div className="calc-currency-input">
                <span className="calc-currency-symbol">₹</span>
                <input
                  id="calc-rate"
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </div>

            {/* Quantity with controls */}
            <div className="form-group">
              <label className="form-label">
                Quantity <span className="calc-unit-hint">({unitObj?.label}){isSmallUnit && <span className="calc-conversion-hint"> → rate is per {unitObj?.rateUnit}</span>}</span>
              </label>
              <div className="calc-qty-row">
                <button
                  type="button"
                  className="calc-qty-btn calc-qty-minus"
                  onClick={() => adjustQuantity(isSmallUnit ? -50 : -1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <input
                  id="calc-quantity"
                  type="number"
                  className="form-input calc-qty-input"
                  placeholder="0"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <button
                  type="button"
                  className="calc-qty-btn calc-qty-plus"
                  onClick={() => adjustQuantity(isSmallUnit ? 50 : 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick-tap paddles */}
              <div className="calc-quick-paddles">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="calc-paddle"
                    onClick={() => adjustQuantity(amt)}
                  >
                    +{isSmallUnit ? amt : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Amount Preview */}
            <div className="calc-live-total">
              <span className="calc-live-label">Amount</span>
              <span className="calc-live-value">₹{currentTotal.toFixed(2)}</span>
            </div>

            {/* Add to list button */}
            <button
              type="button"
              className="btn calc-add-btn"
              onClick={handleAddToBasket}
              disabled={qtyNum <= 0 || rateNum <= 0}
            >
              <Plus size={18} />
              Add to List
            </button>
          </div>
        </div>

        {/* ═══ RIGHT: Running Basket ═══ */}
        <div className="calc-basket-pane">
          <div className="calc-card">
            <div className="calc-card-header">
              <ShoppingBag size={22} />
              <h3>Basket</h3>
              <span className="calc-basket-count">{basket.length}</span>
            </div>

            {basket.length === 0 ? (
              <div className="calc-basket-empty">
                <ShoppingBag size={44} />
                <p>Your basket is empty</p>
                <p className="calc-basket-empty-hint">Add items from the calculator</p>
              </div>
            ) : (
              <>
                <div className="calc-basket-list">
                  {basket.map((item) => (
                    <div key={item.id} className="calc-basket-item">
                      <div className="calc-basket-item-info">
                        <span className="calc-basket-item-name">{item.name}</span>
                        <span className="calc-basket-item-detail">
                          {item.quantity} {item.displayUnit} × ₹{item.rate}/{item.rateUnit}
                        </span>
                      </div>
                      <div className="calc-basket-item-right">
                        <span className="calc-basket-item-total">₹{item.total.toFixed(2)}</span>
                        <button
                          type="button"
                          className="calc-basket-remove"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grand Total Panel */}
                <div className="calc-grand-total-panel">
                  <div className="calc-grand-total-row">
                    <span className="calc-grand-total-label">Grand Total</span>
                    <span className="calc-grand-total-value">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="calc-grand-total-sub">
                    {basket.length} item{basket.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Actions */}
                <div className="calc-basket-actions">
                  <button
                    type="button"
                    className="btn calc-copy-btn"
                    onClick={handleCopyToClipboard}
                  >
                    {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
                    {copyFeedback ? 'Copied!' : 'Copy Summary'}
                  </button>
                  <button
                    type="button"
                    className="btn calc-clear-btn"
                    onClick={handleClearBasket}
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
