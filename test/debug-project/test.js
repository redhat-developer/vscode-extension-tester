const line = 'line';
for (let i = 1; i < 10; i++) {
    console.log(`${line}${i}`);
}
setTimeout(() => {
    console.log('done');
}, 2000);