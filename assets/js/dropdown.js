const dropdowns = new WeakMap();
let closeActiveDropdown;

export function updateDropdown(select) {
  if (!select) return;

  if (!dropdowns.has(select)) {
    dropdowns.set(select, createDropdown(select));
  }
  dropdowns.get(select)();
}

function createDropdown(select) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dropdown';
  select.after(wrapper);
  select.hidden = true;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dropdown-trigger';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${select.id}Options`);
  wrapper.appendChild(button);

  const label = select.getAttribute('aria-label') || select.labels[0]?.textContent;
  const list = document.createElement('div');
  list.className = 'dropdown-options';
  list.id = `${select.id}Options`;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', label);
  list.hidden = true;
  wrapper.appendChild(list);

  const options = Array.from(select.options, option => {
    const item = document.createElement('button');
    item.type = 'button';
    item.tabIndex = -1;
    item.setAttribute('role', 'option');
    item.textContent = option.textContent;
    item.addEventListener('click', () => {
      close();
      button.focus();
      if (select.value === option.value) return;
      select.value = option.value;
      sync();
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    list.appendChild(item);
    return item;
  });

  function sync() {
    button.textContent = select.selectedOptions[0]?.textContent ?? '';
    button.setAttribute('aria-label', `${label}: ${button.textContent}`);
    options.forEach((option, index) => {
      option.setAttribute('aria-selected', String(index === select.selectedIndex));
    });
  }

  function close() {
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    closeActiveDropdown = null;
  }

  function open() {
    closeActiveDropdown?.();
    sync();
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    closeActiveDropdown = close;
    options[Math.max(0, select.selectedIndex)]?.focus();
  }

  button.addEventListener('click', () => {
    if (list.hidden) open();
    else close();
  });

  wrapper.addEventListener('focusout', event => {
    if (!list.hidden && !wrapper.contains(event.relatedTarget)) close();
  });

  wrapper.addEventListener('keydown', event => {
    if (event.target === button && list.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      open();
      return;
    }
    if (list.hidden) return;

    const index = options.indexOf(event.target);
    let next;
    switch (event.key) {
      case 'ArrowDown': next = Math.min(index + 1, options.length - 1); break;
      case 'ArrowUp': next = Math.max(index - 1, 0); break;
      case 'Home': next = 0; break;
      case 'End': next = options.length - 1; break;
      case 'Escape':
        close();
        button.focus();
        event.preventDefault();
        event.stopPropagation();
        return;
      default: return;
    }
    event.preventDefault();
    options[next]?.focus();
  });

  return sync;
}

document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.dropdown')) closeActiveDropdown?.();
});

window.addEventListener('popstate', () => closeActiveDropdown?.());
