class UICard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['data', 'type', 'disabled', 'selected'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  get cardData() {
    try {
      return JSON.parse(this.getAttribute('data') || '{}');
    } catch { return {}; }
  }

  get cardType() {
    return this.getAttribute('type') || 'skill';
  }

  get isDisabled() {
    return this.hasAttribute('disabled');
  }

  get isSelected() {
    return this.hasAttribute('selected');
  }

  render() {
    const data = this.cardData;
    const type = this.cardType;
    const disabled = this.isDisabled;
    const selected = this.isSelected;

    let gradient = 'linear-gradient(135deg, #2c3e50, #000)';
    let borderColor = '#c8a050';
    let icon = '🃏';

    if (type === 'skill') {
      gradient = 'linear-gradient(135deg, #1a0e08, #2a1a0c)';
      borderColor = '#c85030';
      icon = '⚡';
    } else if (type === 'passive') {
      gradient = 'linear-gradient(135deg, #0a1a0e, #1a2a1c)';
      borderColor = '#50c850';
      icon = '♻';
    } else if (type === 'hechizo') {
      gradient = 'linear-gradient(135deg, #0e0a1a, #1c0e2a)';
      borderColor = '#a060d0';
      icon = '✨';
    }

    const costeHtml = data.coste !== undefined
      ? `<div class="card-cost">⚡ ${data.coste}</div>` : '';

    const descHtml = data.desc
      ? `<div class="card-desc">${data.desc}</div>`
      : data.efecto
        ? `<div class="card-desc">${data.efecto}${data.valor ? ' ' + (data.valor * 100) + '%' : ''}${data.rng ? ' (1/' + data.rng + ')' : ''}${data.duracion ? ' · ' + data.duracion + ' turnos' : ''}</div>`
        : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.5' : '1'};
          transition: transform 0.3s, box-shadow 0.3s;
        }
        :host(:hover) {
          transform: ${disabled ? 'none' : 'translateY(-6px)'};
          box-shadow: ${disabled ? 'none' : '0 8px 16px rgba(0,0,0,0.4)'};
        }
        :host([selected]) .card {
          border-color: #ffcc00;
          box-shadow: 0 0 12px rgba(255,204,0,0.3);
        }
        .card {
          width: 130px;
          height: 185px;
          background: ${gradient};
          border-radius: 10px;
          border: 2px solid ${selected ? '#ffcc00' : borderColor};
          display: flex;
          flex-direction: column;
          padding: 8px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .card-icon {
          font-size: 28px;
          text-align: center;
          margin: 4px 0 2px;
          flex-shrink: 0;
        }
        .card-name {
          color: #d4a060;
          font-size: 10px;
          letter-spacing: 1px;
          text-align: center;
          font-weight: 700;
          font-family: 'Cinzel', Georgia, serif;
          line-height: 1.2;
          flex-shrink: 0;
        }
        .card-cost {
          color: #60b0d0;
          font-size: 9px;
          letter-spacing: 1px;
          text-align: center;
          margin: 2px 0;
          flex-shrink: 0;
        }
        .card-desc {
          color: #8a6a30;
          font-size: 7px;
          text-align: center;
          line-height: 1.3;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          font-family: 'Cinzel', Georgia, serif;
        }
        .card-type-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 6px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.3);
          font-family: 'Cinzel', Georgia, serif;
        }
      </style>
      <div class="card">
        <div class="card-icon">${data.icono || icon}</div>
        <div class="card-name">${data.nombre || '???'}</div>
        ${costeHtml}
        ${descHtml}
        <div class="card-type-badge">${type.toUpperCase()}</div>
      </div>
    `;
  }
}

customElements.define('ui-card', UICard);

class UIPassiveCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['data'];
  }

  attributeChangedCallback() {
    this.render();
  }

  get cardData() {
    try {
      return JSON.parse(this.getAttribute('data') || '{}');
    } catch { return {}; }
  }

  render() {
    const data = this.cardData;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        .card {
          width: 100px;
          padding: 10px 8px;
          background: linear-gradient(135deg, #0a1a0e, #1a2a1c);
          border: 1px solid #3a6a3a;
          border-radius: 8px;
          text-align: center;
          font-family: 'Cinzel', Georgia, serif;
        }
        .badge {
          color: #60d060;
          font-size: 7px;
          letter-spacing: 2px;
          font-weight: 700;
        }
        .name {
          color: #a0d4a0;
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 700;
          margin: 4px 0;
        }
        .desc {
          color: #6a9a6a;
          font-size: 7px;
          line-height: 1.3;
        }
      </style>
      <div class="card">
        <div class="badge">PASIVA</div>
        <div class="name">${data.nombre || '???'}</div>
        <div class="desc">${data.desc || data.efecto || ''}</div>
      </div>
    `;
  }
}

customElements.define('ui-passive-card', UIPassiveCard);
