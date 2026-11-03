/* DE 模型配置页 —— 交互层（在静态还原之上叠加，默认渲染与原页面一致） */
(function () {
    const MODEL_TYPES = ['XGBoost（.model）', 'Linear Regression（.model）', 'Python 模型（.pkl / .pickle）', 'PMML 模型（.pmml）'];
    const ALLOWED = ['.model', '.pkl', '.pickle', '.pmml'];
    const MAX_MB = 100;

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    let currentType = '';
    let uploadedExt = '';
    let conflict = false;

    /* ---------- 基础 ---------- */
    function typeBox() {
        const input = document.getElementById('0_type');
        return input ? input.closest('div[class*="style_90"]') : null;
    }

    function typeLabelEl() {
        const box = typeBox();
        if (!box) return null;
        const spans = $$('span', box).filter((s) => !s.querySelector('input'));
        return spans.length ? spans[spans.length - 1] : null;
    }

    function typeHelp() {
        return document.getElementById('0_type_help');
    }

    function writeTypeHelp(msg, show) {
        const help = typeHelp();
        if (!help) return;
        help.style.display = show ? 'block' : 'none';
        if (!show) return;
        const textEl = help.querySelector('div') || help;
        textEl.style.display = 'block';
        textEl.textContent = msg;
        textEl.style.color = '#ff4d4f';
        textEl.style.fontSize = '12px';
        textEl.style.lineHeight = '16px';
        textEl.style.whiteSpace = 'nowrap';
    }

    function hideHint(el, texts) {
        let root = el;
        for (let i = 0; i < 8 && root.parentElement; i += 1) root = root.parentElement;
        $$('*', root).forEach((n) => {
            const t = (n.textContent || '').trim();
            if (!n.children.length && texts.indexOf(t) !== -1) {
                n.style.display = 'none';
                const h = n.closest('[id$="_help"]');
                if (h) h.style.display = 'none';
            }
        });
    }

    /* ---------- 类型与文件是否匹配 ---------- */
    function expectedType(ext) {
        if (ext === '.pkl' || ext === '.pickle') return 'Python 模型（.pkl / .pickle）';
        if (ext === '.pmml') return 'PMML 模型（.pmml）';
        return '';
    }

    function isCompatible(ext, type) {
        if (!ext || !type) return true;
        if (ext === '.model') return type.indexOf('XGBoost') !== -1 || type.indexOf('Linear Regression') !== -1;
        return type === expectedType(ext);
    }

    function conflictMsg(ext) {
        if (ext === '.model') return '文件为 .model，模型类型需选择 XGBoost 或 Linear Regression';
        if (ext === '.pkl' || ext === '.pickle') return '文件为 ' + ext + '，模型类型需选择「Python 模型」';
        if (ext === '.pmml') return '文件为 .pmml，模型类型需选择「PMML 模型」';
        return '模型类型与文件格式不一致';
    }

    /* ---------- 模型类型 ---------- */
    function setModelType(label, flash) {
        const el = typeLabelEl();
        if (!el) return;
        currentType = label;
        el.textContent = label;
        el.style.color = 'rgb(3, 25, 56)';
        hideHint(el, ['Please select', 'Please input']);
        const boxEl = typeBox();
        if (boxEl) boxEl.style.borderColor = '#d9d9d9';
        if (boxEl && flash) {
            boxEl.classList.add('rcp-flash');
            setTimeout(() => boxEl.classList.remove('rcp-flash'), 1200);
        }
    }

    function showTypeHint(msg) {
        const el = typeLabelEl();
        if (el) {
            el.textContent = 'Please select';
            el.style.color = 'rgba(0, 0, 0, 0.25)';
        }
        currentType = '';
        writeTypeHelp(msg, true);
    }

    function openTypeMenu() {
        const box = typeBox();
        if (!box) return;
        closeMenus();
        const rect = box.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'rcp-menu';
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 4 + 'px';
        menu.style.width = rect.width + 'px';
        MODEL_TYPES.forEach((label) => {
            const item = document.createElement('div');
            item.className = 'rcp-menu-item' + (label === currentType ? ' is-active' : '');
            item.textContent = label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                setModelType(label, false);
                evaluateConflict();
                closeMenus();
            });
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
    }

    function closeMenus() {
        $$('.rcp-menu').forEach((m) => m.remove());
    }

    /* ---------- Next 按钮 ---------- */
    function nextButton() {
        return $$('button').filter((b) => b.textContent.trim() === 'Next')[0] || null;
    }

    function applyNextState() {
        const btn = nextButton();
        if (!btn) return;
        btn.classList.toggle('rcp-disabled', conflict);
        btn.setAttribute('aria-disabled', conflict ? 'true' : 'false');
        btn.title = conflict ? '模型类型与文件格式不一致，无法继续' : '';
    }

    function evaluateConflict() {
        if (uploadedExt && currentType && !isCompatible(uploadedExt, currentType)) {
            conflict = true;
            const box = typeBox();
            if (box) box.style.borderColor = '#ff4d4f';
            writeTypeHelp(conflictMsg(uploadedExt), true);
        } else {
            conflict = false;
            const box = typeBox();
            if (box) box.style.borderColor = '#d9d9d9';
            if (uploadedExt && !currentType) {
                writeTypeHelp('请选择 XGBoost 或 Linear Regression', true);
            } else {
                writeTypeHelp('', false);
            }
        }
        applyNextState();
    }

    /* ---------- 上传 ---------- */
    function uploadButtons() {
        return $$('button').filter((b) => b.textContent.trim() === 'Click to upload');
    }

    function errorHost(btn) {
        let node = btn;
        for (let i = 0; i < 5 && node.parentElement; i += 1) node = node.parentElement;
        let err = node.querySelector(':scope > .rcp-error');
        if (!err) {
            err = document.createElement('div');
            err.className = 'rcp-error';
            node.appendChild(err);
        }
        return err;
    }

    function showError(btn, msg) {
        const err = errorHost(btn);
        err.textContent = msg;
        err.style.display = 'block';
    }

    function clearError(btn) {
        const err = errorHost(btn);
        err.textContent = '';
        err.style.display = 'none';
    }

    function showFileName(btn, name) {
        const label = btn.lastElementChild || btn;
        label.textContent = name;
        label.style.width = 'auto';
        label.style.maxWidth = '112px';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        btn.classList.add('rcp-has-file');
        btn.title = name;
        hideHint(btn, ['Please select']);
    }

    function suffixOf(name) {
        const i = name.lastIndexOf('.');
        return i < 0 ? '' : name.slice(i).toLowerCase();
    }

    function setupUpload(btn, index) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        if (index === 0) input.accept = ALLOWED.join(',');
        if (index === 1) input.accept = '.py';
        if (index === 2) input.multiple = true;
        document.body.appendChild(input);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            input.value = '';
            input.click();
        });

        input.addEventListener('change', () => {
            if (!input.files || !input.files.length) return;
            const file = input.files[0];
            clearError(btn);

            if (index === 0) {
                const ext = suffixOf(file.name);
                if (ALLOWED.indexOf(ext) === -1) {
                    showError(btn, '模型文件格式需为 .model/.pkl/.pickle/.pmml 格式');
                    return;
                }
                if (file.size / 1024 / 1024 > MAX_MB) {
                    showError(btn, '上传文件不能大于100M');
                    return;
                }
                showFileName(btn, file.name);
                uploadedExt = ext;
                if (!currentType) {
                    const expected = expectedType(ext);
                    if (expected) {
                        setModelType(expected, true);
                    } else {
                        showTypeHint('请选择 XGBoost 或 Linear Regression');
                    }
                }
                evaluateConflict();
                return;
            }

            if (index === 1) {
                if (suffixOf(file.name) !== '.py') {
                    showError(btn, '变量处理器格式需为.py格式');
                    return;
                }
                showFileName(btn, file.name);
                return;
            }

            showFileName(btn, input.files.length > 1 ? input.files.length + ' 个文件' : file.name);
        });
    }

    /* ---------- 启动 ---------- */
    function boot() {
        const box = typeBox();
        if (box && !box.dataset.rcpBound) {
            box.dataset.rcpBound = '1';
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                if ($('.rcp-menu')) closeMenus();
                else openTypeMenu();
            });
        }
        uploadButtons().forEach((btn, i) => {
            if (btn.dataset.rcpBound) return;
            btn.dataset.rcpBound = '1';
            setupUpload(btn, i);
        });
        const next = nextButton();
        if (next && !next.dataset.rcpBound) {
            next.dataset.rcpBound = '1';
            next.addEventListener('click', (e) => {
                if (!conflict) return;
                e.preventDefault();
                e.stopPropagation();
                const boxEl = typeBox();
                if (boxEl) {
                    boxEl.classList.remove('rcp-shake');
                    void boxEl.offsetWidth;
                    boxEl.classList.add('rcp-shake');
                    setTimeout(() => boxEl.classList.remove('rcp-shake'), 500);
                }
                writeTypeHelp(conflictMsg(uploadedExt), true);
            }, true);
        }
        applyNextState();
    }

    document.addEventListener('click', closeMenus);
    window.addEventListener('resize', closeMenus);
    window.addEventListener('scroll', closeMenus, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    setTimeout(boot, 300);
    setTimeout(boot, 1200);
})();
