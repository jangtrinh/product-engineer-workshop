// Workbook: autosaves every input to the learner's browser and copies one sheet as Markdown.
// The data stays on the learner's device (localStorage); nothing is sent anywhere.
(function () {
  'use strict';
  var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
  var isVi = lang.indexOf('vi') === 0;
  var msg = isVi
    ? {
        savedPrefix: 'Đã lưu trên thiết bị này lúc ',
        saveBlocked: 'Trình duyệt đang chặn lưu tự động. Hãy chép phiếu ra chỗ khác trước khi đóng trang.',
        timeLocale: 'vi-VN',
        sheetDefault: 'Phiếu bài tập',
        labelPrefix: '  Nhãn: ',
        notChosen: 'chưa chọn',
        notWritten: '(chưa điền)',
        sheetCopied: 'Đã chép phiếu dạng Markdown để dán vào nơi nộp bài.',
        sheetCopyFail: 'Không chép tự động được. Hãy tự chép nội dung trong từng ô ra ngoài.',
        targetMissing: 'Không tìm thấy phần cần chép.',
        targetCopied: 'Đã chép mẫu. Hãy dán ra ngoài rồi điền thông tin.',
        targetCopyFail: 'Không chép tự động được. Hãy chọn toàn bộ phần mẫu để tự chép.'
      }
    : {
        savedPrefix: 'Saved on this device at ',
        saveBlocked: 'The browser did not allow saving. Copy the sheet somewhere else before you close the page.',
        timeLocale: 'en-GB',
        sheetDefault: 'Sheet',
        labelPrefix: '  Label: ',
        notChosen: 'not chosen',
        notWritten: '(not written yet)',
        sheetCopied: 'Sheet copied as Markdown. Paste it into the tool you use to submit.',
        sheetCopyFail: 'Automatic copy failed. Select the boxes and copy them by hand.',
        targetMissing: 'Copy target not found.',
        targetCopied: 'Template copied. Paste it and fill in your details.',
        targetCopyFail: 'Automatic copy failed. Select the block and copy it by hand.'
      };
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
          ? msg.savedPrefix + new Date().toLocaleTimeString(msg.timeLocale, { hour: '2-digit', minute: '2-digit' }) + '.'
          : msg.saveBlocked;
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
    var lines = ['# ' + (title ? title.textContent.trim() : msg.sheetDefault), ''];
    Array.prototype.forEach.call(sheet.querySelectorAll('input[id], textarea[id], select[id]'), function (el) {
      if (el.type === 'checkbox') {
        lines.push('- [' + (el.checked ? 'x' : ' ') + '] ' + labelOf(el));
      } else if (el.tagName === 'SELECT') {
        lines.push(msg.labelPrefix + (el.value || msg.notChosen));
      } else {
        lines.push('**' + labelOf(el) + '**');
        lines.push(el.value.trim() || msg.notWritten);
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
          status.textContent = ok ? msg.sheetCopied : msg.sheetCopyFail;
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
        if (status) { status.textContent = msg.targetMissing; }
        return;
      }
      var text = target.textContent.trim();
      copyText(text, function (ok) {
        if (status) {
          status.textContent = ok ? msg.targetCopied : msg.targetCopyFail;
        }
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-print]'), function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });
})();
