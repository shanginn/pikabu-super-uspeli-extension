import Surreal from 'surrealdb.js';

export default class DatabaseConnection {
  static #instance = null;
  static #connectPromise = null;

  constructor() {
    throw new Error('This class cannot be instantiated.');
  }

  static async #connect() {
    await Surreal.Instance.connect('https://surreal-db.fly.dev/rpc');

    const namespace = 'pikabu';
    const database = 'super-uspeli';

    let token = await this.#getStoredToken();
    let isAuthenticated = false;

    if (token) {
      try {
        await Surreal.Instance.authenticate(token);
        isAuthenticated = true;
      } catch (error) {
        console.error('Error authenticating with token:', error);
      }
    }

    if (!isAuthenticated) {
      let credentials;

      try {
        credentials =
          (await this.#getStoredCredentials()) ||
          (await this.#createRandomUser());
        token = await this.#authenticateWithCredentials(
          credentials,
          namespace,
          database
        );
        await this.#storeToken(token);
      } catch (error) {
        console.error('Error authenticating with credentials:', error);

        await this.#removeStoredCredentials();
        await this.#clearToken();

        credentials = await this.#createRandomUser();
        token = await this.#authenticateWithCredentials(
          credentials,
          namespace,
          database
        );
        await this.#storeToken(token);
      }
    }

    await Surreal.Instance.use(namespace, database);

    this.#instance = Surreal.Instance;
  }

  static async #clearToken() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['token', 'expiration'], resolve);
    });
  }

  static async #getStoredToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['token', 'expiration'], (result) => {
        if (result.token && result.expiration > Date.now()) {
          resolve(result.token);
        } else {
          resolve(null);
        }
      });
    });
  }

  static async #authenticateWithCredentials(credentials, namespace, database) {
    const { username, password, isNewUser } = credentials;
    const action = isNewUser ? 'signup' : 'signin';

    const token = await Surreal.Instance[action]({
      NS: namespace,
      DB: database,
      SC: 'allusers',
      user: username,
      pass: password,
    });

    return token;
  }

  static async #createRandomUser() {
    const { username, password } = this.#generateRandomCredentials();
    await this.#storeCredentials(username, password);
    return { username, password, isNewUser: true };
  }

  static async #getStoredCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['username', 'password'], (result) => {
        if (result.username && result.password) {
          resolve({ username: result.username, password: result.password });
        } else {
          resolve(null);
        }
      });
    });
  }

  static async #storeToken(token) {
    const expiration = this.#getTokenExpiration(token);
    if (!expiration) {
      throw new Error('Invalid token or expiration not found.');
    }
    return new Promise((resolve) => {
      chrome.storage.local.set({ token, expiration }, resolve);
    });
  }

  static #getTokenExpiration(token) {
    try {
      const [, payload] = token.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      const expiration = decodedPayload.exp * 1000; // Convert to milliseconds

      return expiration;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  static async #storeCredentials(username, password) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ username, password }, resolve);
    });
  }

  static #generateRandomCredentials() {
    function randomString(length) {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    const username = randomString(10);
    const password = randomString(20);

    return { username, password };
  }

  static async #removeStoredCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['username', 'password'], resolve);
    });
  }

  static async createInstance() {
    await this.init();

    return this.#instance;
  }

  static get instance() {
    if (!this.#instance) {
      throw new Error(
        'Instance not initialized. Call `DatabaseConnection.init()` first.'
      );
    }

    return this.#instance;
  }

  static async init() {
    if (!this.#instance) {
      if (!this.#connectPromise) {
        this.#connectPromise = this.#connect();
      }

      await this.#connectPromise;
    }
  }
}
