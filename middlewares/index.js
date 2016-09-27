/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const crypto = require('crypto');
const csp = require('helmet-csp');

router.use((req, res, next) => {
  // The PWA controller only needs text/html, others may need json
  res.setHeader('Content-Type', 'text/html');

  // Content Security Policy directives and two nonce for inline scripts
  req.nonce1 = crypto.randomBytes(16).toString('hex');
  req.nonce2 = crypto.randomBytes(16).toString('hex');
  router.use(csp({
    directives: {
      defaultSrc: ['\'self\'', 'accounts.google.com', 'apis.google.com'],
      scriptSrc: ['\'self\'', '\'unsafe-eval\'', 'apis.google.com', '*.google-analytics.com',
        '\'nonce-' + req.nonce1 + '\'',
        '\'nonce-' + req.nonce2 + '\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'cdnjs.cloudflare.com/ajax/libs/font-awesome/'],
      fontSrc: ['\'self\'', 'cdnjs.cloudflare.com/ajax/libs/font-awesome/'],
      imgSrc: ['\'self\'', 'storage.googleapis.com', '*.google-analytics.com']
    }
  }));
  next();
});

module.exports = router;
