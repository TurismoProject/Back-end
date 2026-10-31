import { Buffer } from 'buffer';

// Polyfill for SlowBuffer on Node.js 26+ where it was deprecated/removed
const bufferModule = require('buffer');
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = Buffer;
}
