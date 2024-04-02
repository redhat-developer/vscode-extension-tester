const line = 'line';
const num = 5;
const bool = false;
for (let i = 1; i < 10; i++) {
    console.log(`${line}${i}`);
}
setTimeout(() => {
    console.log('done');
}, 2000);