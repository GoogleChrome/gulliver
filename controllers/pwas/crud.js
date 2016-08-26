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
const pwaModel = require('../../models/pwa');
const router = express.Router(); // eslint-disable-line new-cap
const LIST_PAGE_SIZE = 10;

/**
 * GET /pwas/add
 *
 * Display a page of PWAs (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  function callback(err, entities, cursor) {
    if (err) {
      return next(err);
    }

    res.render('pwas/list.hbs', {
      pwas: entities,
      nextPageToken: cursor
    });
  }
  pwaModel.list(LIST_PAGE_SIZE, req.query.pageToken, callback);
});

/**
 * GET /pwas/add
 *
 * Display a form for creating a PWA.
 */
router.get('/add', (req, res) => {
  res.render('pwas/form.hbs', {
    pwa: {},
    action: 'Add'
  });
});

/**
 * POST /pwas/add
 *
 * Create a PWA.
 */
// [START add]
router.post('/add', (req, res, next) => {
  const data = req.body;

  const callback = (err, savedData) => {
    if (err) {
      if (typeof err === 'number') {
        switch (err) {
          case pwaModel.E_ALREADY_EXISTS:
            res.render('pwas/form.hbs', {
              pwa: {
                manifestUrl: data.manifestUrl
              },
              error: 'manifest already exists'
            });
            return;
          case pwaModel.E_MANIFEST_ERROR:
            res.render('pwas/form.hbs', {
              pwa: {
                manifestUrl: data.manifestUrl
              },
              error: 'error loading manifest' // could be 404, not JSON, domain does not exist
            });
            return;
          default:
        }
      }
      return next(err);
    }
    res.redirect(req.baseUrl + '/' + savedData.id);
  };

  pwaModel.save(data, callback);
});
// [END add]

/**
 * GET /pwas/:id/edit
 *
 * Display a pwa for editing.
 */
router.get('/:pwa/edit', (req, res, next) => {
  pwaModel.find(req.params.pwa, (err, entity) => {
    if (err) {
      return next(err);
    }

    res.render('pwas/form.hbs', {
      pwa: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /pwas/:id/edit
 *
 * Update a PWA.
 */

router.post('/:pwa/edit', (req, res, next) => {
  const data = req.body;
  data.id = req.params.pwa;

  pwaModel.save(data, (err, savedData) => {
    if (err) {
      return next(err);
    }
    res.redirect(req.baseUrl + '/' + savedData.id);
  });
});

/**
 * GET /pwas/:id
 *
 * Display a PWA.
 */
router.get('/:pwa', (req, res, next) => {
  pwaModel.find(req.params.pwa, (err, entity) => {
    if (err) {
      // Not really an error: the pwa wasn't found in the db. Fall through to 404 page.
      return next();
    }

    res.render('pwas/view.hbs', {
      pwa: entity
    });
  });
});

/**
 * GET /pwas/:id/delete
 *
 * Delete a PWA.
 */
router.get('/:pwa/delete', (req, res, next) => {
  pwaModel.delete(req.params.pwa, err => {
    if (err) {
      return next(err);
    }
    res.redirect(req.baseUrl);
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
