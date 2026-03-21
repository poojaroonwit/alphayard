export const todayStr = () => new Date().toISOString().slice(0, 10);

export const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatCurrency = (amount: number) =>
    `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
