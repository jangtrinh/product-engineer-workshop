// Workbook: autosaves every input to the learner's browser and copies one sheet as Markdown.
// The data stays on the learner's device (localStorage); nothing is sent anywhere.
(function () {
  'use strict';
  var page = document.body.getAttribute('data-page') || location.pathname;
  var prefix = 'pew-workbook:' + page + ':';

  function store(key, value) {
    try { localStorage.setItem(prefix + key, value); return true; } catch (e) { return false; }
  }
  function load(key) {
    try { return localStorage.getItem(prefix + key); } catch (e) { return null; }
  }

  var fields = document.querySelectorAll('input[id], textarea[id], select[id]');
  Array.prototype.forEach.call(fields, function (el) {
    var saved = load(el.id);
    if (saved !== null) {
      if (el.type === 'checkbox') { el.checked = saved === '1'; } else { el.value = saved; }
    }
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
      var ok = store(el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
      var sheet = el.closest('.sheet');
      var status = sheet && sheet.querySelector('.saved');
      if (status) {
        status.textContent = ok
          ? 'Saved on this device at ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '.'
          : 'The browser did not allow saving. Copy the sheet somewhere else before you close the page.';
      }
    });
  });

  // The label of a field: taken from <label for>, without the hint.
  function labelOf(el) {
    var label = document.querySelector('label[for="' + el.id + '"]');
    if (!label) { return el.getAttribute('aria-label') || el.id; }
    var clone = label.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.hint'), function (h) { h.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function sheetToMarkdown(sheet) {
    var title = sheet.querySelector('h3');
    var lines = ['# ' + (title ? title.textContent.trim() : 'Sheet'), ''];
    Array.prototype.forEach.call(sheet.querySelectorAll('input[id], textarea[id], select[id]'), function (el) {
      if (el.type === 'checkbox') {
        lines.push('- [' + (el.checked ? 'x' : ' ') + '] ' + labelOf(el));
      } else if (el.tagName === 'SELECT') {
        lines.push('  Label: ' + (el.value || 'not chosen'));
      } else {
        lines.push('**' + labelOf(el) + '**');
        lines.push(el.value.trim() || '(not written yet)');
        lines.push('');
      }
    });
    return lines.join('\n');
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy-sheet]'), function (btn) {
    btn.addEventListener('click', function () {
      var sheet = btn.closest('.sheet');
      var status = sheet && sheet.querySelector('.saved');
      var text = sheetToMarkdown(sheet);
      copyText(text, function (ok) {
        if (status) {
          status.textContent = ok
            ? 'Sheet copied as Markdown. Paste it into the tool you use to submit.'
            : 'Automatic copy failed. Select the boxes and copy them by hand.';
        }
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy-target]'), function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-copy-target');
      var target = targetId ? document.getElementById(targetId) : null;
      var actions = btn.closest('.actions');
      var status = (actions && actions.querySelector('.saved')) || (btn.parentElement && btn.parentElement.querySelector('.saved'));
      if (!target) {
        if (status) { status.textContent = 'Copy target not found.'; }
        return;
      }
      var text = target.textContent.trim();
      copyText(text, function (ok) {
        if (status) {
          status.textContent = ok
            ? 'Template copied. Paste it and fill in your details.'
            : 'Automatic copy failed. Select the block and copy it by hand.';
        }
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-print]'), function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });
})();
