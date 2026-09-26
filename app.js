/**
 * بژمێرە (Bzhmera) - Score Tracking Application
 * Localized in کوردیی سۆرانی (Kurdish Sorani) & RTL
 */

(() => {
  'use strict';

  // Constants & Defaults
  const STORAGE_KEY = 'bzhmera_score_tracker_v1';
  const DEFAULT_P1_NAME = 'کەسی ١';
  const DEFAULT_P2_NAME = 'کەسی ٢';

  // State
  let state = {
    player1Name: '',
    player2Name: '',
    rows: []
  };

  // Kurdish digits mapping for row numbering
  const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function toKurdishNumber(num) {
    return String(num).replace(/\d/g, d => kurdishDigits[d]);
  }

  // DOM Elements
  const p1NameInput = document.getElementById('player1Name');
  const p2NameInput = document.getElementById('player2Name');
  const thPlayer1 = document.getElementById('thPlayer1');
  const thPlayer2 = document.getElementById('thPlayer2');
  const footerP1Name = document.getElementById('footerP1Name');
  const footerP2Name = document.getElementById('footerP2Name');
  const scoreRowsContainer = document.getElementById('scoreRowsContainer');
  const addRowBtn = document.getElementById('addRowBtn');
  const totalP1El = document.getElementById('totalP1');
  const totalP2El = document.getElementById('totalP2');
  const diffBadge = document.getElementById('diffBadge');

  // Reset Modal Elements
  const resetBtn = document.getElementById('resetBtn');
  const resetModal = document.getElementById('resetModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  // Generate unique ID
  function generateId() {
    return 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  // Save to LocalStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Load from LocalStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = {
          player1Name: parsed.player1Name || '',
          player2Name: parsed.player2Name || '',
          rows: Array.isArray(parsed.rows) ? parsed.rows : []
        };
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }

    // Default to at least 1 empty row if no rows exist
    if (state.rows.length === 0) {
      state.rows.push({
        id: generateId(),
        p1: '',
        p2: '',
        note: ''
      });
    }
  }

  // Update Player Name Displays across headers and footer
  function updatePlayerNamesUI() {
    const p1 = state.player1Name.trim() || DEFAULT_P1_NAME;
    const p2 = state.player2Name.trim() || DEFAULT_P2_NAME;

    thPlayer1.textContent = p1;
    thPlayer2.textContent = p2;
    footerP1Name.textContent = p1;
    footerP2Name.textContent = p2;

    calculateTotals();
  }

  // Format number for display
  function formatScore(val) {
    if (isNaN(val)) return '0';
    // Format nicely without unnecessary trailing zeros
    return Number(val.toFixed(2)).toString();
  }

  // Calculate and update Totals
  function calculateTotals() {
    let sum1 = 0;
    let sum2 = 0;

    state.rows.forEach(row => {
      const v1 = parseFloat(row.p1);
      const v2 = parseFloat(row.p2);

      if (!isNaN(v1)) sum1 += v1;
      if (!isNaN(v2)) sum2 += v2;
    });

    totalP1El.textContent = formatScore(sum1);
    totalP2El.textContent = formatScore(sum2);

    // Update Difference & Leader badge
    const p1 = state.player1Name.trim() || DEFAULT_P1_NAME;
    const p2 = state.player2Name.trim() || DEFAULT_P2_NAME;

    const diff = Math.abs(sum1 - sum2);
    const formattedDiff = formatScore(diff);

    diffBadge.className = 'diff-badge';

    if (sum1 === sum2) {
      diffBadge.classList.add('diff-tie');
      diffBadge.textContent = 'یەکسانن';
    } else if (sum1 > sum2) {
      diffBadge.classList.add('diff-p1-lead');
      diffBadge.textContent = `${p1} بە +${formattedDiff} پێشەنگە`;
    } else {
      diffBadge.classList.add('diff-p2-lead');
      diffBadge.textContent = `${p2} بە +${formattedDiff} پێشەنگە`;
    }
  }

  // Render a Single Row DOM element
  function createRowElement(rowData, index) {
    const rowEl = document.createElement('div');
    rowEl.className = 'score-row';
    rowEl.dataset.id = rowData.id;

    rowEl.innerHTML = `
      <div class="row-index">${toKurdishNumber(index + 1)}</div>
      <input 
        type="number" 
        step="any"
        inputmode="decimal" 
        class="score-input p1-input" 
        placeholder="0"
        value="${rowData.p1 !== undefined ? rowData.p1 : ''}"
        aria-label="خاڵی ${state.player1Name.trim() || DEFAULT_P1_NAME} ڕیزی ${index + 1}"
      />
      <input 
        type="number" 
        step="any"
        inputmode="decimal" 
        class="score-input p2-input" 
        placeholder="0"
        value="${rowData.p2 !== undefined ? rowData.p2 : ''}"
        aria-label="خاڵی ${state.player2Name.trim() || DEFAULT_P2_NAME} ڕیزی ${index + 1}"
      />
      <input 
        type="text" 
        class="note-input" 
        placeholder="تێبینی..."
        value="${rowData.note ? escapeHtml(rowData.note) : ''}"
        aria-label="تێبینی بۆ ڕیزی ${index + 1}"
      />
      <button 
        type="button" 
        class="btn-delete-row" 
        title="سڕینەوەی ئەم ڕیزە" 
        aria-label="سڕینەوەی ڕیزی ${index + 1}"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    // Event Listeners for inputs
    const p1Input = rowEl.querySelector('.p1-input');
    const p2Input = rowEl.querySelector('.p2-input');
    const noteInput = rowEl.querySelector('.note-input');
    const delBtn = rowEl.querySelector('.btn-delete-row');

    p1Input.addEventListener('input', (e) => {
      rowData.p1 = e.target.value;
      calculateTotals();
      saveState();
    });

    p2Input.addEventListener('input', (e) => {
      rowData.p2 = e.target.value;
      calculateTotals();
      saveState();
    });

    noteInput.addEventListener('input', (e) => {
      rowData.note = e.target.value;
      saveState();
    });

    // Enter key navigation: on note input, add a new row
    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewRow(true);
      }
    });

    // Delete row event
    delBtn.addEventListener('click', () => {
      removeRow(rowData.id, rowEl);
    });

    return rowEl;
  }

  // Escape HTML to prevent injection in attributes
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Render all rows
  function renderAllRows() {
    scoreRowsContainer.innerHTML = '';

    if (state.rows.length === 0) {
      scoreRowsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>هیچ ڕیزێک تۆمار نەکراوە. کلیک لە دوگمەی خوارەوە بکە بۆ زیادکردن.</p>
        </div>
      `;
      calculateTotals();
      return;
    }

    state.rows.forEach((row, idx) => {
      const el = createRowElement(row, idx);
      scoreRowsContainer.appendChild(el);
    });

    calculateTotals();
  }

  // Re-index displayed rows
  function reindexRows() {
    const rowElements = scoreRowsContainer.querySelectorAll('.score-row');
    rowElements.forEach((el, index) => {
      const indexEl = el.querySelector('.row-index');
      if (indexEl) {
        indexEl.textContent = toKurdishNumber(index + 1);
      }
    });
  }

  // Add a new row
  function addNewRow(focusFirstCell = true) {
    const newRow = {
      id: generateId(),
      p1: '',
      p2: '',
      note: ''
    };

    state.rows.push(newRow);
    saveState();

    // If currently showing empty state, re-render
    const emptyState = scoreRowsContainer.querySelector('.empty-state');
    if (emptyState) {
      renderAllRows();
    } else {
      const rowEl = createRowElement(newRow, state.rows.length - 1);
      scoreRowsContainer.appendChild(rowEl);
      calculateTotals();

      if (focusFirstCell) {
        const firstInput = rowEl.querySelector('.p1-input');
        if (firstInput) {
          firstInput.focus();
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  // Remove a specific row
  function removeRow(rowId, rowEl) {
    rowEl.classList.add('removing');
    setTimeout(() => {
      state.rows = state.rows.filter(r => r.id !== rowId);
      saveState();
      
      rowEl.remove();

      if (state.rows.length === 0) {
        renderAllRows();
      } else {
        reindexRows();
        calculateTotals();
      }
    }, 180);
  }

  // Reset entire game
  function resetGame() {
    state.player1Name = '';
    state.player2Name = '';
    state.rows = [{
      id: generateId(),
      p1: '',
      p2: '',
      note: ''
    }];

    p1NameInput.value = '';
    p2NameInput.value = '';

    updatePlayerNamesUI();
    renderAllRows();
    saveState();
  }

  // Initial Setup & Event Listeners
  function init() {
    loadState();

    // Populate initial inputs
    p1NameInput.value = state.player1Name;
    p2NameInput.value = state.player2Name;

    // Listen to Player Name inputs
    p1NameInput.addEventListener('input', (e) => {
      state.player1Name = e.target.value;
      updatePlayerNamesUI();
      saveState();
    });

    p2NameInput.addEventListener('input', (e) => {
      state.player2Name = e.target.value;
      updatePlayerNamesUI();
      saveState();
    });

    // Add Row Button
    addRowBtn.addEventListener('click', () => {
      addNewRow(true);
    });

    // Reset Modal triggers
    resetBtn.addEventListener('click', () => {
      resetModal.classList.remove('hidden');
    });

    cancelResetBtn.addEventListener('click', () => {
      resetModal.classList.add('hidden');
    });

    confirmResetBtn.addEventListener('click', () => {
      resetModal.classList.add('hidden');
      resetGame();
    });

    // Close modal on outside click
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) {
        resetModal.classList.add('hidden');
      }
    });

    // Render initial UI
    updatePlayerNamesUI();
    renderAllRows();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
