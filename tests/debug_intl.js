
const date1 = new Date('2025-12-18T00:00:00');
const date2 = new Date('2029-10-29T00:00:00'); // Maybe it's 2029?

const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
});

console.log('2025-12-18:', formatter.format(date1));
console.log('Current Date:', formatter.format(new Date()));
