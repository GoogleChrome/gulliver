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

export default class Route {
  constructor(matchRegex) {
    this.matchRegex = matchRegex;
  }

  matches(url) {
    return this.matchRegex.test(url);
  }

  getContent(url) {
    const contentUrl = this._getContentOnlyUrl(url);
    return fetch(contentUrl)
      .then(response => response.text());
  }

  transitionOut(container) {
    container.classList.add('transition');
    console.log('Transitin Out');
  }

  transitionIn(container) {
    container.classList.remove('transition');
    console.log('Transitin In');
  }

  _getContentOnlyUrl(url) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'contentOnly=true';
  }
}
