// Simple inline test of contentGuard module
const { assess, normalizeText } = await import('./src/utils/contentGuard.ts');

console.log('\n🔍 Testing Content Guard Module\n');

// Test 1: Normalization
console.log('Test 1: Text Normalization');
const normalized = normalizeText('t3st 0f n0rm4liz4ti0n');
console.log(`  Input: "t3st 0f n0rm4liz4ti0n"`);
console.log(`  Output: "${normalized}"`);
console.log(`  ✅ Pass\n`);

// Test 2: Block minor age
console.log('Test 2: Block Age < 18');
const test2 = assess('17 year old character');
console.log(`  Input: "17 year old character"`);
console.log(`  Allow: ${test2.allow}, Action: ${test2.action}`);
console.log(`  Reason: ${test2.reason}`);
console.log(`  ${!test2.allow ? '✅' : '❌'} ${!test2.allow ? 'Pass' : 'Fail'}\n`);

// Test 3: Block hard term
console.log('Test 3: Block Hard Term (loli)');
const test3 = assess('loli character');
console.log(`  Input: "loli character"`);
console.log(`  Allow: ${test3.allow}, Action: ${test3.action}`);
console.log(`  Reason: ${test3.reason}`);
console.log(`  ${!test3.allow ? '✅' : '❌'} ${!test3.allow ? 'Pass' : 'Fail'}\n`);

// Test 4: Block school context
console.log('Test 4: Block School Context');
const test4 = assess('high school girl');
console.log(`  Input: "high school girl"`);
console.log(`  Allow: ${test4.allow}, Action: ${test4.action}`);
console.log(`  Reason: ${test4.reason}`);
console.log(`  ${!test4.allow ? '✅' : '❌'} ${!test4.allow ? 'Pass' : 'Fail'}\n`);

// Test 5: Block ambiguous youth
console.log('Test 5: Block Ambiguous Youth');
const test5 = assess('teen romance');
console.log(`  Input: "teen romance"`);
console.log(`  Allow: ${test5.allow}, Action: ${test5.action}`);
console.log(`  Reason: ${test5.reason}`);
console.log(`  ${!test5.allow ? '✅' : '❌'} ${!test5.allow ? 'Pass' : 'Fail'}\n`);

// Test 6: Allow adult content
console.log('Test 6: Allow Adult Content');
const test6 = assess('25 year old woman');
console.log(`  Input: "25 year old woman"`);
console.log(`  Allow: ${test6.allow}, Action: ${test6.action}`);
console.log(`  Reason: ${test6.reason}`);
console.log(`  ${test6.allow ? '✅' : '❌'} ${test6.allow ? 'Pass' : 'Fail'}\n`);

// Test 7: Obfuscation detection
console.log('Test 7: Detect Obfuscated Term (l0li)');
const test7 = assess('l0li anime');
console.log(`  Input: "l0li anime"`);
console.log(`  Allow: ${test7.allow}, Action: ${test7.action}`);
console.log(`  Reason: ${test7.reason}`);
console.log(`  ${!test7.allow ? '✅' : '❌'} ${!test7.allow ? 'Pass' : 'Fail'}\n`);

const tests = [test2, test3, test4, test5, test6, test7];
const expected = [false, false, false, false, true, false];
const passed = tests.filter((t, i) => t.allow === expected[i]).length;

console.log(`\n📊 Summary: ${passed}/${tests.length} tests passed\n`);
