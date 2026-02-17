
function sanitizeForSheet(value) {
    if (typeof value === 'string' && (
        value.startsWith('=') ||
        value.startsWith('+') ||
        value.startsWith('-') ||
        value.startsWith('@')
    )) {
      return "'" + value;
    }
    return value;
}

// Test Suite
function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(desc, input, expected) {
        const result = sanitizeForSheet(input);
        if (result === expected) {
            console.log(`✅ ${desc}`);
            passed++;
        } else {
            console.error(`❌ ${desc}: Expected "${expected}", got "${result}"`);
            failed++;
        }
    }

    console.log("Starting Sanitization Tests...");

    // Formula Injection Vectors
    assert("Prevents = formulas", "=SUM(1,1)", "'=SUM(1,1)");
    assert("Prevents + formulas", "+1+2", "'+1+2");
    assert("Prevents - formulas", "-1+2", "'-1+2");
    assert("Prevents @ functions", "@SUM(1,1)", "'@SUM(1,1)");

    // Normal Inputs
    assert("Allows normal text", "Product A", "Product A");
    assert("Allows numbers as strings", "12345", "12345");
    assert("Allows strings with = in middle", "A = B", "A = B");

    // Non-string Inputs
    assert("Allows numbers", 123, 123);
    assert("Allows null", null, null);
    assert("Allows undefined", undefined, undefined);
    assert("Allows dates", new Date(0).toISOString(), new Date(0).toISOString()); // Testing serialized date

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) process.exit(1);
}

runTests();
