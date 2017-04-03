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

/* eslint-env browser */

export default class OfflineSupport {

  constructor(window, router) {
    this.window = window;
    this.router = router;
    this._setupEventhandlers();
  }

  /**
   * All elements with class .gulliver-online-aware will:
   * have an 'online' dataset property that reflects the current online state.
   * receive a 'change' event whenever the state changes.
   */
  _setupEventhandlers() {
    const body = this.window.document.querySelector('body');
    this.window.addEventListener('online', () => {
      body.removeAttribute('offline');
    });

    this.window.addEventListener('offline', () => {
      body.setAttribute('offline', 'true');
      this.markAsCached(this.window.document.querySelectorAll('.offline-aware'));
    });
  }

  /**
   * Check if a Url is navigable.
   * @param url the url to be checke for availability
   * @returns true if the user is online or the URL is cached
   */
  isAvailable(href) {
    if (!href || this.window.navigator.onLine) return Promise.resolve(true);
    return caches.match(href)
      .then(response => response.status === 200)
      .catch(() => false);
  }

  /**
   * Checks if the href on the anchor is available in the cached
   * and marks the element with the cached attribute.
   *
   * If the url is available, the `cached` attribute is added with
   * the value `true`. Otherwise, the `cached` attribute is removed.
   * @param {@NodeList} a list of anchors.
   */
  markAsCached(anchors) {
    anchors.forEach(anchor => {
      if (!anchor.href) {
        return;
      }
      const contentHref = this.router.contentOnlyUrl(anchor.href);
      this.isAvailable(contentHref).then(available => {
        if (available) {
          anchor.setAttribute('cached', 'true');
          return;
        }
        anchor.removeAttribute('cached');
      });
    });
  }
}
