import http from 'k6/http';
import { check, group, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const PROFILE = __ENV.PROFILE || 'full-system';

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@phoenix.ps';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '12345';
const EMPLOYEE_EMAIL = __ENV.EMPLOYEE_EMAIL || 'ahmad.employee@phoenix.ps';
const EMPLOYEE_PASSWORD = __ENV.EMPLOYEE_PASSWORD || 'Password123!';
const CUSTOMER_EMAILS = (__ENV.CUSTOMER_EMAILS || 'nablus.supplies@phoenix.ps,lama.customer@phoenix.ps')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);
const CUSTOMER_PASSWORD = __ENV.CUSTOMER_PASSWORD || 'Password123!';
const DEFAULT_CUSTOMER_ID = Number(__ENV.CUSTOMER_ID || 1);
const LIST_LIMIT = Number(__ENV.LIST_LIMIT || 25);

const failureRate = new Rate('phoenix_failed_requests');
const authDuration = new Trend('phoenix_auth_duration');
const readDuration = new Trend('phoenix_read_duration');
const writeDuration = new Trend('phoenix_write_duration');
const adminDuration = new Trend('phoenix_admin_duration');
const customerDuration = new Trend('phoenix_customer_duration');
const employeeDuration = new Trend('phoenix_employee_duration');
const trackingDuration = new Trend('phoenix_tracking_duration');
const reportsSubmitted = new Counter('phoenix_reports_submitted');
const ordersSubmitted = new Counter('phoenix_orders_submitted');

const scenarioProfiles = {
  smoke: {
    executor: 'constant-vus',
    exec: 'fullSystemWorkload',
    vus: 1,
    duration: '10s',
  },
  'read-heavy': {
    executor: 'ramping-vus',
    exec: 'readHeavyWorkload',
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 25 },
      { duration: '30s', target: 0 },
    ],
  },
  'write-heavy': {
    executor: 'ramping-vus',
    exec: 'writeHeavyWorkload',
    stages: [
      { duration: '30s', target: 8 },
      { duration: '1m', target: 18 },
      { duration: '30s', target: 0 },
    ],
  },
  mixed: {
    executor: 'ramping-vus',
    exec: 'mixedWorkload',
    stages: [
      { duration: '30s', target: 10 },
      { duration: '2m', target: 25 },
      { duration: '30s', target: 0 },
    ],
  },
  'full-system': {
    executor: 'ramping-vus',
    exec: 'fullSystemWorkload',
    stages: [
      { duration: '30s', target: 8 },
      { duration: '2m', target: 20 },
      { duration: '30s', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    exec: 'mixedWorkload',
    stages: [
      { duration: '15s', target: 5 },
      { duration: '20s', target: 80 },
      { duration: '45s', target: 80 },
      { duration: '20s', target: 5 },
      { duration: '15s', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    exec: 'fullSystemWorkload',
    vus: Number(__ENV.SOAK_VUS || 20),
    duration: __ENV.SOAK_DURATION || '30m',
  },
};

export const options = {
  scenarios: {
    [PROFILE]: scenarioProfiles[PROFILE] || scenarioProfiles['full-system'],
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200'],
    phoenix_failed_requests: ['rate<0.05'],
    phoenix_auth_duration: ['p(95)<1000'],
    phoenix_read_duration: ['p(95)<900'],
    phoenix_write_duration: ['p(95)<1500'],
    phoenix_admin_duration: ['p(95)<1200'],
    phoenix_customer_duration: ['p(95)<1200'],
    phoenix_employee_duration: ['p(95)<1200'],
    phoenix_tracking_duration: ['p(95)<1000'],
  },
};

export function setup() {
  const context = {
    adminToken: null,
    employeeToken: null,
    customerToken: null,
    customerIds: [DEFAULT_CUSTOMER_ID],
    regionIds: [1],
    orderIds: [],
    shipmentIds: [],
    trackingNumbers: ['PHX-M101'],
  };

  context.adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
  context.employeeToken = login(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

  for (const email of CUSTOMER_EMAILS) {
    context.customerToken = login(email, CUSTOMER_PASSWORD);
    if (context.customerToken) break;
  }

  loadReferenceData(context);

  return context;
}

export function readHeavyWorkload(context) {
  group('read-heavy incident and operations listing', () => {
    readIncidentListing(context);
    readOperationalLookups(context);
    readTracking(context);
    readPublicContent();
  });

  sleep(1);
}

export function writeHeavyWorkload(context) {
  group('write-heavy submissions', () => {
    submitReport(context);
    submitReport(context);

    if (exec.scenario.iterationInTest % 2 === 0) {
      submitOrder(context);
    }
  });

  sleep(1);
}

export function mixedWorkload(context) {
  group('mixed operational journey', () => {
    readIncidentListing(context);

    if (exec.scenario.iterationInTest % 3 === 0) {
      submitReport(context);
    } else if (exec.scenario.iterationInTest % 3 === 1) {
      readCustomerJourney(context);
    } else {
      readEmployeeJourney(context);
    }
  });

  sleep(1);
}

export function fullSystemWorkload(context) {
  group('full-system coverage', () => {
    if (exec.scenario.iterationInTest % 10 === 0) {
      exerciseAuth();
    }

    readPublicContent();

    if (exec.scenario.iterationInTest % 3 === 0) {
      readAdminJourney(context);
    }

    readCustomerJourney(context);
    readEmployeeJourney(context);
    readIncidentListing(context);
    readOperationalLookups(context);
    readTracking(context);
    submitReport(context);

    if (exec.scenario.iterationInTest % 4 === 0) {
      submitOrder(context);
    }

    if (exec.scenario.iterationInTest % 5 === 0) {
      writeLowRiskCustomerActions(context);
    }
  });

  sleep(1);
}

function exerciseAuth() {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: jsonHeaders(), tags: { workload: 'auth', endpoint: '/api/auth/login' } }
  );

  authDuration.add(response.timings.duration);
  recordResult(response, 'auth login returns successfully');
}

function readAdminJourney(context) {
  if (!context.adminToken) return;

  const requests = [
    ['GET', `${BASE_URL}/api/admin/dashboard`, null, authedParams(context.adminToken, 'admin', '/api/admin/dashboard')],
    ['GET', `${BASE_URL}${withLimit('/api/admin/reports')}`, null, authedParams(context.adminToken, 'admin', '/api/admin/reports')],
    ['GET', `${BASE_URL}/api/admin/regions`, null, authedParams(context.adminToken, 'admin', '/api/admin/regions')],
    ['GET', `${BASE_URL}/api/admin/delegates`, null, authedParams(context.adminToken, 'admin', '/api/admin/delegates')],
    ['GET', `${BASE_URL}/api/admin/merchants`, null, authedParams(context.adminToken, 'admin', '/api/admin/merchants')],
    ['GET', `${BASE_URL}/api/admin/parcel-distribution`, null, authedParams(context.adminToken, 'admin', '/api/admin/parcel-distribution')],
    ['GET', `${BASE_URL}/api/admin/returned-shipments`, null, authedParams(context.adminToken, 'admin', '/api/admin/returned-shipments')],
    ['GET', `${BASE_URL}/api/admin/handover-requests`, null, authedParams(context.adminToken, 'admin', '/api/admin/handover-requests')],
  ];

  for (const response of http.batch(requests)) {
    adminDuration.add(response.timings.duration);
    readDuration.add(response.timings.duration);
    recordResult(response, 'admin endpoint returns successfully');
  }
}

function readCustomerJourney(context) {
  if (!context.customerToken) return;

  const requests = [
    ['GET', `${BASE_URL}/api/customers/profile/me`, null, authedParams(context.customerToken, 'customer', '/api/customers/profile/me')],
    ['GET', `${BASE_URL}${withLimit('/api/orders/me')}`, null, authedParams(context.customerToken, 'customer', '/api/orders/me')],
    ['GET', `${BASE_URL}${withLimit('/api/customers/settlements/me')}`, null, authedParams(context.customerToken, 'customer', '/api/customers/settlements/me')],
    ['GET', `${BASE_URL}${withLimit('/api/notifications/me')}`, null, authedParams(context.customerToken, 'customer', '/api/notifications/me')],
    ['GET', `${BASE_URL}/api/notifications/unread-count`, null, authedParams(context.customerToken, 'customer', '/api/notifications/unread-count')],
  ];

  for (const response of http.batch(requests)) {
    customerDuration.add(response.timings.duration);
    readDuration.add(response.timings.duration);
    recordResult(response, 'customer endpoint returns successfully');
  }
}

function readEmployeeJourney(context) {
  if (!context.employeeToken) return;

  const requests = [
    ['GET', `${BASE_URL}${withLimit('/api/employees/dashboard')}`, null, authedParams(context.employeeToken, 'employee', '/api/employees/dashboard')],
    ['GET', `${BASE_URL}/api/employees/profile`, null, authedParams(context.employeeToken, 'employee', '/api/employees/profile')],
    ['GET', `${BASE_URL}${withLimit('/api/employees/orders')}`, null, authedParams(context.employeeToken, 'employee', '/api/employees/orders')],
    ['GET', `${BASE_URL}/api/employees/wallet`, null, authedParams(context.employeeToken, 'employee', '/api/employees/wallet')],
  ];

  for (const response of http.batch(requests)) {
    employeeDuration.add(response.timings.duration);
    readDuration.add(response.timings.duration);
    recordResult(response, 'employee endpoint returns successfully');
  }
}

function readIncidentListing(context) {
  const endpoint = context.adminToken ? '/api/admin/reports' : '/api/orders';
  const response = http.get(`${BASE_URL}${withLimit(endpoint)}`, {
    headers: authHeaders(context.adminToken),
    tags: { workload: 'read-heavy', endpoint },
  });

  readDuration.add(response.timings.duration);
  recordResult(response, 'incident listing returns successfully');
}

function readOperationalLookups(context) {
  const requests = [
    ['GET', `${BASE_URL}${withLimit('/api/orders')}`, null, taggedParams('read-heavy', '/api/orders')],
    ['GET', `${BASE_URL}${withLimit('/api/shipments')}`, null, taggedParams('read-heavy', '/api/shipments')],
    ['GET', `${BASE_URL}/api/feedbacks/summary`, null, taggedParams('read-heavy', '/api/feedbacks/summary')],
    ['GET', `${BASE_URL}/api/orders/regions`, null, taggedParams('read-heavy', '/api/orders/regions')],
    ['GET', `${BASE_URL}/api/newsletter/employee/status`, null, taggedParams('read-heavy', '/api/newsletter/employee/status')],
    ['GET', `${BASE_URL}/api/wallets`, null, taggedParams('read-heavy', '/api/wallets')],
  ];

  for (const response of http.batch(requests)) {
    readDuration.add(response.timings.duration);
    recordResult(response, 'operational lookup returns successfully');
  }
}

function readPublicContent() {
  const requests = [
    ['GET', `${BASE_URL}/`, null, taggedParams('public', '/')],
    ['GET', `${BASE_URL}/api/articles`, null, taggedParams('public', '/api/articles')],
    ['GET', `${BASE_URL}/api/photogalleries`, null, taggedParams('public', '/api/photogalleries')],
    ['GET', `${BASE_URL}/api/site-content/about`, null, taggedParams('public', '/api/site-content/about')],
    ['GET', `${BASE_URL}/api/vehicles`, null, taggedParams('public', '/api/vehicles')],
  ];

  for (const response of http.batch(requests)) {
    readDuration.add(response.timings.duration);
    recordResult(response, 'public endpoint returns successfully');
  }
}

function readTracking(context) {
  if (!context.customerToken) return;

  const trackingNumber = randomItem(context.trackingNumbers);
  const response = http.get(`${BASE_URL}/api/tracking/number/${trackingNumber}`, {
    headers: authHeaders(context.customerToken),
    tags: { workload: 'tracking', endpoint: '/api/tracking/number/:trackingNumber' },
  });

  trackingDuration.add(response.timings.duration);
  recordResult(response, 'tracking lookup returns successfully');
}

function submitReport(context) {
  const customerId = randomItem(context.customerIds) || DEFAULT_CUSTOMER_ID;
  const payload = {
    customer_id: customerId,
    rating: 4 + Math.floor(Math.random() * 2),
    customer_location: 'Load Test',
    comment: `k6 performance report ${Date.now()}-${exec.vu.idInTest}-${exec.scenario.iterationInTest}`,
  };

  const response = http.post(`${BASE_URL}/api/feedbacks`, JSON.stringify(payload), {
    headers: jsonHeaders(),
    tags: { workload: 'write-heavy', endpoint: '/api/feedbacks' },
  });

  writeDuration.add(response.timings.duration);
  recordResult(response, 'report submission created successfully', 201);

  if (response.status === 201) {
    reportsSubmitted.add(1);
  }
}

function submitOrder(context) {
  const token = context.customerToken;
  const regionId = randomItem(context.regionIds) || 1;
  const payload = {
    region_id: regionId,
    sender_name: 'k6 Load Test Sender',
    sender_phone: '0599000999',
    sender_address: 'Nablus - Load Test',
    receiver_name: 'k6 Load Test Receiver',
    receiver_phone: '0599000888',
    receiver_address: 'Ramallah - Load Test',
    origin_city: 'Nablus',
    destination_city: 'Ramallah',
    package_size: 'small',
    delivery_speed: 'normal',
    is_fragile: false,
    declared_value: 25,
    package_description: `k6 generated order ${Date.now()}`,
  };

  const response = http.post(`${BASE_URL}/api/orders`, JSON.stringify(payload), {
    headers: token ? { ...jsonHeaders(), ...authHeaders(token) } : jsonHeaders(),
    tags: { workload: 'write-heavy', endpoint: '/api/orders' },
  });

  writeDuration.add(response.timings.duration);
  recordResult(response, 'order submission created successfully', 201);

  if (response.status === 201) {
    ordersSubmitted.add(1);
  }
}

function writeLowRiskCustomerActions(context) {
  if (!context.customerToken) return;

  const response = http.post(
    `${BASE_URL}/api/newsletter/subscribe`,
    JSON.stringify({ email: `k6-${exec.vu.idInTest}@phoenix-load.local` }),
    {
      headers: { ...jsonHeaders(), ...authHeaders(context.customerToken) },
      tags: { workload: 'write-light', endpoint: '/api/newsletter/subscribe' },
    }
  );

  writeDuration.add(response.timings.duration);
  recordResult(response, 'newsletter subscription returns successfully', response.status === 201 ? 201 : 200);
}

function loadReferenceData(context) {
  const customersResponse = http.get(`${BASE_URL}${withLimit('/api/customers')}`, taggedParams('setup', '/api/customers'));
  if (customersResponse.status === 200) {
    const customers = customersResponse.json('data') || [];
    const ids = customers.map((customer) => customer.id).filter(Boolean);
    if (ids.length) context.customerIds = ids;
  }

  const regionsResponse = http.get(`${BASE_URL}/api/orders/regions`, taggedParams('setup', '/api/orders/regions'));
  if (regionsResponse.status === 200) {
    const regions = regionsResponse.json('data') || [];
    const ids = regions.map((region) => region.id).filter(Boolean);
    if (ids.length) context.regionIds = ids;
  }

  const ordersResponse = http.get(`${BASE_URL}${withLimit('/api/orders')}`, taggedParams('setup', '/api/orders'));
  if (ordersResponse.status === 200) {
    const orders = ordersResponse.json('data') || [];
    context.orderIds = orders.map((order) => order.id).filter(Boolean).slice(0, 25);
  }

  const shipmentsResponse = http.get(`${BASE_URL}${withLimit('/api/shipments')}`, taggedParams('setup', '/api/shipments'));
  if (shipmentsResponse.status === 200) {
    const shipments = shipmentsResponse.json('data') || [];
    const ids = shipments.map((shipment) => shipment.id).filter(Boolean);
    const trackingNumbers = shipments.map((shipment) => shipment.tracking_number).filter(Boolean);
    if (ids.length) context.shipmentIds = ids.slice(0, 25);
    if (trackingNumbers.length) context.trackingNumbers = trackingNumbers.slice(0, 25);
  }

  if (context.customerToken) {
    const myOrdersResponse = http.get(`${BASE_URL}/api/orders/me`, authedParams(context.customerToken, 'setup', '/api/orders/me'));
    if (myOrdersResponse.status === 200) {
      const orders = myOrdersResponse.json('data') || [];
      const trackingNumbers = orders
        .map((order) => order.shipment?.tracking_number)
        .filter(Boolean);

      if (trackingNumbers.length) context.trackingNumbers = trackingNumbers.slice(0, 25);
    }
  }
}

function login(email, password) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { workload: 'setup-auth', endpoint: '/api/auth/login' } }
  );

  return response.status === 200 ? response.json('token') : null;
}

function recordResult(response, label, expectedStatus = 200) {
  const ok = check(response, {
    [label]: (res) => res.status === expectedStatus,
  });

  failureRate.add(!ok);
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

function authHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function taggedParams(workload, endpoint) {
  return {
    tags: { workload, endpoint },
  };
}

function authedParams(token, workload, endpoint) {
  return {
    headers: authHeaders(token),
    tags: { workload, endpoint },
  };
}

function withLimit(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}limit=${LIST_LIMIT}`;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}
