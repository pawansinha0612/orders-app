import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 50, duration: '3m' };

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    const res = http.get(`${BASE}/orders`);
    check(res, { 'status 200': (r) => r.status === 200 });
    sleep(0.3);
}