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
    let businessId = '';
    let processorUploaded = false;
    let modelFileName = '';
    let processorName = '';
    const BUSINESS_IDS = ['MTN_Uganda', 'MTN_Ghana', 'MTN_CDI'];

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
        // 只隐藏离当前控件最近的那一处占位文案，避免把相邻字段的占位一起干掉
        let node = el;
        for (let i = 0; i < 8 && node.parentElement; i += 1) {
            node = node.parentElement;
            const leaves = $$('*', node).filter((n) => !n.children.length && texts.indexOf((n.textContent || '').trim()) !== -1);
            if (leaves.length === 1) {
                leaves[0].style.display = 'none';
                const h = leaves[0].closest('[id$="_help"]');
                if (h) h.style.display = 'none';
                return;
            }
            if (leaves.length > 1) return;
        }
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

    /* ---------- BusinessID ---------- */
    function businessBox() {
        const input = document.getElementById('0_businessId');
        if (!input) return null;
        return input.closest('div[class*="style_76"]') || input.parentElement.parentElement;
    }

    function businessLabelEl() {
        const box = businessBox();
        if (!box) return null;
        const spans = $$('span', box).filter((s) => !s.querySelector('input'));
        return spans.length ? spans[spans.length - 1] : null;
    }

    function setBusinessId(label, flash) {
        const el = businessLabelEl();
        if (!el) return;
        businessId = label;
        el.textContent = label;
        el.style.display = 'block';
        el.style.position = 'relative';
        el.style.zIndex = '3';
        el.style.color = 'rgb(3, 25, 56)';
        hideHint(el, ['Please select']);
        const help = document.getElementById('0_businessId_help');
        if (help) help.style.display = 'none';
        const box = businessBox();
        if (box && flash) {
            box.classList.add('rcp-flash');
            setTimeout(() => box.classList.remove('rcp-flash'), 1200);
        }
        applyNextState();
    }

    function openBusinessMenu() {
        const box = businessBox();
        if (!box) return;
        closeMenus();
        const rect = box.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'rcp-menu';
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 4 + 'px';
        menu.style.width = rect.width + 'px';
        BUSINESS_IDS.forEach((label) => {
            const item = document.createElement('div');
            item.className = 'rcp-menu-item' + (label === businessId ? ' is-active' : '');
            item.textContent = label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                setBusinessId(label, false);
                closeMenus();
            });
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
    }

    /* ---------- 模型类型 ---------- */
    function setModelType(label, flash) {
        const el = typeLabelEl();
        if (!el) return;
        currentType = label;
        el.textContent = label;
        el.style.display = 'block';
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

    function missingFields() {
        const miss = [];
        if (!businessId) miss.push('BusinessID');
        const nameEl = document.getElementById('0_name');
        if (!nameEl || !nameEl.value.trim()) miss.push('Model Name');
        if (!currentType) miss.push('Model Type');
        if (!uploadedExt) miss.push('Model File Upload');
        if (!processorUploaded) miss.push('Variable Processor');
        return miss;
    }

    function applyNextState() {
        const btn = nextButton();
        if (!btn) return;
        const miss = missingFields();
        const disabled = conflict || miss.length > 0;
        btn.classList.toggle('rcp-disabled', disabled);
        btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        if (conflict) {
            btn.title = '模型类型与文件格式不一致，无法继续';
        } else if (miss.length) {
            btn.title = '请先填写：' + miss.join('、');
        } else {
            btn.title = '';
        }
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
        // 用云上传图标识别上传控件，文件改名后仍能稳定命中
        return $$('button').filter((b) => b.querySelector('svg[data-icon="cloud-upload"]'));
    }

    function errorHost(btn) {
        let err = btn.__rcpErr;
        if (err && document.body.contains(err)) return err;
        err = document.createElement('div');
        err.className = 'rcp-error rcp-error-float';
        document.body.appendChild(err);
        btn.__rcpErr = err;
        return err;
    }

    function placeError(btn, err) {
        const r = btn.getBoundingClientRect();
        err.style.left = Math.round(r.left) + 'px';
        err.style.top = Math.round(r.bottom + 4) + 'px';
    }

    function findFieldHint(btn) {
        let node = btn;
        for (let i = 0; i < 7 && node.parentElement; i += 1) {
            node = node.parentElement;
            const leaves = $$('*', node).filter((n) => !n.children.length && n.textContent.trim() === 'Please select');
            if (leaves.length) return leaves[0];
        }
        return null;
    }

    function showError(btn, msg) {
        const hint = findFieldHint(btn);
        if (hint) {
            btn.__rcpHint = hint;
            hint.style.display = 'none';
        }
        const err = errorHost(btn);
        err.textContent = msg;
        err.style.display = 'block';
        placeError(btn, err);
    }

    function clearError(btn) {
        if (btn.__rcpHint) {
            btn.__rcpHint.style.display = '';
            btn.__rcpHint = null;
        }
        const err = errorHost(btn);
        err.textContent = '';
        err.style.display = 'none';
    }

    function showFileName(btn, name) {
        const btns = uploadButtons();
        if (btns[0] === btn) modelFileName = name;
        if (btns[1] === btn) processorName = name;
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
                processorUploaded = true;
                applyNextState();
                return;
            }

            showFileName(btn, input.files.length > 1 ? input.files.length + ' 个文件' : file.name);
        });
    }

    function syncView() {
        if (businessId) {
            const el = businessLabelEl();
            if (el && el.textContent.trim() !== businessId) {
                el.textContent = businessId;
                el.style.display = 'block';
                el.style.position = 'relative';
                el.style.zIndex = '3';
                el.style.color = 'rgb(3, 25, 56)';
            }
        }
        if (currentType) {
            const el = typeLabelEl();
            if (el && el.textContent.trim() !== currentType) {
                el.textContent = currentType;
                el.style.display = 'block';
                el.style.color = 'rgb(3, 25, 56)';
            }
        }
        const btns = uploadButtons();
        if (btns[0] && modelFileName && (btns[0].lastElementChild || {}).textContent !== modelFileName) {
            showFileName(btns[0], modelFileName);
        }
        if (btns[1] && processorName && (btns[1].lastElementChild || {}).textContent !== processorName) {
            showFileName(btns[1], processorName);
        }
        const nameEl = document.getElementById('0_name');
        const nameHelp = document.getElementById('0_name_help');
        if (nameEl && nameHelp) {
            nameHelp.style.display = nameEl.value.trim() ? 'none' : 'block';
        }
        applyNextState();
    }

    let syncTimer = null;
    function scheduleSync() {
        if (syncTimer) return;
        syncTimer = setTimeout(() => {
            syncTimer = null;
            syncView();
        }, 120);
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
        const bBox = businessBox();
        if (bBox && !bBox.dataset.rcpBound) {
            bBox.dataset.rcpBound = '1';
            bBox.addEventListener('click', (e) => {
                e.stopPropagation();
                if ($('.rcp-menu')) closeMenus();
                else openBusinessMenu();
            });
        }
        const nameEl = document.getElementById('0_name');
        if (nameEl && !nameEl.dataset.rcpBound) {
            nameEl.dataset.rcpBound = '1';
            nameEl.addEventListener('input', applyNextState);
            nameEl.addEventListener('blur', applyNextState);
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

    function hideFloatingErrors() {
        $$('.rcp-error-float').forEach((e) => { e.style.display = 'none'; });
    }

    document.addEventListener('click', closeMenus);
    window.addEventListener('resize', () => { closeMenus(); hideFloatingErrors(); });
    window.addEventListener('scroll', () => { closeMenus(); hideFloatingErrors(); }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    if (!window.__rcpObserver) {
        window.__rcpObserver = new MutationObserver(scheduleSync);
        window.__rcpObserver.observe(document.body, { childList: true, subtree: true });
    }
    setTimeout(boot, 300);
    setTimeout(boot, 1200);
})();
