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
import {authInit} from './gapi.es6.js';

export default class SignIn {
  constructor(window, config) {
    this.window = window;
    this.config = config;
    this._init();
    this._setupEventHandlers();
  }

  _init() {
    /* eslint-disable camelcase */
    const params = {
      scope: 'profile',
      client_id: this.config.client_id,
      fetch_basic_profile: false
    };
    /* eslint-enable camelcase */

    return authInit(params).then(auth => {
      this.auth = auth;
      this._setupUserChangeEvents(auth);
      return this;
    });
  }

  _setupUserChangeEvents(auth) {
    this.window.auth = auth; // TODO: Temporary Hack to Make 'ui/client-transition.js' work.
    // Fire 'userchange' event on page load (not just when status changes)
    this.window.dispatchEvent(new CustomEvent('userchange', {
      detail: auth.currentUser.get()
    }));

    // Fire 'userchange' event when status changes
    auth.currentUser.listen(user => {
      window.dispatchEvent(new CustomEvent('userchange', {
        detail: user
      }));
    });
  }

  get signedIn() {
    return this.user && this.user.isSignedIn();
  }

  get user() {
    if (!this.auth) {
      return null;
    }
    return this.auth.currentUser.get();
  }

  get idToken() {
    if (!this.signedIn) {
      return null;
    }
    return this.user.getAuthResponse().id_token;
  }

  signIn() {
    if (!this.auth) {
      console.log('Auth not ready!');
      return;
    }
    this.auth.signIn();
  }

  signOut() {
    if (!this.auth) {
      console.log('Auth not ready!');
      return;
    }
    this.auth.signOut();
  }

  /**
   * All elements with class .gulliver-signedin-aware will:
   * have a 'signedin' dataset property that reflects the current signed in state.
   * receive a 'change' event whenever the state changes.
   */
  _setupEventHandlers() {
    const body = this.window.document.querySelector('body');
    this.window.addEventListener('userchange', e => {
      const user = e.detail;
      if (user.isSignedIn()) {
        body.setAttribute('signedIn', 'true');
      } else {
        body.removeAttribute('signedIn');
      }
    });
  }
}
