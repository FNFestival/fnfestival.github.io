import { state } from './state.js';
import { buildTableHTML, applyTableColumnVisibility } from './render.js';

export function renderTrackSkeleton(elements) {
  const isHome = !state.inFilteredView && !elements.searchInput.value.trim() && elements.filterSelect.value === 'all';
  const mode = isHome ? 'compact' : state.viewMode;
  const view = isHome ? 'home' : mode;
  if (elements.content.firstElementChild?.dataset.skeletonView === view) return;

  const list = mode === 'table' ? renderTableSkeleton() : renderGridSkeleton(mode);
  elements.content.innerHTML = `
    <div class="track-skeleton" data-skeleton-view="${view}">
      <span class="skeleton-status" role="status">Loading jam tracks…</span>
      <div aria-hidden="true">
        ${isHome ? renderHomeSkeleton(list) : renderListSkeleton(list, mode)}
      </div>
    </div>
  `;

  if (mode === 'table') {
    const table = elements.content.querySelector('.tracks-table-wrapper');
    applyTableColumnVisibility(table, state.difficultyFilterInstrument);
  }
}

function renderHomeSkeleton(list) {
  return `
    <div class="info-section">
      <div class="track-stats">
        ${Array.from({ length: 3 }, () => `
          <div class="stat">
            <span class="stat-value"><span class="skeleton-block skeleton-stat-value"></span></span>
            <span class="stat-label"><span class="skeleton-block skeleton-stat-label"></span></span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="track-section">
      <div class="section-header"><span class="skeleton-block skeleton-section-title"></span></div>
      ${list}
    </div>
  `;
}

function renderListSkeleton(list, mode) {
  return `
    <div class="page-header">
      <div class="page-header-content">
        <div>
          <span class="skeleton-block skeleton-page-title"></span>
          <span class="skeleton-block skeleton-stat-label"></span>
        </div>
        <div class="view-controls">
          ${Array.from({ length: mode === 'table' ? 1 : 3 }, () => `
            <div class="control-group">
              <span class="skeleton-block skeleton-stat-label"></span>
              <span class="skeleton-block skeleton-control"></span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ${list}
  `;
}

function renderGridSkeleton(mode) {
  const detailed = mode === 'detailed';
  const instrumentCount = state.difficultyFilterInstrument === 'all' ? 8 : 1;
  return `
    <div class="tracks-grid${detailed ? ' detailed-view' : ''}">
      ${Array.from({ length: 6 }, () => `
        <div class="jam-track${detailed ? ' jam-track-detailed' : ''}">
          <span class="skeleton-block skeleton-cover"></span>
          <div class="track-text-content">
            <span class="skeleton-block skeleton-track-title"></span>
            <span class="skeleton-block skeleton-stat-label"></span>
          </div>
          ${detailed ? `
            <div class="track-difficulties">
              ${Array.from({ length: instrumentCount }, () => '<span class="skeleton-block skeleton-difficulty"></span>').join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTableSkeleton() {
  const columns = ['vocals', 'guitar', 'bass', 'drums', 'plasticVocals', 'plasticGuitar', 'plasticBass', 'plasticDrums'];
  const difficulties = columns.map(column => `
    <td class="td-diff" data-col="${column}"><span class="skeleton-block skeleton-number"></span></td>
  `).join('');
  const rows = Array.from({ length: 8 }, () => `
    <tr class="jam-track-row">
      <td class="td-cover"><span class="skeleton-block skeleton-table-cover"></span></td>
      <td class="td-title">
        <span class="skeleton-block skeleton-track-title"></span>
        <span class="skeleton-block skeleton-stat-label"></span>
      </td>
      <td class="td-num"><span class="skeleton-block skeleton-number"></span></td>
      <td class="td-num"><span class="skeleton-block skeleton-number"></span></td>
      ${difficulties}
    </tr>
  `).join('');
  return buildTableHTML().replace('<tbody></tbody>', `<tbody>${rows}</tbody>`);
}
