// Offline diagnostic for the pinned SDK. No key, camera capture, or measurement is started.
const path = require('node:path');
const { MetricType } = require('@smartspectra/node-sdk');
const { DeviceReadinessPolicies } = require(path.join(path.dirname(require.resolve('@smartspectra/node-sdk')), 'device-readiness.js'));
const names = Object.fromEntries(Object.entries(MetricType).map(([name, value]) => [value, name]));
for (const workload of ['breathing', 'breathing_pulse', 'breathing_pulse_eda', 'full']) {
  const policy = DeviceReadinessPolicies.reference720p30(workload);
  console.log(JSON.stringify({ workload, version: policy.version, metrics: policy.metrics.map(metric => ({ name: names[metric.metricId], requiredReferenceOutput: metric.outputRequired })) }));
}
