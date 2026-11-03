/**
 * @name Risk Control Platform · Model Configuration
 */

import React, { useEffect, useMemo } from 'react';
import pageMarkup from './page.html?raw';
import interactionScript from './interaction.js?raw';
import logoUrl from './assets/logofull.svg';
import avatarUrl from './assets/avatar.svg';
import './static-style.css';

/**
 * DE 模型配置（Add model configuration）页面高保真还原。
 *
 * 结构与样式来自 Axhub 导出包（domlist + stylePool 重建）：
 * 见 `page.html`（DOM/文案）与 `static-style.css`（精确样式 + 本地化 Tailwind 工具类）。
 * `interaction.js` 叠加本次需求能力：四个允许后缀、上传后自动带出模型类型、超限提示。
 * 数据来源页面：https://mtn-uganda-offline-risk-web-test.mindigitaltech.com/model-center/file-config-detail?editable=1
 */
export default function RiskControlPlatform() {
    const pageHtml = useMemo(
        () => pageMarkup
            .split('assets/logofull.svg').join(logoUrl)
            .split('assets/avatar.svg').join(avatarUrl),
        [],
    );

    useEffect(() => {
        const script = document.createElement('script');
        script.textContent = interactionScript;
        document.body.appendChild(script);
        return () => script.remove();
    }, []);

    return <div className="rcp-host" dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}
