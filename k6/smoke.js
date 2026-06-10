import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
    },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    const res = http.get(`${BASE}/orders`);
    check(res, { 'status is 200': (r) => r.status === 200 });
}