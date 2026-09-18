// SPDX-License-Identifier: AGPL-3.0-only
// Bangun form variabel (RUN VARIABLES) yang dipakai ulang oleh Rakit dan Rangkai —
// satu jalur pembuatan field, bukan diduplikasi per view.

export function buildFieldGroup(runVariables) {
  const element = document.createElement('div');
  element.className = 'field-group';
  const inputs = {};

  for (const v of runVariables) {
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.textContent = v.key;
    field.appendChild(label);

    let control;
    if (v.type === 'select') {
      control = document.createElement('select');
      for (const opt of v.options) {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        optionEl.textContent = opt;
        control.appendChild(optionEl);
      }
    } else {
      control = document.createElement('input');
      control.type = 'text';
      control.value = v.isPlaceholder ? '' : v.value;
      control.placeholder = v.isPlaceholder ? v.value : '';
    }
    control.name = v.key;
    field.appendChild(control);
    element.appendChild(field);
    inputs[v.key] = control;
  }

  function collectVars() {
    const vars = {};
    for (const [key, field] of Object.entries(inputs)) vars[key] = field.value;
    return vars;
  }

  return { element, inputs, collectVars };
}
