/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Class representing a Lighthouse report for a PWA
 *
 * lighthouseInfo is a JSON with:
 *   lighthouseInfo.name {string}
 *   lighthouseInfo.description {string}
 *	 lighthouseInfo.totalScore {number}
 *	 lighthouseInfo.scores {array}
 */
class Lighthouse {
  constructor(pwaId, absoluteStartUrl, lighthouseInfo) {
    this.pwaId = pwaId;
    this.absoluteStartUrl = absoluteStartUrl;
    this.lighthouseInfo = lighthouseInfo;
    this.totalScore = lighthouseInfo.totalScore;
    this.date = (new Date()).toISOString().slice(0, 10);
    this.id = this.pwaId + '-' + this.date;
  }
}

module.exports = Lighthouse;
