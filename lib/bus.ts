// Связь между независимыми кусками страницы (витрина, подписка, форма, сцены) через события окна.
// Так статические секции остаются серверными и не тянут за собой гидратацию.
export type InterestId = 'subscription' | 'order' | 'question';

export function pickInterest(id: InterestId, onlyIfEmpty = false) {
  window.dispatchEvent(new CustomEvent('kv:interest', { detail: { id, onlyIfEmpty } }));
}

export function setSelectedCoffee(id: string) {
  (window as unknown as { __kvSel?: string }).__kvSel = id;
  window.dispatchEvent(new CustomEvent('kv:sel', { detail: { id } }));
}

export function getSelectedCoffee(): string {
  return (window as unknown as { __kvSel?: string }).__kvSel || 'ethiopia';
}
