export type Mark='dot'|'hand'|'eye'|'paw';
const graphics:Record<Mark,string>={
 dot:'<svg class="dot" viewBox="0 0 2 2" aria-hidden="true"><circle cx="1" cy="1" r="1" fill="white"/></svg>',
 hand:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="white" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5a1.3 1.3 0 0 1 2.6 0v5-7a1.3 1.3 0 0 1 2.6 0v7-5a1.3 1.3 0 0 1 2.6 0v5-3a1.3 1.3 0 0 1 2.6 0v8c0 3.5-2.1 6-5.7 6h-.8c-1.8 0-3.4-1-4.5-2.5l-3.1-4.1a1.4 1.4 0 0 1 2.1-1.8l1.6 1.6"/></svg>',
 eye:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="white" stroke-width="1.75"><path d="M2 12s3.4-5.5 10-5.5S22 12 22 12s-3.4 5.5-10 5.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.65"/></svg>',
 paw:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="white"><ellipse cx="5.1" cy="9.6" rx="2.05" ry="2.65" transform="rotate(-24 5 9)"/><ellipse cx="10" cy="6.35" rx="1.92" ry="2.8"/><ellipse cx="14.4" cy="6.5" rx="1.92" ry="2.8"/><ellipse cx="19" cy="9.5" rx="2.05" ry="2.65" transform="rotate(24 19 9)"/><path d="M12 11c2.1 0 2.9 2.1 4.6 3.5 1.6 1.3 2.3 3.1 1 4.2-1.3 1-3.3.1-5.6.1s-4.3.9-5.6-.1c-1.3-1.1-.6-2.9 1-4.2C9.1 13.1 9.9 11 12 11Z"/></svg>'
};
export function reticle(element:HTMLElement,mark:Mark){if(element.dataset.mark!==mark){element.dataset.mark=mark;element.innerHTML=graphics[mark];}}
