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

'use strict';

const express = require('express');
const pwaLib = require('../lib/pwa');
const verifyIdToken = require('../lib/verify-id-token');
const lighthouseLib = require('../lib/lighthouse');
const Pwa = require('../models/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const libMetadata = require('../lib/metadata');

const LIST_PAGE_SIZE = 32;
const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_SORT_ORDER = 'newest';

/**
 * GET /
 *
 * Display a page of PWAs (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  const pageNumber = parseInt(req.query.page, 10) || DEFAULT_PAGE_NUMBER;
  const sortOrder = req.query.sort || DEFAULT_SORT_ORDER;
  const start = parseInt(req.query.start, 10) || (pageNumber - 1) * LIST_PAGE_SIZE;
  const limit = parseInt(req.query.limit, 10) || LIST_PAGE_SIZE;
  const end = pageNumber * LIST_PAGE_SIZE;
  const contentOnly = false || req.query.contentOnly;
  let pwaCount = 0;
  pwaLib.count()
    .then(count => {
      pwaCount = count;
      return pwaLib.list(start, limit, sortOrder);
    })
    .then(result => {
      let arg = Object.assign(libMetadata.fromRequest(req), {
        title: 'PWA Directory',
        description: 'PWA Directory: A Directory of Progressive Web Apps',
        pwas: result.pwas,
        hasNextPage: result.hasMore,
        hasPreviousPage: pageNumber > 1,
        nextPageNumber: pageNumber + 1,
        previousPageNumber: pageNumber - 1,
        currentPageNumber: pageNumber,
        sortOrder: sortOrder,
        showNewest: sortOrder === 'newest',
        showScore: sortOrder === 'score',
        pwaCount: pwaCount,
        startPwa: start + 1,
        endPwa: Math.min(pwaCount, end),
        mainPage: true
      });
      if (contentOnly) {
        res.render('includes/list_content', arg);
      } else {
        res.render('pwas/list.hbs', arg);
      }
    }).catch(err => {
      next(err);
    });
});

/**
 * GET /pwas/add
 *
 * Display a form for creating a PWA.
 */
router.get('/add', (req, res) => {
  const contentOnly = false || req.query.contentOnly;
  let arg = Object.assign(libMetadata.fromRequest(req), {
    title: 'PWA Directory - Submit a PWA',
    description: 'PWA Directory: Submit a Progressive Web Apps',
    pwa: {},
    action: 'Add',
    backlink: true,
    submit: true
  });
  if (contentOnly) {
    res.render('includes/form_content', arg);
  } else {
    res.render('pwas/form.hbs', arg);
  }
});

/**
 * POST /pwas/add
 *
 * Create a PWA.
 */
router.post('/add', (req, res, next) => {
  const contentOnly = false || req.query.contentOnly;
  let manifestUrl = req.body.manifestUrl.trim();
  if (manifestUrl.startsWith('http://')) {
    manifestUrl = manifestUrl.replace('http://', 'https://');
  }
  const idToken = req.body.idToken;
  let pwa = new Pwa(manifestUrl);

  if (!manifestUrl || !idToken) {
    let arg = Object.assign(libMetadata.fromRequest(req), {
      pwa,
      error: (manifestUrl) ? 'user not logged in' : 'no manifest provided'
    });
    if (contentOnly) {
      res.render('includes/form_content', arg);
    } else {
      res.render('pwas/form.hbs', arg);
    }
    return;
  }

  verifyIdToken.verifyIdToken(idToken)
    .then(user => {
      pwa.setUser(user);
      return pwaLib.createOrUpdatePwa(pwa);
    })
    .then(savedData => {
      res.redirect(req.baseUrl + '/' + savedData.id);
      return;
    })
    .catch(err => {
      if (typeof err === 'number') {
        switch (err) {
          case pwaLib.E_MANIFEST_INVALID_URL:
            err = `pwa.manifestUrl [${pwa.manifestUrl}] is not a valid URL`;
            break;
          case pwaLib.E_MISING_USER_INFORMATION:
            err = 'Missing user information';
            break;
          case pwaLib.E_MANIFEST_URL_MISSING:
            err = 'Missing manifestUrl';
            break;
          case pwaLib.E_NOT_A_PWA:
            err = 'pwa is not an instance of Pwa';
            break;
          default:
            return next(err);
        }
      }
      // Transform err from an array of strings (in a particular format) to a
      // comma-separated string.
      if (Array.isArray(err)) {
        const s = err.map(e => {
          const m = e.match(/^ERROR:\s+(.*)\.$/);
          return m ? m[1] : e; // if no match (format changed?), just return the string
        }).join(', ');
        err = s;
      }
      let arg = Object.assign(libMetadata.fromRequest(req), {
        pwa,
        error: err
      });
      if (contentOnly) {
        res.render('includes/form_content', arg);
      } else {
        res.render('pwas/form.hbs', arg);
      }
      return;
    });
});

/**
 * GET /pwas/:id
 *
 * Display a PWA.
 */
router.get('/:pwa', (req, res, next) => {
  const contentOnly = false || req.query.contentOnly;
  pwaLib.find(req.params.pwa)
    .then(pwa => {
      lighthouseLib.findByPwaId(req.params.pwa)
      .then(lighthouse => {
        let arg = Object.assign(libMetadata.fromRequest(req), {
          pwa: pwa,
          lighthouse: lighthouse,
          rawManifestJson: JSON.parse(pwa.manifest.raw),
          title: 'PWA Directory: ' + pwa.name,
          description: 'PWA Directory: ' + pwa.name + ' - ' + pwa.description,
          backlink: true
        });
        if (contentOnly) {
          res.render('includes/view_content', arg);
        } else {
          res.render('pwas/view.hbs', arg);
        }
      });
    })
    .catch(err => {
      err.status = 404;
      return next(err);
    });
});

/**
 * Errors on "/pwas/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
