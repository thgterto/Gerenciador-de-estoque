
import { rateLimitCheck } from '../server/src/infrastructure/security/RateLimiter';

const mockRequest = { ip: '127.0.0.1' } as any;
let lastStatus = 200;
let lastBody = {};

const mockReply = {
    status: (code: number) => {
        lastStatus = code;
        return {
            send: (body: any) => {
                lastBody = body;
            }
        };
    }
} as any;

async function run() {
    console.log("Starting Rate Limit Logic Verification...");

    // 5 allowed requests
    for(let i=1; i<=5; i++) {
        lastStatus = 200; // Reset
        await rateLimitCheck(mockRequest, mockReply);
        if (lastStatus !== 200) {
             console.error(`❌ Request ${i} failed with status ${lastStatus}`);
             process.exit(1);
        }
        console.log(`✅ Request ${i} passed.`);
    }

    // 6th request should fail
    lastStatus = 200;
    await rateLimitCheck(mockRequest, mockReply);
    if (lastStatus === 429) {
        console.log(`✅ Request 6 correctly blocked with 429.`);
    } else {
        console.error(`❌ Request 6 failed to block. Status: ${lastStatus}`);
        process.exit(1);
    }

    console.log("Verification Successful.");
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
